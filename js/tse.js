/* ═══════════════════════════════════════════════════
   THE SPEAKING EDGE — Shared JavaScript
   speakingedgeglobal.com  |  v1.0  |  April 2026
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Active nav link ── */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  /* ── Mobile nav toggle ── */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });
  }

  /* ── Scroll reveal ── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          setTimeout(function () {
            entry.target.classList.add('visible');
          }, i * 70);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(function (el) { observer.observe(el); });
  }

  /* ── Contact form — let Netlify handle submission natively ── */

  /* ── Module strip accordion ── */
  var moduleStrip = document.getElementById('moduleStrip');
  if (moduleStrip) {
    var mPanels = moduleStrip.querySelectorAll('.module-panel');
    var mDots   = document.querySelectorAll('#hintDots span');
    var mActive = 0;
    var mCycle;

    function activatePanel(idx) {
      mPanels.forEach(function(p) { p.classList.remove('active'); });
      mDots.forEach(function(d)   { d.classList.remove('on'); });
      mPanels[idx].classList.add('active');
      if (mDots[idx]) mDots[idx].classList.add('on');
      mActive = idx;
    }

    mPanels.forEach(function(panel, i) {
      panel.addEventListener('click', function() {
        clearInterval(mCycle);
        activatePanel(i);
      });
    });

    mCycle = setInterval(function() {
      var next = (mActive + 1) % mPanels.length;
      activatePanel(next);
      if (next === mPanels.length - 1) clearInterval(mCycle);
    }, 2000);
  }

});
