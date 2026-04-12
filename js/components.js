/* ═══════════════════════════════════════════════════
   THE SPEAKING EDGE — Shared Components
   Nav + Footer injected via JS so updates propagate
   ═══════════════════════════════════════════════════ */

/* ── WAVEFORM LOGO (inline SVG) ── */
const TSE_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 290 40" width="220" height="30" aria-label="The Speaking Edge">
  <g transform="translate(0,20)">
    <rect x="0"  y="-3"  width="4" height="6"  rx="2" fill="#C8392B" opacity="0.22"/>
    <rect x="6"  y="-10" width="4" height="20" rx="2" fill="#C8392B" opacity="0.40"/>
    <rect x="12" y="-7"  width="4" height="14" rx="2" fill="#C8392B" opacity="0.32"/>
    <rect x="18" y="-18" width="4" height="36" rx="2" fill="#C8392B" opacity="0.60"/>
    <rect x="24" y="-8"  width="4" height="16" rx="2" fill="#C8392B" opacity="0.40"/>
    <rect x="30" y="-28" width="4" height="56" rx="2" fill="#E8A020"/>
    <rect x="36" y="-14" width="4" height="28" rx="2" fill="#C8392B" opacity="0.55"/>
    <rect x="42" y="-22" width="4" height="44" rx="2" fill="#C8392B" opacity="0.80"/>
    <rect x="48" y="-10" width="4" height="20" rx="2" fill="#C8392B" opacity="0.42"/>
    <rect x="54" y="-5"  width="4" height="10" rx="2" fill="#C8392B" opacity="0.30"/>
    <rect x="60" y="-14" width="4" height="28" rx="2" fill="#C8392B" opacity="0.48"/>
    <rect x="66" y="-8"  width="4" height="16" rx="2" fill="#C8392B" opacity="0.36"/>
    <rect x="72" y="-24" width="4" height="48" rx="2" fill="#E8A020" opacity="0.90"/>
    <rect x="78" y="-26" width="4" height="52" rx="2" fill="#C8392B"/>
    <rect x="84" y="-16" width="4" height="32" rx="2" fill="#C8392B" opacity="0.65"/>
    <rect x="90" y="-12" width="4" height="24" rx="2" fill="#C8392B" opacity="0.50"/>
    <rect x="96" y="-6"  width="4" height="12" rx="2" fill="#C8392B" opacity="0.28"/>
  </g>
  <text x="116" y="26" font-family="'Playfair Display',Georgia,serif" font-weight="700" font-size="20" fill="#FAF6F0">The Speaking <tspan fill="#C8392B">Edge</tspan></text>
</svg>`;

/* ── NAV ── */
const TSE_NAV = `
<nav>
  <a href="index.html" class="nav-logo">${TSE_LOGO_SVG}</a>
  <ul class="nav-links">
    <li><a href="programme.html">Programme</a></li>
    <li><a href="about.html">About</a></li>
    <li><a href="contact.html">Contact</a></li>
  </ul>
  <button class="nav-toggle" aria-label="Toggle menu">
    <span></span><span></span><span></span>
  </button>
  <a href="contact.html" class="nav-cta">Book a call</a>
</nav>`;

/* ── FOOTER ── */
const TSE_FOOTER = `
<footer>
  <div class="footer-gold-line"></div>
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="footer-logo">The Speaking <span>Edge</span></div>
      <div class="footer-tagline">Transform your relationship with speaking.</div>
      <p>A speaking confidence programme grounded in professional acting technique. Edinburgh, Scotland — delivering worldwide.</p>
    </div>
    <div class="footer-col">
      <h5>Programme</h5>
      <ul>
        <li><a href="programme.html">The PERFORM Framework</a></li>
        <li><a href="programme.html#online">Online Course</a></li>
        <li><a href="programme.html#workshops">Live Workshops</a></li>
        <li><a href="programme.html#coaching">1:1 Coaching</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h5>Contact</h5>
      <ul>
        <li><a href="contact.html">Send an enquiry</a></li>
        <li><a href="contact.html">Book a discovery call</a></li>
        <li><a href="about.html">About Karsten</a></li>
        <li><a href="https://linkedin.com" target="_blank" rel="noopener">LinkedIn</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; 2026 The Speaking Edge &middot; Karsten Huttenhain &middot; Edinburgh, Scotland</p>
    <div class="footer-sig">speakingedgeglobal.com</div>
  </div>
</footer>`;

/* ── INJECT ── */
document.addEventListener('DOMContentLoaded', function () {
  const navEl = document.getElementById('tse-nav');
  const footerEl = document.getElementById('tse-footer');
  if (navEl) navEl.outerHTML = TSE_NAV;
  if (footerEl) footerEl.outerHTML = TSE_FOOTER;
});
