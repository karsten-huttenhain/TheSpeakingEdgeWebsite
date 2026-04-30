/* ═══════════════════════════════════════════════════════════════
   Stripe webhook — provisions course_access after payment
   Environment variables required (set in Netlify dashboard):
     STRIPE_WEBHOOK_SECRET   — from Stripe Dashboard → Webhooks
     SUPABASE_URL            — your project URL
     SUPABASE_SERVICE_KEY    — service role key (not anon key)
     TSE_COURSE_ID           — UUID of the course row in Supabase
   ═══════════════════════════════════════════════════════════════ */

const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

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
    const { error: pendingError } = await db
      .from('pending_access')
      .upsert({
        email:      customerEmail,
        course_id:  process.env.TSE_COURSE_ID,
        stripe_session_id: session.id,
        created_at: new Date().toISOString(),
      }, { onConflict: 'email,course_id' });

    if (pendingError) {
      console.error('Error writing pending_access:', pendingError.message);
      return { statusCode: 500, body: 'Database error' };
    }

    console.log(`Pending access recorded for ${customerEmail}`);
    return { statusCode: 200, body: 'Pending access recorded' };
  }

  // Grant course access
  const { error: accessError } = await db
    .from('course_access')
    .upsert({
      user_id:    user.id,
      course_id:  process.env.TSE_COURSE_ID,
      granted_at: new Date().toISOString(),
      stripe_session_id: session.id,
    }, { onConflict: 'user_id,course_id' });

  if (accessError) {
    console.error('Error granting course_access:', accessError.message);
    return { statusCode: 500, body: 'Database error' };
  }

  console.log(`Course access granted to user ${user.id} (${customerEmail})`);
  return { statusCode: 200, body: 'Access granted' };
};
