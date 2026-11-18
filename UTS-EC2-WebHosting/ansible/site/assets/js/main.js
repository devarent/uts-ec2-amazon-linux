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
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          link.style.color =
            link.getAttribute('href') === '#' + id ? 'var(--accent-dark)' : '';
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ---- 3. Tahun footer otomatis ---- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
