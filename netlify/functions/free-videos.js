'use strict';

const crypto = require('crypto');

exports.handler = async () => {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey    = process.env.BUNNY_API_KEY;
  const tokenKey  = process.env.BUNNY_TOKEN_KEY;

  console.log('[free-videos] libraryId present:', !!libraryId, '| apiKey present:', !!apiKey, '| tokenKey present:', !!tokenKey);

  if (!libraryId || !apiKey || !tokenKey) {
    console.error('Missing Bunny env vars');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Video service not configured' }),
    };
  }

  const bunnyHeaders = { AccessKey: apiKey, accept: 'application/json' };

  // Step 1 — find the "Free Tasters" collection GUID
  let collectionGuid;
  try {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/collections?itemsPerPage=100`,
      { headers: bunnyHeaders }
    );
    console.log('[free-videos] collections API status:', res.status);
    if (!res.ok) throw new Error(`Collections API returned ${res.status}`);
    const data = await res.json();
    const names = (data.items || []).map(c => c.name);
    console.log('[free-videos] collections found:', names);
    const match = (data.items || []).find(c => c.name === 'Free Tasters');
    if (!match) {
      console.log('[free-videos] "Free Tasters" collection not found — returning empty array');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([]),
      };
    }
    console.log('[free-videos] "Free Tasters" found, GUID:', match.guid);
    collectionGuid = match.guid;
  } catch (err) {
    console.error('Failed to fetch collections:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load video collection' }),
    };
  }

  // Step 2 — fetch videos in that collection
  try {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos?collectionId=${collectionGuid}&itemsPerPage=100&orderBy=date`,
      { headers: bunnyHeaders }
    );
    console.log('[free-videos] videos API status:', res.status);
    if (!res.ok) throw new Error(`Videos API returned ${res.status}`);
    const data = await res.json();
    console.log('[free-videos] videos returned:', (data.items || []).length);

    const expires    = Math.floor(Date.now() / 1000) + 21600; // 6 hours
    const expiresStr = String(expires);
    const libIdStr   = String(libraryId);
    console.log('[free-videos] now:', Math.floor(Date.now() / 1000), '| expires:', expiresStr);

    const videos = (data.items || []).map((v, i) => {
      const hashInput = tokenKey + libIdStr + v.guid + expiresStr;
      if (i === 0) console.log('[free-videos] hash input (key redacted): [REDACTED]' + libIdStr + v.guid + expiresStr);
      const token = crypto
        .createHash('sha256')
        .update(hashInput)
        .digest('hex');
      const item = {
        title:    v.title,
        guid:     v.guid,
        embedUrl: `https://iframe.mediadelivery.net/embed/${libIdStr}/${v.guid}?token=${token}&expires=${expiresStr}`,
      };
      if (v.description) item.description = v.description;
      return item;
    });

    if (videos.length > 0) console.log('[free-videos] sample embed URL:', videos[0].embedUrl);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
      body: JSON.stringify(videos),
    };
  } catch (err) {
    console.error('Failed to fetch videos:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load videos' }),
    };
  }
};
