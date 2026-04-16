/* ═══════════════════════════════════════════════════
   THE SPEAKING EDGE — Shared Components
   Nav + Footer injected via JS so updates propagate
   ═══════════════════════════════════════════════════ */

/* ── WAVEFORM LOGO (inline SVG) ── */
const TSE_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 290 40" width="220" height="30" aria-label="The Speaking Edge">
  <defs>
    <style>
      .nb { transform-origin: center 20px; animation: npulse 1.5s ease-in-out 2 forwards; }
      .nb0  { animation-delay:0.00s; animation-duration:1.6s; }
      .nb1  { animation-delay:0.06s; animation-duration:1.5s; }
      .nb2  { animation-delay:0.12s; animation-duration:1.7s; }
      .nb3  { animation-delay:0.18s; animation-duration:1.4s; }
      .nb4  { animation-delay:0.24s; animation-duration:1.6s; }
      .nb5  { animation-delay:0.04s; animation-duration:1.3s; }
      .nb6  { animation-delay:0.30s; animation-duration:1.5s; }
      .nb7  { animation-delay:0.09s; animation-duration:1.8s; }
      .nb8  { animation-delay:0.36s; animation-duration:1.4s; }
      .nb9  { animation-delay:0.15s; animation-duration:1.6s; }
      .nb10 { animation-delay:0.42s; animation-duration:1.5s; }
      .nb11 { animation-delay:0.21s; animation-duration:1.3s; }
      .nb12 { animation-delay:0.48s; animation-duration:1.7s; }
      .nb13 { animation-delay:0.27s; animation-duration:1.4s; }
      .nb14 { animation-delay:0.08s; animation-duration:1.5s; }
      .nb15 { animation-delay:0.33s; animation-duration:1.6s; }
      .nb16 { animation-delay:0.54s; animation-duration:1.4s; }
      @keyframes npulse {
        0%   { transform: scaleY(1);    opacity:1; }
        30%  { transform: scaleY(1.6);  opacity:0.9; }
        60%  { transform: scaleY(0.5);  opacity:0.65; }
        100% { transform: scaleY(1);    opacity:1; }
      }
    </style>
  </defs>
  <g transform="translate(0,20)">
    <rect class="nb nb0"  x="0"  y="-3"  width="4" height="6"  rx="2" fill="#C8392B" opacity="0.22"/>
    <rect class="nb nb1"  x="6"  y="-10" width="4" height="20" rx="2" fill="#C8392B" opacity="0.40"/>
    <rect class="nb nb2"  x="12" y="-7"  width="4" height="14" rx="2" fill="#C8392B" opacity="0.32"/>
    <rect class="nb nb3"  x="18" y="-18" width="4" height="36" rx="2" fill="#C8392B" opacity="0.60"/>
    <rect class="nb nb4"  x="24" y="-8"  width="4" height="16" rx="2" fill="#C8392B" opacity="0.40"/>
    <rect class="nb nb5"  x="30" y="-28" width="4" height="56" rx="2" fill="#E8A020"/>
    <rect class="nb nb6"  x="36" y="-14" width="4" height="28" rx="2" fill="#C8392B" opacity="0.55"/>
    <rect class="nb nb7"  x="42" y="-22" width="4" height="44" rx="2" fill="#C8392B" opacity="0.80"/>
    <rect class="nb nb8"  x="48" y="-10" width="4" height="20" rx="2" fill="#C8392B" opacity="0.42"/>
    <rect class="nb nb9"  x="54" y="-5"  width="4" height="10" rx="2" fill="#C8392B" opacity="0.30"/>
    <rect class="nb nb10" x="60" y="-14" width="4" height="28" rx="2" fill="#C8392B" opacity="0.48"/>
    <rect class="nb nb11" x="66" y="-8"  width="4" height="16" rx="2" fill="#C8392B" opacity="0.36"/>
    <rect class="nb nb12" x="72" y="-24" width="4" height="48" rx="2" fill="#E8A020" opacity="0.90"/>
    <rect class="nb nb13" x="78" y="-26" width="4" height="52" rx="2" fill="#C8392B"/>
    <rect class="nb nb14" x="84" y="-16" width="4" height="32" rx="2" fill="#C8392B" opacity="0.65"/>
    <rect class="nb nb15" x="90" y="-12" width="4" height="24" rx="2" fill="#C8392B" opacity="0.50"/>
    <rect class="nb nb16" x="96" y="-6"  width="4" height="12" rx="2" fill="#C8392B" opacity="0.28"/>
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
        <li><a href="programme.html">The Speaking Confidence Programme</a></li>
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
