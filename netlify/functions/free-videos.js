'use strict';

// Note: BUNNY_TOKEN_KEY is no longer needed — embed view token auth has been disabled
// in the Bunny dashboard. Remove from Netlify env vars when convenient.

exports.handler = async () => {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey    = process.env.BUNNY_API_KEY;

  if (!libraryId || !apiKey) {
    console.error('free-videos: missing BUNNY_LIBRARY_ID or BUNNY_API_KEY');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Video service not configured' }),
    };
  }

  const bunnyHeaders = { AccessKey: apiKey, accept: 'application/json' };

  // Step 1 — find the "Free Tasters" collection GUID
  let freeTastersGuid;
  try {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/collections?itemsPerPage=100`,
      { headers: bunnyHeaders }
    );
    if (!res.ok) throw new Error(`Collections API returned ${res.status}`);
    const data = await res.json();
    const match = (data.items || []).find(c => c.name === 'Free Tasters');
    if (!match) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([]),
      };
    }
    freeTastersGuid = match.guid;
  } catch (err) {
    console.error('free-videos: failed to fetch collections:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load video collection' }),
    };
  }

  // Step 2 — fetch videos, filter strictly by collection GUID, return clean list
  try {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos?collectionId=${freeTastersGuid}&itemsPerPage=100&orderBy=date`,
      { headers: bunnyHeaders }
    );
    if (!res.ok) throw new Error(`Videos API returned ${res.status}`);
    const data = await res.json();

    const filtered = (data.items || []).filter(v => v.collectionId === freeTastersGuid);

    const videos = filtered.map(v => ({
      title:    v.title,
      guid:     v.guid,
      embedUrl: `https://player.mediadelivery.net/embed/${libraryId}/${v.guid}`,
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
      body: JSON.stringify(videos),
    };
  } catch (err) {
    console.error('free-videos: failed to fetch videos:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load videos' }),
    };
  }
};
