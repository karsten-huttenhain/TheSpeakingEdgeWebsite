/* ═══════════════════════════════════════════════════
   THE SPEAKING EDGE — Shared Components
   Nav + Footer injected via JS so updates propagate
   ═══════════════════════════════════════════════════ */

/* ── WAVEFORM LOGO (inline SVG) ── */
const TSE_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="220" height="44" aria-label="The Speaking Edge">
  <defs>
    <style>
      .nb { transform-origin: center 150px; animation: npulse 1.4s ease-in-out 2 both; animation-delay: 3s; }
      .nb0  { animation-delay:3.00s; animation-duration:1.6s; }
      .nb1  { animation-delay:0.08s; animation-duration:1.5s; }
      .nb2  { animation-delay:0.16s; animation-duration:1.7s; }
      .nb3  { animation-delay:0.24s; animation-duration:1.4s; }
      .nb4  { animation-delay:0.32s; animation-duration:1.6s; }
      .nb5  { animation-delay:0.05s; animation-duration:1.3s; }
      .nb6  { animation-delay:0.40s; animation-duration:1.5s; }
      .nb7  { animation-delay:0.12s; animation-duration:1.8s; }
      .nb8  { animation-delay:0.48s; animation-duration:1.4s; }
      .nb9  { animation-delay:0.20s; animation-duration:1.6s; }
      .nb10 { animation-delay:0.56s; animation-duration:1.5s; }
      .nb11 { animation-delay:0.28s; animation-duration:1.3s; }
      .nb12 { animation-delay:0.64s; animation-duration:1.7s; }
      .nb13 { animation-delay:0.36s; animation-duration:1.4s; }
      .nb14 { animation-delay:0.10s; animation-duration:1.5s; }
      .nb15 { animation-delay:0.44s; animation-duration:1.6s; }
      .nb16 { animation-delay:0.72s; animation-duration:1.4s; }
      .nb17 { animation-delay:0.18s; animation-duration:1.7s; }
      .nb18 { animation-delay:0.52s; animation-duration:1.5s; }
      .nb19 { animation-delay:0.26s; animation-duration:1.3s; }
      .nb20 { animation-delay:0.60s; animation-duration:1.6s; }
      .nb21 { animation-delay:0.34s; animation-duration:1.8s; }
      .nb22 { animation-delay:0.68s; animation-duration:1.4s; }
      @keyframes npulse {
        0%   { transform:scaleY(1);    opacity:1; }
        30%  { transform:scaleY(1.6);  opacity:0.9; }
        60%  { transform:scaleY(0.5);  opacity:0.65; }
        100% { transform:scaleY(1);    opacity:1; }
      }
    </style>
  </defs>
  <g transform="translate(40, 150)">
    <rect class="nb nb0"  x="0"   y="-8"   width="12" height="16"  rx="6" fill="#C8392B" opacity="0.18"/>
    <rect class="nb nb1"  x="18"  y="-22"  width="12" height="44"  rx="6" fill="#C8392B" opacity="0.30"/>
    <rect class="nb nb2"  x="36"  y="-14"  width="12" height="28"  rx="6" fill="#C8392B" opacity="0.24"/>
    <rect class="nb nb3"  x="54"  y="-50"  width="12" height="100" rx="6" fill="#C8392B" opacity="0.50"/>
    <rect class="nb nb4"  x="72"  y="-22"  width="12" height="44"  rx="6" fill="#C8392B" opacity="0.36"/>
    <rect class="nb nb5"  x="90"  y="-90"  width="12" height="180" rx="6" fill="#E8A020"/>
    <rect class="nb nb6"  x="108" y="-38"  width="12" height="76"  rx="6" fill="#C8392B" opacity="0.52"/>
    <rect class="nb nb7"  x="126" y="-68"  width="12" height="136" rx="6" fill="#C8392B" opacity="0.74"/>
    <rect class="nb nb8"  x="144" y="-28"  width="12" height="56"  rx="6" fill="#C8392B" opacity="0.38"/>
    <rect class="nb nb9"  x="162" y="-16"  width="12" height="32"  rx="6" fill="#C8392B" opacity="0.26"/>
    <rect class="nb nb10" x="180" y="-34"  width="12" height="68"  rx="6" fill="#C8392B" opacity="0.44"/>
    <rect class="nb nb11" x="198" y="-20"  width="12" height="40"  rx="6" fill="#C8392B" opacity="0.32"/>
    <rect class="nb nb12" x="216" y="-44"  width="12" height="88"  rx="6" fill="#C8392B" opacity="0.54"/>
    <rect class="nb nb13" x="234" y="-26"  width="12" height="52"  rx="6" fill="#C8392B" opacity="0.40"/>
    <rect class="nb nb14" x="252" y="-76"  width="12" height="152" rx="6" fill="#E8A020" opacity="0.88"/>
    <rect class="nb nb15" x="270" y="-82"  width="12" height="164" rx="6" fill="#C8392B"/>
    <rect class="nb nb16" x="288" y="-54"  width="12" height="108" rx="6" fill="#C8392B" opacity="0.68"/>
    <rect class="nb nb17" x="306" y="-62"  width="12" height="124" rx="6" fill="#C8392B" opacity="0.76"/>
    <rect class="nb nb18" x="324" y="-36"  width="12" height="72"  rx="6" fill="#C8392B" opacity="0.48"/>
    <rect class="nb nb19" x="342" y="-48"  width="12" height="96"  rx="6" fill="#C8392B" opacity="0.58"/>
    <rect class="nb nb20" x="360" y="-18"  width="12" height="36"  rx="6" fill="#C8392B" opacity="0.28"/>
    <rect class="nb nb21" x="378" y="-28"  width="12" height="56"  rx="6" fill="#C8392B" opacity="0.36"/>
    <rect class="nb nb22" x="396" y="-10"  width="12" height="20"  rx="6" fill="#C8392B" opacity="0.18"/>
  </g>
  <text x="460" y="158" font-family="'Playfair Display',Georgia,serif" font-weight="700" font-size="62" fill="#FAF6F0" dominant-baseline="middle">The Speaking <tspan fill="#C8392B">Edge</tspan></text>
</svg>`

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
