// netlify/functions/supabase-keepalive.mjs
//
// Keeps the Supabase free-tier project from pausing due to inactivity.
// Runs once a day on Netlify's scheduler and makes one tiny read query.
//
// Uses the existing Netlify environment variables:
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
// No extra packages needed (uses built-in fetch).

export default async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error("Keep-alive: SUPABASE_URL or SUPABASE_SERVICE_KEY missing");
    return new Response("Missing environment variables", { status: 500 });
  }

  try {
    // Smallest possible real database query: fetch one id from course_access
    const res = await fetch(`${url}/rest/v1/course_access?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Keep-alive: Supabase responded ${res.status} — ${body}`);
      return new Response("Supabase ping failed", { status: 502 });
    }

    console.log(`Keep-alive: Supabase OK at ${new Date().toISOString()}`);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Keep-alive: request error —", err.message);
    return new Response("Request error", { status: 500 });
  }
};

// Run daily at 06:00 UTC
export const config = {
  schedule: "0 6 * * *",
};
