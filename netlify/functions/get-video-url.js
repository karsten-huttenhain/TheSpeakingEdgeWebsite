'use strict';

const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (!event.headers.authorization) {
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

  const libraryId  = process.env.BUNNY_LIBRARY_ID;
  const tokenKey   = process.env.BUNNY_TOKEN_KEY;
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME;

  if (!libraryId || !tokenKey || !cdnHostname) {
    console.error('Missing Bunny env vars');
    return { statusCode: 500, body: 'Video service not configured' };
  }

  // Signed token expires in 2 hours
  const expiry = Math.floor(Date.now() / 1000) + 7200;
  const token  = crypto
    .createHash('sha256')
    .update(tokenKey + videoId + expiry)
    .digest('hex');

  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expiry}`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embedUrl }),
  };
};
