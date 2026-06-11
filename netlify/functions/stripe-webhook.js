/* ═══════════════════════════════════════════════════════════════
   Stripe webhook — provisions course_access after payment
   Environment variables required (set in Netlify dashboard):
     STRIPE_WEBHOOK_SECRET   — from Stripe Dashboard → Webhooks
     SUPABASE_URL            — your project URL
     SUPABASE_SERVICE_KEY    — service role key (not anon key)
     TSE_COURSE_ID           — UUID of the Speaking Confidence Programme
     GUIDE_COURSE_ID         — UUID of the Quiet Influence bundle
     RESEND_API_KEY          — from Resend Dashboard → API Keys
   Product routing: add metadata {"course_id": "<uuid>"} to each
   Stripe payment link. Falls back to TSE_COURSE_ID if absent.
   ═══════════════════════════════════════════════════════════════ */

const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendCourseConfirmationEmail(toEmail) {
  await resend.emails.send({
    from: 'hello@speakingedgeglobal.com',
    to: toEmail,
    subject: 'Welcome to the Speaking Confidence Programme',
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2c2c2c; line-height: 1.7;">
        <p>Hi there,</p>
        <p>Thank you so much for joining the <strong>Speaking Confidence Programme</strong> — I'm really glad you're here.</p>
        <p>Your access is now active. Head over to your dashboard to get started whenever you're ready — there's no rush, and you can work through the material entirely at your own pace.</p>
        <p>If you have any questions as you go, don't hesitate to reach out. I'm here to support you.</p>
        <p>With warm wishes,<br>Maya</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0 16px;">
        <p style="font-size: 13px; color: #888;">
          Questions? You can always <a href="https://www.speakingedgeglobal.com/contact.html" style="color: #888;">get in touch here</a>.
        </p>
      </div>
    `,
  });
}

async function sendGuideConfirmationEmail(toEmail) {
  await resend.emails.send({
    from: 'hello@speakingedgeglobal.com',
    to: toEmail,
    subject: 'Your Quiet Influence guide is ready',
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2c2c2c; line-height: 1.7;">
        <p>Hi there,</p>
        <p>Thank you for getting <strong>Quiet Influence</strong> — I hope it gives you exactly what you need.</p>
        <p>Your access is now active. You can read the guide online and download the PDF from your account at any time.</p>
        <p>If you have any questions, don't hesitate to get in touch.</p>
        <p>With warm wishes,<br>Maya</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0 16px;">
        <p style="font-size: 13px; color: #888;">
          Questions? <a href="https://www.speakingedgeglobal.com/contact.html" style="color: #888;">Get in touch here</a>.
        </p>
      </div>
    `,
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Verify Stripe signature
  const sig = event.headers['stripe-signature'];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Only act on completed checkouts
  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Ignored' };
  }

  const session       = stripeEvent.data.object;
  const clientRefId   = session.client_reference_id;
  const customerEmail = session.customer_details?.email;
  const courseId      = session.metadata?.course_id || process.env.TSE_COURSE_ID;
  const isGuide       = courseId === process.env.GUIDE_COURSE_ID;
  const sid           = session.id;

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  // ── Fast path: client_reference_id is the Supabase user ID ──────────────────
  if (clientRefId) {
    console.log(`[webhook ${sid}] fast path — client_reference_id=${clientRefId} course=${courseId}`);

    const { error: accessError } = await db.from('course_access').upsert({
      user_id:           clientRefId,
      course_id:         courseId,
      granted_at:        new Date().toISOString(),
      expires_at:        expiresAt.toISOString(),
      stripe_session_id: sid,
    }, { onConflict: 'user_id,course_id' });

    if (accessError) {
      console.error(`[webhook ${sid}] course_access error:`, accessError.message);
      return { statusCode: 500, body: 'Database error' };
    }

    if (customerEmail) {
      isGuide ? await sendGuideConfirmationEmail(customerEmail) : await sendCourseConfirmationEmail(customerEmail);
    }
    console.log(`[webhook ${sid}] access granted (fast path) to ${clientRefId}`);
    return { statusCode: 200, body: 'Access granted (fast path)' };
  }

  // ── Fallback: look up by email ───────────────────────────────────────────────
  if (!customerEmail) {
    console.error(`[webhook ${sid}] no client_reference_id and no customer email — skipped`);
    return { statusCode: 200, body: 'No identifiers — skipped' };
  }

  console.log(`[webhook ${sid}] fallback path — looking up by email ${customerEmail}`);

  const { data: usersData, error: lookupError } = await db.auth.admin.listUsers();
  if (lookupError) {
    console.error(`[webhook ${sid}] listUsers error:`, lookupError.message);
    return { statusCode: 500, body: 'Database error' };
  }

  const user = usersData?.users?.find(u => u.email === customerEmail);

  if (!user) {
    const { error: pendingError } = await db.from('pending_access').upsert({
      email:             customerEmail,
      course_id:         courseId,
      stripe_session_id: sid,
      expires_at:        expiresAt.toISOString(),
      created_at:        new Date().toISOString(),
    }, { onConflict: 'email,course_id' });

    if (pendingError) {
      console.error(`[webhook ${sid}] pending_access error:`, pendingError.message);
      return { statusCode: 500, body: 'Database error' };
    }

    console.log(`[webhook ${sid}] pending access recorded for ${customerEmail}`);
    isGuide ? await sendGuideConfirmationEmail(customerEmail) : await sendCourseConfirmationEmail(customerEmail);
    return { statusCode: 200, body: 'Pending access recorded' };
  }

  const { error: accessError } = await db.from('course_access').upsert({
    user_id:           user.id,
    course_id:         courseId,
    granted_at:        new Date().toISOString(),
    expires_at:        expiresAt.toISOString(),
    stripe_session_id: sid,
  }, { onConflict: 'user_id,course_id' });

  if (accessError) {
    console.error(`[webhook ${sid}] course_access error:`, accessError.message);
    return { statusCode: 500, body: 'Database error' };
  }

  console.log(`[webhook ${sid}] access granted (fallback) to ${user.id} (${customerEmail})`);
  isGuide ? await sendGuideConfirmationEmail(customerEmail) : await sendCourseConfirmationEmail(customerEmail);
  return { statusCode: 200, body: 'Access granted (fallback)' };
};
