/* ── Header logo (matches TSE website — same bars, same npulse animation) ── */
var TSE_LOGO_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="36 58 424 186" aria-label="The Speaking Edge">',
  '<defs><style>',
  '.nb{transform-origin:center 150px;animation:npulse 1.4s ease-in-out 2 both}',
  '.nb0{animation-delay:3.00s;animation-duration:1.6s}',
  '.nb1{animation-delay:3.08s;animation-duration:1.5s}',
  '.nb2{animation-delay:3.16s;animation-duration:1.7s}',
  '.nb3{animation-delay:3.24s;animation-duration:1.4s}',
  '.nb4{animation-delay:3.32s;animation-duration:1.6s}',
  '.nb5{animation-delay:3.05s;animation-duration:1.3s}',
  '.nb6{animation-delay:3.40s;animation-duration:1.5s}',
  '.nb7{animation-delay:3.12s;animation-duration:1.8s}',
  '.nb8{animation-delay:3.48s;animation-duration:1.4s}',
  '.nb9{animation-delay:3.20s;animation-duration:1.6s}',
  '.nb10{animation-delay:3.56s;animation-duration:1.5s}',
  '.nb11{animation-delay:3.28s;animation-duration:1.3s}',
  '.nb12{animation-delay:3.64s;animation-duration:1.7s}',
  '.nb13{animation-delay:3.36s;animation-duration:1.4s}',
  '.nb14{animation-delay:3.10s;animation-duration:1.5s}',
  '.nb15{animation-delay:3.44s;animation-duration:1.6s}',
  '.nb16{animation-delay:3.72s;animation-duration:1.4s}',
  '.nb17{animation-delay:3.18s;animation-duration:1.7s}',
  '.nb18{animation-delay:3.52s;animation-duration:1.5s}',
  '.nb19{animation-delay:3.26s;animation-duration:1.3s}',
  '.nb20{animation-delay:3.60s;animation-duration:1.6s}',
  '.nb21{animation-delay:3.34s;animation-duration:1.8s}',
  '.nb22{animation-delay:3.68s;animation-duration:1.4s}',
  '@keyframes npulse{0%{transform:scaleY(1);opacity:1}30%{transform:scaleY(1.6);opacity:.9}60%{transform:scaleY(.5);opacity:.65}100%{transform:scaleY(1);opacity:1}}',
  '</style></defs>',
  '<g transform="translate(40,150)">',
  '<rect class="nb nb0"  x="0"   y="-8"   width="12" height="16"  rx="6" fill="#C8392B" opacity="0.18"/>',
  '<rect class="nb nb1"  x="18"  y="-22"  width="12" height="44"  rx="6" fill="#C8392B" opacity="0.30"/>',
  '<rect class="nb nb2"  x="36"  y="-14"  width="12" height="28"  rx="6" fill="#C8392B" opacity="0.24"/>',
  '<rect class="nb nb3"  x="54"  y="-50"  width="12" height="100" rx="6" fill="#C8392B" opacity="0.50"/>',
  '<rect class="nb nb4"  x="72"  y="-22"  width="12" height="44"  rx="6" fill="#C8392B" opacity="0.36"/>',
  '<rect class="nb nb5"  x="90"  y="-90"  width="12" height="180" rx="6" fill="#E8A020"/>',
  '<rect class="nb nb6"  x="108" y="-38"  width="12" height="76"  rx="6" fill="#C8392B" opacity="0.52"/>',
  '<rect class="nb nb7"  x="126" y="-68"  width="12" height="136" rx="6" fill="#C8392B" opacity="0.74"/>',
  '<rect class="nb nb8"  x="144" y="-28"  width="12" height="56"  rx="6" fill="#C8392B" opacity="0.38"/>',
  '<rect class="nb nb9"  x="162" y="-16"  width="12" height="32"  rx="6" fill="#C8392B" opacity="0.26"/>',
  '<rect class="nb nb10" x="180" y="-34"  width="12" height="68"  rx="6" fill="#C8392B" opacity="0.44"/>',
  '<rect class="nb nb11" x="198" y="-20"  width="12" height="40"  rx="6" fill="#C8392B" opacity="0.32"/>',
  '<rect class="nb nb12" x="216" y="-44"  width="12" height="88"  rx="6" fill="#C8392B" opacity="0.54"/>',
  '<rect class="nb nb13" x="234" y="-26"  width="12" height="52"  rx="6" fill="#C8392B" opacity="0.40"/>',
  '<rect class="nb nb14" x="252" y="-76"  width="12" height="152" rx="6" fill="#E8A020" opacity="0.88"/>',
  '<rect class="nb nb15" x="270" y="-82"  width="12" height="164" rx="6" fill="#C8392B"/>',
  '<rect class="nb nb16" x="288" y="-54"  width="12" height="108" rx="6" fill="#C8392B" opacity="0.68"/>',
  '<rect class="nb nb17" x="306" y="-62"  width="12" height="124" rx="6" fill="#C8392B" opacity="0.76"/>',
  '<rect class="nb nb18" x="324" y="-36"  width="12" height="72"  rx="6" fill="#C8392B" opacity="0.48"/>',
  '<rect class="nb nb19" x="342" y="-48"  width="12" height="96"  rx="6" fill="#C8392B" opacity="0.58"/>',
  '<rect class="nb nb20" x="360" y="-18"  width="12" height="36"  rx="6" fill="#C8392B" opacity="0.28"/>',
  '<rect class="nb nb21" x="378" y="-28"  width="12" height="56"  rx="6" fill="#C8392B" opacity="0.36"/>',
  '<rect class="nb nb22" x="396" y="-10"  width="12" height="20"  rx="6" fill="#C8392B" opacity="0.18"/>',
  '</g></svg>'
].join('');

