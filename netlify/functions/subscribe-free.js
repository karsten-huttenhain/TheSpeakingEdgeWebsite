'use strict';

/* ═══════════════════════════════════════════════════════════════
   subscribe-free — upserts a name/email into free_subscribers.
   Runs server-side with the service role key so RLS is bypassed.
   Environment variables required:
     SUPABASE_URL         — your project URL
     SUPABASE_SERVICE_KEY — service role key (not anon key)
   ═══════════════════════════════════════════════════════════════ */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let name, email;
  try {
    ({ name, email } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!name || !email) {
    return { statusCode: 400, body: 'name and email are required' };
  }

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { error } = await db.from('free_subscribers').upsert(
    { name: name.trim(), email: email.trim().toLowerCase() },
    { onConflict: 'email' }
  );

  if (error) {
    console.error('subscribe-free: upsert error:', error.message);
    return { statusCode: 500, body: 'Database error' };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};
