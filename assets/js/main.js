/* ============================================================
   Script minimal untuk website portofolio
   - Mobile navigation toggle
   - Menandai link navigasi yang sedang aktif (scroll spy)
   - Tahun footer otomatis
   ============================================================ */
(function () {
  'use strict';

  /* ---- 1. Menu mobile (hamburger) ---- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Tutup menu ketika salah satu link di-klik
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- 2. Scroll spy: tandai section yang sedang terlihat ---- */
  var sections = Array.prototype.slice.call(
    document.querySelectorAll('section[id]')
  );
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav a[href^="#"]')
  );

  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ---- 2b. Progress bar scroll + tombol kembali ke atas ---- */
  var progress = document.getElementById('progress');
  var backTop = document.getElementById('backTop');

  function onScroll() {
    var doc = document.documentElement;
    var max = Math.max(doc.scrollHeight - doc.clientHeight, 1);
    var ratio = Math.min(Math.max((doc.scrollTop || document.body.scrollTop) / max, 0), 1);
    if (progress) progress.style.width = (ratio * 100).toFixed(2) + '%';
    if (backTop) backTop.classList.toggle('is-visible', (doc.scrollTop || 0) > 480);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- 3. Tahun footer otomatis ---- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---- 4. Sinkronkan alamat publik yang sedang dipakai ---- */
  var host = location.host || '';
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);

  var liveHost = isLocal ? 'aryafatthurahman1.my.id' : host;
  var liveUrl = isLocal
    ? 'http://aryafatthurahman1.my.id'
    : location.origin + location.pathname.replace(/[^/]*$/, '');

  document.querySelectorAll('[data-live-host]').forEach(function (el) {
    el.textContent = liveHost;
  });

  document.querySelectorAll('[data-live-url]').forEach(function (el) {
    el.href = liveUrl;
  });
})();
