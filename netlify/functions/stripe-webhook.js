/* ═══════════════════════════════════════════════════════════════
   Stripe webhook — provisions course_access after payment
   Environment variables required (set in Netlify dashboard):
     STRIPE_WEBHOOK_SECRET   — from Stripe Dashboard → Webhooks
     SUPABASE_URL            — your project URL
     SUPABASE_SERVICE_KEY    — service role key (not anon key)
     TSE_COURSE_ID           — UUID of the course row in Supabase
     RESEND_API_KEY          — from Resend Dashboard → API Keys
   ═══════════════════════════════════════════════════════════════ */

const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendConfirmationEmail(toEmail) {
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

  const session = stripeEvent.data.object;
  const customerEmail = session.customer_details?.email;

  if (!customerEmail) {
    console.error('No customer email in session:', session.id);
    return { statusCode: 200, body: 'No email — skipped' };
  }

  // Look up the Supabase user by email, then grant access
  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Find auth user by email
  const { data: usersData, error: lookupError } = await db.auth.admin.listUsers();
  if (lookupError) {
    console.error('Error listing users:', lookupError.message);
    return { statusCode: 500, body: 'Database error' };
  }

  const user = usersData?.users?.find(u => u.email === customerEmail);

  if (!user) {
    // User hasn't created an account yet — store a pending grant keyed by email.
    // When they sign up, the login flow should check this table.
    const pendingExpiresAt = new Date();
    pendingExpiresAt.setMonth(pendingExpiresAt.getMonth() + 6);

    const { error: pendingError } = await db
      .from('pending_access')
      .upsert({
        email:      customerEmail,
        course_id:  process.env.TSE_COURSE_ID,
        stripe_session_id: session.id,
        expires_at: pendingExpiresAt.toISOString(),
        created_at: new Date().toISOString(),
      }, { onConflict: 'email,course_id' });

    if (pendingError) {
      console.error('Error writing pending_access:', pendingError.message);
      return { statusCode: 500, body: 'Database error' };
    }

    console.log(`Pending access recorded for ${customerEmail}`);
    await sendConfirmationEmail(customerEmail);
    return { statusCode: 200, body: 'Pending access recorded' };
  }

  // Grant course access — 6-month expiry
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  const { error: accessError } = await db
    .from('course_access')
    .upsert({
      user_id:    user.id,
      course_id:  process.env.TSE_COURSE_ID,
      granted_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      stripe_session_id: session.id,
    }, { onConflict: 'user_id,course_id' });

  if (accessError) {
    console.error('Error granting course_access:', accessError.message);
    return { statusCode: 500, body: 'Database error' };
  }

  console.log(`Course access granted to user ${user.id} (${customerEmail})`);
  await sendConfirmationEmail(customerEmail);
  return { statusCode: 200, body: 'Access granted' };
};