/* ── Waveform generator ── */
var WAVE_H   = [6,20,12,40,18,74,32,56,22,12,28,16,36,20,62,68,44,52,30,58,24,46,14];
var GOLD_IDX = [5, 14];

function buildWaveform(opts) {
  var o     = opts || {};
  var barW  = o.barW  || 4;
  var gap   = o.gap   || 2;
  var maxH  = o.maxH  || 74;
  var fill  = o.fill  || '#C8392B';
  var gold  = o.gold  || '#E8A020';
  var cls   = o.cls   || '';
  var anim  = o.anim  || false;
  var scale = maxH / 74;
  var step  = barW + gap;
  var totalW = WAVE_H.length * step - gap;
  var ns    = 'http://www.w3.org/2000/svg';
  var svg   = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + totalW + ' ' + maxH);
  svg.setAttribute('width',   totalW);
  svg.setAttribute('height',  maxH);
  svg.setAttribute('aria-hidden', 'true');
  if (cls) svg.setAttribute('class', cls);
  WAVE_H.forEach(function(h, i) {
    var sh   = Math.max(2, Math.round(h * scale));
    var x    = i * step;
    var y    = (maxH - sh) / 2;
    var rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width',  barW);
    rect.setAttribute('height', sh);
    rect.setAttribute('rx', Math.min(barW / 2, 3));
    rect.setAttribute('fill', GOLD_IDX.indexOf(i) >= 0 ? gold : fill);
    if (anim) {
      rect.classList.add('wave-bar-anim');
      rect.style.animationDelay = (i * 0.038) + 's';
    }
    svg.appendChild(rect);
  });
  return svg;
}

/* ── Inject waveforms ── */
function initWaveforms() {
  var hl = document.getElementById('header-logo');
  if (hl) hl.innerHTML = TSE_LOGO_SVG;

  var hero = document.getElementById('hero-wave-wrap');
  if (hero) hero.appendChild(buildWaveform({ barW: 8, gap: 5, maxH: 130, fill: 'rgba(200,57,43,0.55)', gold: 'rgba(232,160,32,0.8)', anim: true }));

  document.querySelectorAll('.part-opener').forEach(function(el) {
    el.appendChild(buildWaveform({ barW: 3, gap: 2, maxH: 40, fill: 'rgba(200,57,43,1)', gold: 'rgba(232,160,32,1)', cls: 'part-wave' }));
  });

  var cw = document.getElementById('closing-wave');
  if (cw) cw.appendChild(buildWaveform({ barW: 5, gap: 3, maxH: 60, fill: 'rgba(200,57,43,0.55)', gold: 'rgba(232,160,32,0.75)' }));
}

