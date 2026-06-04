'use strict';

/* ═══════════════════════════════════════════════════════════════
   download-pdf — returns a short-lived signed Supabase Storage
   URL for the Quiet Influence PDF after verifying guide access.
   Environment variables required:
     SUPABASE_URL        — your project URL
     SUPABASE_SERVICE_KEY — service role key
     GUIDE_COURSE_ID     — UUID of the Quiet Influence bundle
   Storage: private bucket "guide-assets", file "quiet-influence.pdf"
   ═══════════════════════════════════════════════════════════════ */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authHeader = event.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return { statusCode: 401, body: 'Unauthorised' };
  }

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) {
    return { statusCode: 401, body: 'Invalid token' };
  }

  const { data: access, error: accessError } = await db
    .from('course_access')
    .select('expires_at')
    .eq('user_id', user.id)
    .eq('course_id', process.env.GUIDE_COURSE_ID)
    .maybeSingle();

  if (accessError || !access) {
    return { statusCode: 403, body: 'No access' };
  }

  if (access.expires_at && new Date(access.expires_at) < new Date()) {
    return { statusCode: 403, body: 'Access expired' };
  }

  const { data: signed, error: storageError } = await db.storage
    .from('guide-assets')
    .createSignedUrl('quiet-influence.pdf', 60);

  if (storageError || !signed?.signedUrl) {
    console.error('Storage error:', storageError?.message);
    return { statusCode: 500, body: 'Could not generate download link' };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: signed.signedUrl }),
  };
};
