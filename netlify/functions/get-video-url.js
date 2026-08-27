'use strict';

/* ═══════════════════════════════════════════════════════════════
   get-video-url — returns a short-lived signed Bunny.net embed URL
   for a paid course video, after verifying the caller has active
   access to the course that video belongs to.

   Auth mirrors download-pdf.js:
     - Bearer token in Authorization header
     - db.auth.getUser(token) must resolve to a real, unexpired session
     - the module the videoId belongs to (modules.bunny_video_id) must
       map to a course the user has non-expired course_access to

   Environment variables required:
     SUPABASE_URL, SUPABASE_SERVICE_KEY
     BUNNY_LIBRARY_ID, BUNNY_TOKEN_KEY, BUNNY_CDN_HOSTNAME
   ═══════════════════════════════════════════════════════════════ */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // ── Auth: real, unexpired Supabase session ──────────────────────────────────
  const authHeader = event.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return { statusCode: 401, body: 'Unauthorised' };
  }

  let videoId;
  try {
    ({ videoId } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!videoId) {
    return { statusCode: 400, body: 'Missing videoId' };
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('get-video-url: missing SUPABASE_URL / SUPABASE_SERVICE_KEY');
    return { statusCode: 500, body: 'Server misconfiguration' };
  }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) {
    return { statusCode: 401, body: 'Invalid token' };
  }

  // ── Access: which course does this video belong to, and can the user watch? ─
  const { data: mod, error: modError } = await db
    .from('modules')
    .select('course_id')
    .eq('bunny_video_id', videoId)
    .maybeSingle();

  if (modError) {
    console.error('get-video-url: modules lookup error:', modError.message);
    return { statusCode: 500, body: 'Database error' };
  }
  if (!mod) {
    // Unknown video → no course to authorise against → deny.
    return { statusCode: 403, body: 'No access' };
  }

  const { data: access, error: accessError } = await db
    .from('course_access')
    .select('expires_at')
    .eq('user_id', user.id)
    .eq('course_id', mod.course_id)
    .maybeSingle();

  if (accessError) {
    console.error('get-video-url: course_access lookup error:', accessError.message);
    return { statusCode: 500, body: 'Database error' };
  }
  if (!access) {
    return { statusCode: 403, body: 'No access' };
  }
  if (access.expires_at && new Date(access.expires_at) < new Date()) {
    return { statusCode: 403, body: 'Access expired' };
  }

  // ── Signed embed URL (unchanged) ───────────────────────────────────────────
  const libraryId   = process.env.BUNNY_LIBRARY_ID;
  const tokenKey    = process.env.BUNNY_TOKEN_KEY;
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME;

  if (!libraryId || !tokenKey || !cdnHostname) {
    console.error('Missing Bunny env vars');
    return { statusCode: 500, body: 'Video service not configured' };
  }

  // Signed token expires in 2 hours
  const expiry = Math.floor(Date.now() / 1000) + 7200;
  const embedToken = crypto
    .createHash('sha256')
    .update(tokenKey + videoId + expiry)
    .digest('hex');

  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${embedToken}&expires=${expiry}`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embedUrl }),
  };
};
