'use strict';

/* ═══════════════════════════════════════════════════════════════
   ai-coach — proxies chat messages to Anthropic with rate limiting
   Environment variables required:
     ANTHROPIC_API_KEY — server-side only, never sent to browser
   Rate limit: 30 exchanges per sessionId per 24-hour window
   (in-memory — resets on cold start; upgrade to KV store if needed)
   ═══════════════════════════════════════════════════════════════ */

const rateLimitStore = new Map();

function checkRateLimit(sessionId) {
  const LIMIT  = 30;
  const WINDOW = 24 * 60 * 60 * 1000;
  const now    = Date.now();
  const entry  = rateLimitStore.get(sessionId);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(sessionId, { count: 1, resetAt: now + WINDOW });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

function buildSystemPrompt(chapterContext) {
  return `You are a warm, experienced speaking and communication coach for The Speaking Edge — a platform that helps professionals develop speaking confidence and authentic presence.
${chapterContext ? `\nThe user is currently working on: "${chapterContext}".` : ''}
Guidelines:
- Be concise: 2-4 sentences per response unless the user asks for more
- Be practical: focus on what the user can do, not just what to think about
- Be encouraging without being generic or hollow
- End with one focused follow-up question to keep the conversation useful
- Draw on acting technique, breath, body, and story where relevant`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { messages, chapterContext, sessionId, apiKey } = body;

  if (!Array.isArray(messages) || !sessionId) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return { statusCode: 500, body: 'AI service not configured' };
  }

  if (!apiKey) {
    if (!checkRateLimit(sessionId)) {
      return {
        statusCode: 429,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'daily_limit_reached',
          message: "You've used your 30 daily coaching exchanges. Come back tomorrow, or add your own Anthropic API key below for unlimited access.",
        }),
      };
    }
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: buildSystemPrompt(chapterContext),
        messages: messages.slice(-10),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic error:', response.status, errText);
      return { statusCode: 502, body: 'AI service unavailable' };
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };

  } catch (e) {
    console.error('ai-coach error:', e.message);
    return { statusCode: 500, body: 'Internal error' };
  }
};
