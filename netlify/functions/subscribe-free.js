'use strict';

/* ═══════════════════════════════════════════════════════════════
   subscribe-free — upserts a name/email into free_subscribers.
   Runs server-side with the service role key so RLS is bypassed.
   Environment variables required:
     SUPABASE_URL         — your project URL
     SUPABASE_SERVICE_KEY — service role key (not anon key)

   Abuse protection:
     - honeypot field ("company"): if populated, silently discard
     - email format validation → 400
     - per-IP rate limit (shared _rate-limit helper) → 429
   ═══════════════════════════════════════════════════════════════ */

const { createClient } = require('@supabase/supabase-js');
const { checkRateLimit, getClientIp } = require('./_rate-limit');

// Pragmatic email check — one @, a dot in the domain, no spaces. Not RFC-5322
// exhaustive on purpose; just enough to reject junk before it hits the table.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_LIMIT    = 8;            // submissions per IP…
const RATE_WINDOW_S = 60 * 60;      // …per hour

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let name, email, company;
  try {
    ({ name, email, company } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Honeypot: real users never see or fill "company". A populated value means
  // a bot — return a normal-looking 200 and write nothing.
  if (typeof company === 'string' && company.trim() !== '') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  }

  if (!name || !email) {
    return { statusCode: 400, body: 'name and email are required' };
  }

  const cleanName  = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 254) {
    return { statusCode: 400, body: 'Invalid email address' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('subscribe-free: missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    return { statusCode: 500, body: 'Server misconfiguration: missing env vars' };
  }

  // Per-IP rate limit
  const { allowed, retryAfterSeconds } = await checkRateLimit({
    bucket: 'subscribe-free',
    identifier: getClientIp(event),
    limit: RATE_LIMIT,
    windowSeconds: RATE_WINDOW_S,
  });
  if (!allowed) {
    return {
      statusCode: 429,
      headers: { 'Retry-After': String(retryAfterSeconds || RATE_WINDOW_S) },
      body: 'Too many requests — please try again later.',
    };
  }

  const db = createClient(supabaseUrl, supabaseKey);

  const { error } = await db.from('free_subscribers').upsert(
    { name: cleanName, email: cleanEmail },
    { onConflict: 'email' }
  );

  if (error) {
    console.error('subscribe-free: upsert error:', error.message, error.code);
    return { statusCode: 500, body: 'Database error' };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};
