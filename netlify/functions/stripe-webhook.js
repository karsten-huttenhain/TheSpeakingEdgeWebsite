/* ═══════════════════════════════════════════════════════════════
   Stripe webhook — provisions course_access after payment
   Environment variables required (set in Netlify dashboard):
     STRIPE_SECRET_KEY       — live secret key
     STRIPE_WEBHOOK_SECRET   — from Stripe Dashboard → Webhooks
     SUPABASE_URL            — your project URL
     SUPABASE_SERVICE_KEY    — service role key (not anon key)
     TSE_COURSE_ID           — UUID of the Speaking Confidence Programme
     GUIDE_COURSE_ID         — UUID of the Quiet Influence guide
     RESEND_API_KEY          — from Resend Dashboard → API Keys
   Optional (override the baked-in fallbacks below):
     GUIDE_PRICE_ID           — Stripe Price ID for the guide
     COURSE_PRICE_ID          — Stripe Price ID for the programme
     ADMIN_NOTIFICATION_EMAIL — where "unresolved product" alerts are sent
                                (default speaking.edge.global@gmail.com)

   Product routing (fail CLOSED):
     1. Expand the session's line items and map the Stripe Price ID
        to a course_id (GUIDE_PRICE_ID / COURSE_PRICE_ID).
     2. session.metadata.course_id overrides (1) if it is present AND
        equals a known course_id.
     3. If neither resolves a known product → grant NOTHING, log the
        event loudly, return 200. We never fall back to "the course".

   Expiry: set explicitly once the product is known —
     guide  → permanent (PERMANENT_EXPIRY sentinel)
     course → now + 6 months
   Never NULL, never computed before the product is resolved.
   ═══════════════════════════════════════════════════════════════ */

const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Guide access does not expire. Stored as an explicit far-future
// timestamp so `expires_at` is never NULL and every read path
// (tse-platform.js, download-pdf.js) can treat it uniformly.
const PERMANENT_EXPIRY = '2099-01-01T00:00:00.000Z';

// Course IDs (env-driven, with the known live UUIDs as fallback).
const GUIDE_COURSE_ID = process.env.GUIDE_COURSE_ID || '9bbe3f5f-a1c9-4646-a63a-6f15b1edcf12';
const TSE_COURSE_ID   = process.env.TSE_COURSE_ID   || '7c4c6ad1-97a5-4bb1-a214-8a43387119bd';

// Live Stripe Price IDs → course_id.
const GUIDE_PRICE_ID  = process.env.GUIDE_PRICE_ID  || 'price_1Th9kTGkgQARp0TaK3wj7RDS';
const COURSE_PRICE_ID = process.env.COURSE_PRICE_ID || 'price_1Th9kWGkgQARp0TaMjVfyFhU';

// Where "unresolved product" alerts go. Env-overridable for easy change later.
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'speaking.edge.global@gmail.com';

const PRICE_TO_COURSE = {
  [GUIDE_PRICE_ID]:  GUIDE_COURSE_ID,
  [COURSE_PRICE_ID]: TSE_COURSE_ID,
};
const KNOWN_COURSE_IDS = new Set([GUIDE_COURSE_ID, TSE_COURSE_ID]);

function sixMonthsFromNow() {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString();
}

// The Stripe Price IDs on the session's line items. Returns [] on any error
// (the caller then fails closed). Split out so the unresolved-product alert
// can report the price(s) without a second Stripe call.
async function getSessionPriceIds(sid) {
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(sid, { limit: 20 });
    return (lineItems.data || []).map(li => li.price && li.price.id).filter(Boolean);
  } catch (err) {
    console.error(`[webhook ${sid}] could not list line items: ${err.message}`);
    return [];
  }
}

// Resolve which product this checkout was for. Returns a known
// course_id, or null if it cannot be determined with confidence.
function resolveCourseId(session, sid, priceIds) {
  let resolved = null;
  for (const pid of priceIds) {
    if (PRICE_TO_COURSE[pid]) { resolved = PRICE_TO_COURSE[pid]; break; }
  }

  // ── Override: metadata.course_id, only if it names a known product ─
  const metaCourseId = session.metadata && session.metadata.course_id;
  if (metaCourseId && KNOWN_COURSE_IDS.has(metaCourseId)) {
    if (resolved && resolved !== metaCourseId) {
      console.warn(`[webhook ${sid}] metadata course_id=${metaCourseId} overrides price-derived course_id=${resolved} (prices=${priceIds.join(',') || 'none'})`);
    }
    resolved = metaCourseId;
  } else if (metaCourseId && !KNOWN_COURSE_IDS.has(metaCourseId)) {
    console.warn(`[webhook ${sid}] metadata course_id=${metaCourseId} is not a known product — ignored`);
  }

  if (!resolved) {
    console.error(`[webhook ${sid}] UNRESOLVED PRODUCT — line item prices=${priceIds.join(',') || 'none'}, metadata.course_id=${metaCourseId || 'none'}`);
  }
  return resolved;
}

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

