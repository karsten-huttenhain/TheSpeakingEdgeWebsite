'use strict';

/* ═══════════════════════════════════════════════════════════════
   Shared rate-limit helper for Netlify Functions.
   Durable (Supabase `rate_limits` table + `rate_limit_hit` RPC) so the
   cap survives cold starts and redeploys. Underscore-prefixed so Netlify
   treats it as a support file, not its own function.

   Env: SUPABASE_URL, SUPABASE_SERVICE_KEY
   Schema: supabase/migrations/20260827_rate_limits.sql
   ═══════════════════════════════════════════════════════════════ */

const { createClient } = require('@supabase/supabase-js');

let _db = null;
function db() {
  if (_db) return _db;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  _db = createClient(url, key);
  return _db;
}

// The real client IP as seen by Netlify's edge. `x-nf-client-connection-ip`
// is set by Netlify and cannot be spoofed by the caller; the others are
// fallbacks for local dev / preview contexts.
function getClientIp(event) {
  const h = (event && event.headers) || {};
  const xff = (h['x-forwarded-for'] || '').split(',')[0].trim();
  return h['x-nf-client-connection-ip'] || xff || h['client-ip'] || null;
}

/**
 * Count one hit against { bucket, identifier } and report whether it's allowed.
 * Fixed window. Never throws.
 *
 *  - identifier missing        → denied (caller couldn't be identified)
 *  - Supabase not configured   → allowed (don't punish real users for our misconfig)
 *  - Supabase/RPC error        → allowed (fail open on infra failure)
 *
 * @returns {Promise<{allowed:boolean, remaining:number, retryAfterSeconds:number}>}
 */
async function checkRateLimit({ bucket, identifier, limit, windowSeconds }) {
  if (!identifier) {
    return { allowed: false, remaining: 0, retryAfterSeconds: windowSeconds };
  }

  const client = db();
  if (!client) {
    console.error('_rate-limit: missing SUPABASE_URL / SUPABASE_SERVICE_KEY — allowing request');
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }

  try {
    const { data, error } = await client.rpc('rate_limit_hit', {
      p_bucket: bucket,
      p_identifier: identifier,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error('_rate-limit: rpc error:', error.message);
      return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
    return {
      allowed: row.allowed !== false,
      remaining: typeof row.remaining === 'number' ? row.remaining : 0,
      retryAfterSeconds: typeof row.retry_after_seconds === 'number' ? row.retry_after_seconds : 0,
    };
  } catch (e) {
    console.error('_rate-limit: unexpected error:', e.message);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

module.exports = { checkRateLimit, getClientIp };
