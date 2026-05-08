'use strict';

/* Triggered automatically by Netlify on every form submission.
   Filters for tse-waitlist and adds the subscriber to Kit.com. */

exports.handler = async (event) => {
  let payload;
  try {
    payload = JSON.parse(event.body).payload;
  } catch (e) {
    return { statusCode: 400, body: 'Invalid payload' };
  }

  // Only handle the waitlist form — ignore all others
  if (payload.form_name !== 'tse-waitlist') {
    return { statusCode: 200, body: 'Not a waitlist submission — skipped' };
  }

  const apiKey  = process.env.KIT_API_KEY;
  const formId  = process.env.KIT_WAITLIST_FORM_ID;

  if (!apiKey || !formId) {
    console.error('Missing KIT_API_KEY or KIT_WAITLIST_FORM_ID env vars');
    return { statusCode: 500, body: 'Server configuration error' };
  }

  const email     = (payload.data.email || '').trim();
  const firstName = (payload.data.name  || '').split(' ')[0].trim();

  if (!email) {
    return { statusCode: 400, body: 'No email in payload' };
  }

  const res = await fetch(
    `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ api_key: apiKey, email, first_name: firstName }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Kit.com API error:', res.status, text);
    return { statusCode: 502, body: 'Kit.com API error' };
  }

  console.log(`Subscribed ${email} to Kit.com form ${formId}`);
  return { statusCode: 200, body: 'Subscribed' };
};