// Notify the admin that a completed checkout could not be matched to a
// product (fail-closed branch). Caller wraps this in try/catch; a broken
// notification must never turn into a Stripe webhook retry.
async function sendUnresolvedProductAlert(d) {
  const priceLine = d.priceIds && d.priceIds.length
    ? d.priceIds.join(', ')
    : 'none on session line items';
  const amountLine = (typeof d.amountTotal === 'number')
    ? `${d.amountTotal} minor units = ${(d.amountTotal / 100).toFixed(2)} ${(d.currency || '').toUpperCase()}`
    : 'unknown';

  const rows = [
    ['Event ID',            d.eid],
    ['Session ID',          d.sid],
    ['Payment Link ID',     d.paymentLink || 'none'],
    ['Price ID(s)',         priceLine],
    ['Amount',              amountLine],
    ['Customer email',      d.customerEmail || 'none'],
    ['client_reference_id', d.clientRefId || 'none'],
    ['Event time (UTC)',    d.eventTime],
  ];

  const text = [
    'A completed Stripe checkout could not be matched to a product, so NO access was granted.',
    '',
    rows.map(([k, v]) => `${(k + ':').padEnd(21)} ${v}`).join('\n'),
    '',
    'If this was a real purchase that should have granted access, add the row manually:',
    '  course_id options:',
    '    7c4c6ad1-97a5-4bb1-a214-8a43387119bd  = Speaking Confidence Programme (course)',
    '    9bbe3f5f-a1c9-4646-a63a-6f15b1edcf12  = Quiet Influence (guide)',
    '  In course_access, upsert { user_id, course_id, granted_at, expires_at, stripe_session_id }:',
    '    - user_id: the Supabase auth user for the customer email above',
    '    - expires_at: course -> now + 6 months; guide -> 2099-01-01 (permanent sentinel)',
    '    - check no row already exists for that user_id + course_id first',
    '',
    'If this was the £495 Live Programme cohort link, no action needed — it is intentionally unmapped.',
  ].join('\n');

  const htmlRows = rows.map(([k, v]) =>
    `<tr><td style="padding:3px 14px 3px 0;color:#888;white-space:nowrap;vertical-align:top;">${k}</td>` +
    `<td style="padding:3px 0;font-family:ui-monospace,Menlo,monospace;">${v}</td></tr>`
  ).join('');

  const html = `
    <div style="font-family:-apple-system,Arial,sans-serif;max-width:640px;margin:0 auto;color:#2c2c2c;line-height:1.6;">
      <p>A completed Stripe checkout <strong>could not be matched to a product</strong>, so <strong>no access was granted</strong>.</p>
      <table style="border-collapse:collapse;font-size:13px;margin:16px 0;">${htmlRows}</table>
      <p style="font-size:13px;">If this was a real purchase that should have granted access, add the row manually:</p>
      <ul style="font-size:13px;">
        <li><code>course_id</code> options:
          <ul>
            <li><code>7c4c6ad1-97a5-4bb1-a214-8a43387119bd</code> = Speaking Confidence Programme (course)</li>
            <li><code>9bbe3f5f-a1c9-4646-a63a-6f15b1edcf12</code> = Quiet Influence (guide)</li>
          </ul>
        </li>
        <li>In <code>course_access</code>, upsert
          <code>{ user_id, course_id, granted_at, expires_at, stripe_session_id }</code> —
          <code>user_id</code> = the Supabase auth user for the customer email above;
          <code>expires_at</code> = course → now + 6 months, guide → <code>2099-01-01</code> (permanent sentinel);
          check no row already exists for that <code>user_id</code> + <code>course_id</code> first.</li>
      </ul>
      <p style="font-size:12px;color:#888;">If this was the £495 Live Programme cohort link, no action needed — it is intentionally unmapped.</p>
    </div>
  `;

  await resend.emails.send({
    from: 'hello@speakingedgeglobal.com',
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: 'TSE — unresolved Stripe purchase (needs review)',
    html,
    text,
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
  const sid           = session.id;
  const eid           = stripeEvent.id;

  // ── Resolve the product — fail CLOSED if we cannot ──────────────────────────
  const priceIds = await getSessionPriceIds(sid);
  const courseId = resolveCourseId(session, sid, priceIds);
  if (!courseId) {
    console.error(
      `[webhook ${sid}] NO ACCESS GRANTED — unresolved product. ` +
      `event=${eid} session=${sid} payment_link=${session.payment_link || 'none'} ` +
      `prices=${priceIds.join(',') || 'none'} ` +
      `amount_total=${session.amount_total} currency=${session.currency} ` +
      `email=${customerEmail || 'none'} client_reference_id=${clientRefId || 'none'}`
    );

    // Notify the admin. Own try/catch: a failed email must NOT become a
    // Stripe retry — we still return 200 below regardless.
    try {
      await sendUnresolvedProductAlert({
        eid,
        sid,
        paymentLink:   session.payment_link,
        priceIds,
        amountTotal:   session.amount_total,
        currency:      session.currency,
        customerEmail,
        clientRefId,
        eventTime:     new Date((stripeEvent.created || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
      });
      console.log(`[webhook ${sid}] unresolved-product alert emailed to ${ADMIN_NOTIFICATION_EMAIL}`);
    } catch (mailErr) {
      console.error(`[webhook ${sid}] FAILED to send unresolved-product alert email: ${mailErr.message}`);
    }

    // 200 so Stripe does not retry indefinitely; the log + email are the alert.
    return { statusCode: 200, body: 'Unresolved product — no access granted' };
  }

  const isGuide   = courseId === GUIDE_COURSE_ID;
  const expiresAt = isGuide ? PERMANENT_EXPIRY : sixMonthsFromNow();

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // ── Fast path: client_reference_id is the Supabase user ID ──────────────────
  if (clientRefId) {
    console.log(`[webhook ${sid}] fast path — client_reference_id=${clientRefId} course=${courseId} expires_at=${expiresAt}`);

    const { error: accessError } = await db.from('course_access').upsert({
      user_id:           clientRefId,
      course_id:         courseId,
      granted_at:        new Date().toISOString(),
      expires_at:        expiresAt,
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

  console.log(`[webhook ${sid}] fallback path — looking up by email ${customerEmail} course=${courseId} expires_at=${expiresAt}`);

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
      expires_at:        expiresAt,
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
    expires_at:        expiresAt,
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
