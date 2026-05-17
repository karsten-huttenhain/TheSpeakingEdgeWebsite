'use strict';

exports.handler = async () => {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey    = process.env.BUNNY_API_KEY;

  if (!libraryId || !apiKey) {
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
    if (!res.ok) throw new Error(`Videos API returned ${res.status}`);
    const data = await res.json();

    const videos = (data.items || []).map(v => {
      const item = {
        title:    v.title,
        guid:     v.guid,
        embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${v.guid}`,
      };
      if (v.description) item.description = v.description;
      return item;
    });

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
