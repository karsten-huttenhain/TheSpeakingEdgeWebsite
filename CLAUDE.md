# The Speaking Edge — Claude Code Context

## Project overview
Vanilla JS / HTML / CSS site hosted on Netlify. Supabase for auth and database. Stripe for payments (not yet live). No build step — files are served directly (`publish = "."`).

The `guide/` subdirectory contains the **Quiet Influence** free guide — 8 HTML pages (index + 6 parts + appendix) — integrated from a separate repo. It uses its own `guide/css/style.css` and `guide/js/main.js`, plus the shared `js/tse-platform.js` for Supabase auth.

## File naming convention
Protected pages use an `_` prefix (`_login.html`, `_dashboard.html`, `_admin.html`, etc.). Netlify rewrites map the public-facing names (e.g. `/login.html`) to these files via `_redirects`. Do not rename files or remove the `_redirects` file.

## Auth pattern
Every protected page loads Supabase CDN + `js/tse-platform.js`, then calls `tseRequireAuth()`. If no session, the user is redirected to `/login.html?redirect=<current path>`. After sign-in, `_login.html` reads `?redirect=` and sends them back.

Guide pages use the same pattern but load `../js/tse-platform.js` (one level up).

## Branch workflow
- `develop` — all active work goes here
- `main` — production; merge from develop when ready to deploy

---

## Roadmap

### Phase 3 — Guide interactivity (next up)
The guide is live and auth-gated. Remaining Phase 3 work:
- [ ] Time-limited free access logic (e.g. 14-day trial via Supabase `guide_access` table or `profiles` metadata)
- [ ] "Your access expires in X days" banner on guide pages
- [ ] Email capture on sign-up already works via Supabase auth — confirm welcome email is configured in Supabase dashboard

### Phase 4 — Stripe integration
- [ ] Wire up Stripe payment links / Stripe Checkout for the Speaking Confidence Programme course
- [ ] On successful payment, write a row to `course_access` table (via Stripe webhook → Netlify function)
- [ ] `_success.html` already exists — confirm it handles post-payment flow
- [ ] `tseHasCourseAccess()` in `tse-platform.js` already reads `course_access` table — just needs data

### Phase 5 — Video (Bunny.net)
- [ ] Embed Bunny.net video player in module pages
- [ ] Module pages are database-driven via `modules` table in Supabase
- [ ] `tseGetModules()` and `tseGetModule()` already exist in `tse-platform.js`

### Phase 6 — Polish
- [ ] Email sequences (welcome, onboarding, follow-up) — likely via Supabase + a sending service
- [ ] Analytics / event tracking
- [ ] SEO meta tags on all public pages
- [ ] Mobile polish pass

---

## Key Supabase tables (already set up)
- `profiles` — user profile data (full_name, role)
- `course_access` — rows grant access to a course (`user_id`, `course_id`)
- `modules` — course modules (slug, title, theme, acronym, color, is_free, sort_order)
- `progress` — per-user module completion (`user_id`, `course_id`, `module_id`, `status`)

Course ID for Speaking Confidence Programme: `7c4c6ad1-97a5-4bb1-a214-8a43387119bd`