/* ── Chapters dropdown ── */
function initDropdown() {
  var btn      = document.querySelector('.btn-chapters');
  var dropdown = document.querySelector('.chapters-dropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var open = dropdown.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.addEventListener('click', function(e) {
    if (!dropdown.contains(e.target) && e.target !== btn) {
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  /* Highlight links for the current page */
  var page = window.location.pathname.split('/').pop() || 'index.html';
  dropdown.querySelectorAll('.dd-ch').forEach(function(a) {
    var href = a.getAttribute('href') || '';
    if (href.split('#')[0] === page || (page === '' && href.startsWith('index'))) {
      a.classList.add('active');
    }
  });
  dropdown.querySelectorAll('.dd-part-label').forEach(function(el) {
    if (el.getAttribute('data-page') === page) el.classList.add('current');
  });
}

/* ── Accordion ── */
function closeAccordion(trigger) {
  var body = trigger.nextElementSibling;
  trigger.setAttribute('aria-expanded', 'false');
  if (body.style.height === 'auto') {
    body.style.height = body.scrollHeight + 'px';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { body.style.height = '0'; });
    });
  } else {
    body.style.height = '0';
  }
}

function openAccordion(trigger) {
  var body = trigger.nextElementSibling;
  trigger.setAttribute('aria-expanded', 'true');
  body.style.height = body.scrollHeight + 'px';
  body.addEventListener('transitionend', function onEnd() {
    if (trigger.getAttribute('aria-expanded') === 'true') body.style.height = 'auto';
    body.removeEventListener('transitionend', onEnd);
  });
}

function initAccordions() {
  var triggers = document.querySelectorAll('.accordion-trigger');
  if (!triggers.length) return;

  triggers.forEach(function(t) {
    t.setAttribute('aria-expanded', 'false');
    t.nextElementSibling.style.height = '0';

    t.addEventListener('click', function() {
      var wasOpen = t.getAttribute('aria-expanded') === 'true';
      triggers.forEach(function(other) {
        if (other.getAttribute('aria-expanded') === 'true') closeAccordion(other);
      });
      if (!wasOpen) openAccordion(t);
    });
  });

  /* Open from URL hash, or open first by default */
  var hash    = window.location.hash.slice(1);
  var hashEl  = hash ? document.getElementById(hash) : null;
  if (hashEl && hashEl.classList.contains('accordion-item')) {
    var t = hashEl.querySelector('.accordion-trigger');
    if (t) {
      openAccordion(t);
      setTimeout(function() {
        var top = hashEl.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }, 200);
    }
  } else {
    openAccordion(triggers[0]);
  }
}

/* ── Progress bar ── */
function initProgressBar() {
  var bar = document.getElementById('progress-bar');
  if (!bar) return;
  window.addEventListener('scroll', function() {
    var doc = document.documentElement;
    var top = doc.scrollTop || document.body.scrollTop;
    var h   = doc.scrollHeight - doc.clientHeight;
    bar.style.width = (h > 0 ? (top / h) * 100 : 0) + '%';
  });
}

/* ── Scroll reveal ── */
function initReveal() {
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function(el) { obs.observe(el); });
}

/* ── Tap-to-copy phrase cards ── */
function copyPhrase(el) {
  var text = el.textContent.replace(/^["“”]|["“”]$/g, '');
  var orig = el.textContent;
  function flash() {
    el.classList.add('copied');
    el.textContent = 'Copied!';
    setTimeout(function() { el.textContent = orig; el.classList.remove('copied'); }, 1300);
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(flash).catch(flash);
  } else {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta); flash();
  }
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', function() {
  initWaveforms();
  initDropdown();
  initAccordions();
  initProgressBar();
  initReveal();
});
