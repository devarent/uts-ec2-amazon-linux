/* ============================================================
   portal.js — logika Knowledge Base, Login, dan Workspace UTS
   ------------------------------------------------------------
   Semua data disimpan di localStorage browser sehingga portal
   tetap berjalan pada hosting statis (cPanel / AWS EC2 + Nginx)
   tanpa backend Node.js. Tidak ada password yang dikirim ke
   mana pun; ini gerbang demo untuk kebutuhan presentasi UTS.
   ============================================================ */
(function () {
  'use strict';

  var KEY_SESSION = 'maf.session';
  var KEY_CHECK = 'maf.checklist.v1';
  var KEY_DB = 'maf.database.v1';
  var KEY_PIPE = 'maf.pipeline.v1';
  var KEY_GB = 'maf.guestbook.v1';

  /* ---------- 1. Konteks runtime (host publik) ---------- */
  var MAF = (window.MAF = window.MAF || {});
  MAF.host = location.host || 'localhost';
  MAF.origin = location.origin || (location.protocol + '//' + location.host);
  MAF.protocol = location.protocol;
  MAF.isSecure = location.protocol === 'https:';
  MAF.isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(location.host);
  MAF.demo = {
    email: 'arya@unsada.ac.id',
    password: 'uts2026',
    name: 'Muhammad Arya Fatthurahman',
    nim: '2023230006'
  };

  /* ---------- 2. Helper storage (aman jika diblokir) ---------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function drop(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtTime(iso) {
    try {
      return new Date(iso).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  }

  /* ---------- 3. Sesi demo ---------- */
  function getSession() {
    var s = read(KEY_SESSION, null);
    if (!s || !s.email || !s.at) return null;
    return s;
  }

  function setSession(user) {
    write(KEY_SESSION, user);
    return user;
  }

  function clearSession() { drop(KEY_SESSION); }

  MAF.session = { get: getSession, set: setSession, clear: clearSession };

  /* ---------- 4. Tampilkan host publik di mana pun ---------- */
  function paintHost() {
    var hostEls = document.querySelectorAll('[data-host]');
    for (var i = 0; i < hostEls.length; i++) hostEls[i].textContent = MAF.host;

    var originEls = document.querySelectorAll('[data-origin]');
    for (var j = 0; j < originEls.length; j++) originEls[j].textContent = MAF.origin;

    var protoEls = document.querySelectorAll('[data-protocol]');
    for (var k = 0; k < protoEls.length; k++) {
      protoEls[k].textContent = MAF.protocol.replace(':', '').toUpperCase();
    }

    var schemeEls = document.querySelectorAll('[data-scheme]');
    for (var m = 0; m < schemeEls.length; m++) schemeEls[m].textContent = MAF.protocol + '//';

    var envEls = document.querySelectorAll('[data-env]');
    for (var n = 0; n < envEls.length; n++) {
      envEls[n].textContent = MAF.isLocal ? 'Lokal (uji)' : 'Publik';
      envEls[n].className = 'pill ' + (MAF.isLocal ? 'pill--warn' : 'pill--ok');
    }
  }

  /* ---------- 5. Login page ---------- */
  function initLogin() {
    var form = document.getElementById('loginForm');
    if (!form) return;

    var msg = document.getElementById('loginMsg');
    var email = document.getElementById('loginEmail');
    var pass = document.getElementById('loginPassword');

    var current = getSession();
    if (current) {
      showMsg('ok', 'Sesi aktif sebagai ' + current.name + '. Lanjut ke workspace…');
      window.setTimeout(function () { location.replace('dashboard.html'); }, 900);
      return;
    }

    function showMsg(type, text) {
      if (!msg) return;
      msg.className = 'form-msg is-visible ' + (type === 'ok' ? 'form-msg--ok' : 'form-msg--error');
      msg.textContent = text;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var e = (email.value || '').trim().toLowerCase();
      var p = pass.value || '';

      if (!e || !p) {
        showMsg('error', 'Email dan password wajib diisi.');
        return;
      }

      if (e !== MAF.demo.email || p !== MAF.demo.password) {
        showMsg('error', 'Kredensial tidak cocok. Gunakan akun demo yang tertera di bawah kartu login.');
        return;
      }

      setSession({
        name: MAF.demo.name,
        nim: MAF.demo.nim,
        email: MAF.demo.email,
        role: 'Mahasiswa S1 Teknologi Informasi',
        at: new Date().toISOString()
      });

      showMsg('ok', 'Berhasil masuk. Mengalihkan ke workspace…');
      window.setTimeout(function () { location.replace('dashboard.html'); }, 650);
    });

    var fill = document.getElementById('fillDemo');
    if (fill) {
      fill.addEventListener('click', function () {
        email.value = MAF.demo.email;
        pass.value = MAF.demo.password;
        showMsg('ok', 'Akun demo terisi. Tekan "Masuk ke workspace".');
      });
    }
  }

  /* ---------- 6. Dashboard guard + identitas ---------- */
  function initGuard() {
    var shell = document.querySelector('[data-guard]');
    if (!shell) return;

    var session = getSession();
    if (!session) {
      location.replace('login.html?next=dashboard.html');
      return;
    }

    var names = document.querySelectorAll('[data-user-name]');
    for (var i = 0; i < names.length; i++) names[i].textContent = session.name;

    var nims = document.querySelectorAll('[data-user-nim]');
    for (var j = 0; j < nims.length; j++) nims[j].textContent = session.nim;

    var mails = document.querySelectorAll('[data-user-email]');
    for (var k = 0; k < mails.length; k++) mails[k].textContent = session.email;

    var times = document.querySelectorAll('[data-session-time]');
    for (var m = 0; m < times.length; m++) times[m].textContent = fmtTime(session.at);

    var outs = document.querySelectorAll('[data-logout]');
    for (var n = 0; n < outs.length; n++) {
      outs[n].addEventListener('click', function (event) {
        event.preventDefault();
        clearSession();
        location.replace('login.html');
      });
    }
  }

  /* ---------- 7. Checklist EC2 (9 langkah) ---------- */
  var CHECKLIST = [
    'Pilih region dan buat key pair (.pem)',
    'Launch EC2 instance (Amazon Linux 2023 / Ubuntu)',
    'Atur Security Group: SSH /32, HTTP 80, HTTPS 443',
    'Hubungkan via SSH atau PuTTY, lalu perbarui paket',
    'Install web server (Nginx/Apache2) dan aktifkan service',
    'Unggah index.html + assets/ ke docroot',
    'Pasang Elastic IP dan arahkan domain (A record)',
    'Uji akses dari jaringan publik (bukan localhost)',
    'Ambil screenshot + rekam video, lalu stop/terminate resource'
  ];

  function initChecklist() {
    var wrap = document.getElementById('ec2Checklist');
    if (!wrap) return;

    var state = read(KEY_CHECK, null);
    if (!state || typeof state !== 'object') {
      state = {};
      for (var i = 0; i < CHECKLIST.length; i++) state['s' + (i + 1)] = false;
      write(KEY_CHECK, state);
    }

    var bar = document.getElementById('checkProgress');
    var label = document.getElementById('checkCount');
    var celebrated = false;

    function renderProgress() {
      var done = 0;
      for (var i = 0; i < CHECKLIST.length; i++) if (state['s' + (i + 1)]) done++;
      var pct = Math.round((done / CHECKLIST.length) * 100);
      if (bar) bar.style.width = pct + '%';
      if (label) label.textContent = done + ' / ' + CHECKLIST.length + ' langkah selesai (' + pct + '%)';

      if (done === CHECKLIST.length && !celebrated && window.MAF && window.MAF.toast) {
        celebrated = true;
        MAF.toast('Checklist EC2 lengkap 9/9. Verifikasi dari HP, lalu rekam video UTS.', 'ok');
      } else if (done < CHECKLIST.length) {
        celebrated = false;
      }
    }

    wrap.innerHTML = '';
    CHECKLIST.forEach(function (text, index) {
      var id = 's' + (index + 1);
      var row = document.createElement('label');
      row.className = 'check' + (state[id] ? ' is-done' : '');
      row.innerHTML =
        '<input type="checkbox" data-check="' + id + '"' + (state[id] ? ' checked' : '') + '>' +
        '<span>' +
          '<span class="check__title">' + String(index + 1).padStart(2, '0') + '. ' + esc(text) +
            ' <span class="pill pill--off" data-tag="' + id + '">' + (state[id] ? 'selesai' : 'belum') + '</span>' +
          '</span>' +
        '</span>';

      var box = row.querySelector('input');
      box.addEventListener('change', function () {
        state[id] = box.checked;
        write(KEY_CHECK, state);
        row.classList.toggle('is-done', box.checked);
        var tag = row.querySelector('[data-tag]');
        if (tag) {
          tag.textContent = box.checked ? 'selesai' : 'belum';
          tag.className = 'pill ' + (box.checked ? 'pill--ok' : 'pill--off');
        }
        renderProgress();
      });

      wrap.appendChild(row);
    });

    var reset = document.getElementById('checkReset');
    if (reset) {
      reset.addEventListener('click', function () {
        for (var i = 0; i < CHECKLIST.length; i++) state['s' + (i + 1)] = false;
        write(KEY_CHECK, state);
        initChecklist();
        if (window.MAF && window.MAF.toast) MAF.toast('Checklist EC2 direset ke kondisi awal.', 'info');
      });
    }

    renderProgress();
  }

  /* ---------- 8. Database workspace ---------- */
  var DB_DEFAULT = {
    engine: 'postgresql',
    host: '127.0.0.1',
    port: '5433',
    name: 'ec2lab',
    user: 'ec2lab',
    ssl: 'disable'
  };

  function initDatabase() {
    var form = document.getElementById('dbForm');
    if (!form) return;

    var saved = read(KEY_DB, null) || DB_DEFAULT;
    var f = {
      engine: document.getElementById('dbEngine'),
      host: document.getElementById('dbHost'),
      port: document.getElementById('dbPort'),
      name: document.getElementById('dbName'),
      user: document.getElementById('dbUser'),
      ssl: document.getElementById('dbSsl')
    };
    Object.keys(f).forEach(function (key) {
      if (f[key] && saved[key] != null) f[key].value = saved[key];
    });

    var out = document.getElementById('dbDsn');
    var msg = document.getElementById('dbMsg');

    function paint() {
      var engine = f.engine ? f.engine.value : 'postgresql';
      var prefix = engine === 'mysql' ? 'mysql' : engine === 'mariadb' ? 'mariadb' : 'postgresql';
      var dsn = prefix + '://' + (f.user ? f.user.value : '') + ':••••••' +
        '@' + (f.host ? f.host.value : '') + ':' + (f.port ? f.port.value : '') +
        '/' + (f.name ? f.name.value : '') +
        (f.ssl && f.ssl.value !== 'disable' ? '?sslmode=' + f.ssl.value : '');
      if (out) out.textContent = dsn;
    }

    function save() {
      var data = {};
      Object.keys(f).forEach(function (key) { data[key] = f[key] ? f[key].value : ''; });
      write(KEY_DB, data);
      paint();
    }

    Object.keys(f).forEach(function (key) {
      if (f[key]) f[key].addEventListener('input', save);
      if (f[key]) f[key].addEventListener('change', save);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      save();
      if (msg) {
        msg.className = 'form-msg is-visible form-msg--ok';
        msg.textContent = 'Konfigurasi disimpan di browser ini. Portal statis tidak membuka koneksi database nyata — ' +
          'nilai ini dipakai sebagai catatan lab dan aman untuk presentasi.';
      }
    });

    var test = document.getElementById('dbTest');
    if (test) {
      test.addEventListener('click', function () {
        if (!msg) return;
        msg.className = 'form-msg is-visible form-msg--ok';
        msg.textContent = 'Cek format lolos: ' +
          (f.host && f.host.value ? f.host.value : '(host kosong)') + ':' +
          (f.port && f.port.value ? f.port.value : '(port kosong)') +
          ' · ' + (f.engine ? f.engine.value.toUpperCase() : '') +
          '. Koneksi TCP sebenarnya hanya bisa diuji dari dalam EC2/VPC.';
      });
    }

    paint();
  }

  /* ---------- 9. Pipeline configurator + diagram ---------- */
  var PIPE_DEFAULT = {
    proxy: 'nginx',
    tls: 'letsencrypt',
    iac: 'terraform',
    cicd: 'github-actions',
    target: 'ec2',
    domain: ''
  };

  function initPipeline() {
    var form = document.getElementById('pipeForm');
    if (!form) return;

    var saved = read(KEY_PIPE, null) || PIPE_DEFAULT;
    var ids = ['proxy', 'tls', 'iac', 'cicd', 'target', 'domain'];
    var fields = {};
    ids.forEach(function (id) {
      fields[id] = document.getElementById('pipe' + id.charAt(0).toUpperCase() + id.slice(1));
      if (fields[id] && saved[id] != null) fields[id].value = saved[id];
    });

    var flow = document.getElementById('pipeFlow');
    var summary = document.getElementById('pipeSummary');

    var labels = {
      nginx: 'Nginx', apache: 'Apache2',
      letsencrypt: "Let's Encrypt", http: 'HTTP only',
      terraform: 'Terraform', opentofu: 'OpenTofu', manual: 'Manual (Console)',
      'github-actions': 'GitHub Actions', codepipeline: 'CodePipeline', gitlab: 'GitLab CI', jenkins: 'Jenkins',
      ec2: 'EC2 tunggal', eks: 'Amazon EKS'
    };

    function paint() {
      var v = {};
      ids.forEach(function (id) { v[id] = fields[id] ? fields[id].value : PIPE_DEFAULT[id]; });
      var nodes = [
        'Git push',
        labels[v.cicd] || v.cicd,
        'Docker image',
        labels[v.iac] || v.iac,
        labels[v.target] || v.target,
        labels[v.proxy] || v.proxy,
        labels[v.tls] || v.tls,
        'Publik'
      ];
      if (flow) {
        flow.innerHTML = nodes.map(function (node) {
          return '<span class="flow__node">' + esc(node) + '</span>';
        }).join('<span class="flow__arrow">→</span>');
      }
      if (summary) {
        summary.textContent = 'Alur: push ke branch utama → build & test → image → ' +
          (labels[v.iac] || v.iac) + ' menyiapkan ' + (labels[v.target] || v.target) +
          ' → ' + (labels[v.proxy] || v.proxy) + ' sebagai reverse proxy → TLS ' +
          (labels[v.tls] || v.tls) + ' → domain ' + (v.domain || '<domain>') + '.';
      }
    }

    function save() {
      var data = {};
      ids.forEach(function (id) { data[id] = fields[id] ? fields[id].value : ''; });
      write(KEY_PIPE, data);
      paint();
    }

    ids.forEach(function (id) {
      if (!fields[id]) return;
      fields[id].addEventListener('change', save);
      fields[id].addEventListener('input', save);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      save();
      var msg = document.getElementById('pipeMsg');
      if (msg) {
        msg.className = 'form-msg is-visible form-msg--ok';
        msg.textContent = 'Rancangan pipeline disimpan. Diagram di atas mengikuti pilihan Anda.';
      }
    });

    paint();
  }

  /* ---------- 10. Guestbook ---------- */
  var GB_SEED = [
    { name: 'Dosen Cloud Computing', msg: 'Deploy berhasil diakses lewat IP publik. Dokumentasi langkahnya rapi.', at: '2026-11-15T09:20:00+07:00' },
    { name: 'Rekan TIFM', msg: 'Checklist EC2-nya membantu, terutama bagian Security Group dan Elastic IP.', at: '2026-11-15T13:05:00+07:00' },
    { name: 'Muhammad Arya F.', msg: 'Catatan pribadi: selalu terminate instance setelah selesai agar tidak kena biaya.', at: '2026-11-16T07:45:00+07:00' }
  ];

  function initGuestbook() {
    var list = document.getElementById('gbList');
    var form = document.getElementById('gbForm');
    if (!list || !form) return;

    var items = read(KEY_GB, null);
    if (!Array.isArray(items)) {
      items = GB_SEED.slice();
      write(KEY_GB, items);
    }

    function paint() {
      if (!items.length) {
        list.innerHTML = '<p class="gb-empty">Belum ada pesan. Jadilah yang pertama menulis di guestbook.</p>';
        return;
      }
      list.innerHTML = items.slice().reverse().map(function (item) {
        return '<article class="gb-item">' +
          '<div class="gb-item__meta">' +
            '<span class="gb-item__name">' + esc(item.name) + '</span>' +
            '<span class="gb-item__time">' + esc(fmtTime(item.at)) + '</span>' +
          '</div>' +
          '<p class="gb-item__msg">' + esc(item.msg) + '</p>' +
        '</article>';
      }).join('');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var nameEl = document.getElementById('gbName');
      var msgEl = document.getElementById('gbMessage');
      var name = (nameEl && nameEl.value || '').trim();
      var msg = (msgEl && msgEl.value || '').trim();
      if (!name || !msg) return;

      items.push({ name: name.slice(0, 60), msg: msg.slice(0, 600), at: new Date().toISOString() });
      write(KEY_GB, items);
      if (msgEl) msgEl.value = '';
      paint();
      if (window.MAF && window.MAF.toast) {
        MAF.toast('Pesan tersimpan di guestbook (localStorage browser ini).', 'ok');
      }
    });

    var reset = document.getElementById('gbReset');
    if (reset) {
      reset.addEventListener('click', function () {
        items = GB_SEED.slice();
        write(KEY_GB, items);
        paint();
        if (window.MAF && window.MAF.toast) MAF.toast('Guestbook dikembalikan ke contoh awal.', 'info');
      });
    }

    paint();
  }

  /* ---------- 11. TOC knowledge base (scroll spy) ---------- */
  function initKbToc() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.kb-toc a[href^="#"]'));
    if (!links.length) return;

    /* Daftar isi versi mobile: dropdown agar tidak perlu scroll horizontal */
    var layout = document.querySelector('.kb-layout');
    if (layout && !document.querySelector('.kb-toc-mobile')) {
      var mobile = document.createElement('details');
      mobile.className = 'kb-toc-mobile';

      var summary = document.createElement('summary');
      summary.textContent = 'Daftar isi — ' + links.length + ' bagian';

      var box = document.createElement('div');
      box.className = 'kb-toc-mobile__links';

      links.forEach(function (link) {
        var clone = link.cloneNode(true);
        clone.classList.remove('is-active');
        clone.addEventListener('click', function () { mobile.removeAttribute('open'); });
        box.appendChild(clone);
      });

      mobile.appendChild(summary);
      mobile.appendChild(box);

      var wrapper = document.createElement('div');
      wrapper.className = 'container';
      wrapper.appendChild(mobile);
      layout.parentNode.insertBefore(wrapper, layout);
    }

    if (!('IntersectionObserver' in window)) return;

    var sections = links.map(function (link) {
      return document.getElementById(link.getAttribute('href').slice(1));
    }).filter(Boolean);

    if (!document.querySelector('.kb-toc a.is-active') && links.length) {
      links[0].classList.add('is-active');
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  function initKbSearch() {
    var search = document.getElementById('kbTopicSearch');
    var status = document.getElementById('kbSearchStatus');
    if (!search || !status) return;

    var links = Array.prototype.slice.call(document.querySelectorAll(
      '.kb-toc a[href^="#"], .kb-toc-mobile__links a[href^="#"]'
    ));

    function filterLinks() {
      var query = (search.value || '').trim().toLowerCase();
      var matches = {};

      links.forEach(function (link) {
        var match = !query || (link.textContent || '').trim().toLowerCase().indexOf(query) !== -1;
        link.hidden = !match;
        if (match) matches[link.getAttribute('href')] = true;
      });

      var count = Object.keys(matches).length;
      status.textContent = !query
        ? ''
        : count
          ? count + ' topik ditemukan'
          : 'Tidak ada topik yang cocok. Coba Docker, Terraform, Helm, atau CI/CD.';
    }

    search.addEventListener('input', filterLinks);
  }

  /* ---------- 12. Tombol salin blok kode ---------- */
  function initCopy() {
    var buttons = document.querySelectorAll('[data-copy]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (event) {
        var btn = event.currentTarget;
        var sel = btn.getAttribute('data-copy');
        var target = sel ? document.querySelector(sel) : btn.parentElement.querySelector('code, pre, .code');
        if (!target) return;
        var text = target.textContent || '';
        var done = function () {
          var original = btn.textContent;
          btn.textContent = 'Tersalin ✓';
          window.setTimeout(function () { btn.textContent = original; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { /* ignore */ });
        }
      });
    }
  }

  /* ---------- 13. Jam & tahun ---------- */
  function initMisc() {
    var years = document.querySelectorAll('[data-year]');
    for (var i = 0; i < years.length; i++) years[i].textContent = new Date().getFullYear();

    var clock = document.querySelectorAll('[data-clock]');
    if (clock.length) {
      var tick = function () {
        var now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        for (var j = 0; j < clock.length; j++) clock[j].textContent = now;
      };
      tick();
      window.setInterval(tick, 1000);
    }
  }

  /* ---------- 14. Boot ---------- */
  function boot() {
    paintHost();
    initLogin();
    initGuard();
    initChecklist();
    initDatabase();
    initPipeline();
    initGuestbook();
    initKbToc();
    initKbSearch();
    initCopy();
    initMisc();
    initTechTabs();
    initBackToTop();
    initProgressBar();
    initDropdowns();
    initCopyButtons();
    initDemoButtons();
  }

  /* ---------- 15. Tech Tabs ---------- */
  function initTechTabs() {
    var tabs = document.querySelectorAll('.tech-tab');
    var contents = document.querySelectorAll('.tech-tab-content');
    if (!tabs.length) return;

    function activate(tab, moveFocus) {
      var targetTab = tab.getAttribute('data-tab');

      tabs.forEach(function (item) {
        var active = item === tab;
        item.classList.toggle('tech-tab--active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
        item.setAttribute('tabindex', active ? '0' : '-1');
      });

      contents.forEach(function (content) {
        var active = content.id === 'tab-' + targetTab;
        content.hidden = !active;
        content.classList.toggle('tech-tab-content--active', active);
      });

      if (moveFocus) tab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { activate(tab, false); });
      tab.addEventListener('keydown', function (event) {
        var next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;

        event.preventDefault();
        activate(tabs[next], true);
      });
    });
  }

  /* ---------- 16. Back to Top ---------- */
  function initBackToTop() {
    var backTop = document.querySelector('.back-top');
    if (!backTop) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 300) {
        backTop.classList.add('is-visible');
      } else {
        backTop.classList.remove('is-visible');
      }
    });

    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 17. Reading progress ---------- */
  function initProgressBar() {
    var progress = document.querySelector('.progress');
    if (!progress) return;

    function update() {
      var documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = documentHeight > 0 ? window.scrollY / documentHeight : 0;
      progress.style.width = (Math.min(1, Math.max(0, ratio)) * 100).toFixed(2) + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- 18. Dropdowns ---------- */
  function initDropdowns() {
    var dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(function (dropdown) {
      var trigger = dropdown.querySelector('.dropdown__trigger');
      if (!trigger) return;

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('is-open');
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function () {
      dropdowns.forEach(function (dropdown) {
        dropdown.classList.remove('is-open');
      });
    });
  }

  /* ---------- 19. Copy Buttons ---------- */
  function initCopyButtons() {
    var codeBlocks = document.querySelectorAll('.code');
    
    codeBlocks.forEach(function (codeBlock) {
      // Skip if already has copy button
      if (codeBlock.querySelector('.copy-btn')) return;

      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.type = 'button';
      btn.textContent = 'Copy';
      
      btn.addEventListener('click', function () {
        var text = codeBlock.textContent.replace(/^.*\n/, ''); // Remove label line
        navigator.clipboard.writeText(text.trim()).then(function () {
          btn.textContent = 'Copied!';
          btn.classList.add('is-visible');
          setTimeout(function () {
            btn.textContent = 'Copy';
            btn.classList.remove('is-visible');
          }, 2000);
        });
      });
      
      codeBlock.style.position = 'relative';
      codeBlock.appendChild(btn);
    });
  }

  /* ---------- 20. Demo Buttons ---------- */
  function initDemoButtons() {
    // Toast demos
    var toastInfo = document.getElementById('toastDemoInfo');
    var toastSuccess = document.getElementById('toastDemoSuccess');
    var toastWarning = document.getElementById('toastDemoWarning');
    var toastError = document.getElementById('toastDemoError');

    if (toastInfo) toastInfo.addEventListener('click', function () {
      MAF.toast('This is an info notification', 'info');
    });
    if (toastSuccess) toastSuccess.addEventListener('click', function () {
      MAF.toast('Operation completed successfully!', 'ok');
    });
    if (toastWarning) toastWarning.addEventListener('click', function () {
      MAF.toast('Please review your configuration', 'warn');
    });
    if (toastError) toastError.addEventListener('click', function () {
      MAF.toast('An error occurred. Please try again.', 'error');
    });

    // Modal demos
    var modalConfirm = document.getElementById('modalDemoConfirm');
    var modalDanger = document.getElementById('modalDemoDanger');

    if (modalConfirm) modalConfirm.addEventListener('click', function () {
      MAF.confirm({
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed with this action?',
        confirmLabel: 'Yes, proceed',
        cancelLabel: 'Cancel',
        danger: false
      }).then(function (ok) {
        if (ok) {
          MAF.toast('Action confirmed!', 'ok');
        } else {
          MAF.toast('Action cancelled', 'warn');
        }
      });
    });

    if (modalDanger) modalDanger.addEventListener('click', function () {
      MAF.confirm({
        title: 'Dangerous Action',
        message: 'This action cannot be undone. Are you absolutely sure?',
        confirmLabel: 'Yes, delete',
        cancelLabel: 'Cancel',
        danger: true
      }).then(function (ok) {
        if (ok) {
          MAF.toast('Item deleted', 'error');
        }
      });
    });

    // Alert components
    initAlerts();

    // Sheet (Drawer) components
    initSheets();

    // Popover components
    initPopovers();

    // Hover Card components
    initHoverCards();

    // Command Palette (Cmd+K)
    initCommandPalette();

    // Collapsible components
    initCollapsibles();

    // Switch toggles
    initSwitches();

    // Carousel components
    initCarousels();

    // Calendar components
    initCalendars();

    // Date Picker components
    initDatePickers();

    // Combobox components
    initComboboxes();

    // Tag Input components
    initTagInputs();

    // Resizable panels
    initResizable();

    // Spinner components
    initSpinners();

    // Progress Bar components
    initProgressBars();
  }

  // ---------- New Component Functions ----------

  function initAlerts() {
    document.querySelectorAll('.alert').forEach(function (alert) {
      var closeBtn = alert.querySelector('.alert__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          alert.style.opacity = '0';
          alert.style.transform = 'translateX(20px)';
          setTimeout(function () {
            alert.style.display = 'none';
          }, 200);
        });
      }
    });
  }

  function initSheets() {
    document.querySelectorAll('[data-sheet-open]').forEach(function (trigger) {
      var targetId = trigger.getAttribute('data-sheet-open');
      var sheet = document.getElementById(targetId);
      if (!sheet) return;

      trigger.addEventListener('click', function () {
        sheet.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
      });

      var closeBtn = sheet.querySelector('[data-sheet-close]');
      var backdrop = sheet.querySelector('.sheet__backdrop');

      function closeSheet() {
        sheet.classList.remove('is-visible');
        document.body.style.overflow = '';
      }

      if (closeBtn) closeBtn.addEventListener('click', closeSheet);
      if (backdrop) backdrop.addEventListener('click', closeSheet);

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && sheet.classList.contains('is-visible')) {
          closeSheet();
        }
      });
    });
  }

  function initPopovers() {
    document.querySelectorAll('.popover').forEach(function (popover) {
      var trigger = popover.querySelector('.popover__trigger');
      var content = popover.querySelector('.popover__content');
      if (!trigger || !content) return;

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        popover.classList.toggle('is-open');
      });

      document.addEventListener('click', function (e) {
        if (!popover.contains(e.target)) {
          popover.classList.remove('is-open');
        }
      });
    });
  }

  function initHoverCards() {
    // Hover cards are CSS-only, no JS needed
    // Just add click support for mobile
    document.querySelectorAll('.hover-card__trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var card = trigger.closest('.hover-card');
        var content = card.querySelector('.hover-card__content');
        if (content) {
          content.style.opacity = content.style.opacity === '1' ? '0' : '1';
          content.style.visibility = content.style.visibility === 'visible' ? 'hidden' : 'visible';
        }
      });
    });
  }

  function initCommandPalette() {
    var palette = document.querySelector('.command-palette');
    if (!palette) return;

    var input = palette.querySelector('.command-palette__input');
    var list = palette.querySelector('.command-palette__list');
    var items = palette.querySelectorAll('.command-palette__item');
    var selectedIndex = -1;

    function openPalette() {
      palette.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
      if (input) input.focus();
    }

    function closePalette() {
      palette.classList.remove('is-visible');
      document.body.style.overflow = '';
    }

    // Open with Cmd+K or Ctrl+K
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (palette.classList.contains('is-visible')) {
          closePalette();
        } else {
          openPalette();
        }
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && palette.classList.contains('is-visible')) {
        closePalette();
      }
    });

    // Close on backdrop click
    var backdrop = palette.querySelector('.command-palette__backdrop');
    if (backdrop) backdrop.addEventListener('click', closePalette);

    // Item selection
    function selectItem(index) {
      items.forEach(function (item, i) {
        item.classList.toggle('is-selected', i === index);
      });
      selectedIndex = index;
    }

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (!palette.classList.contains('is-visible')) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var nextIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
        selectItem(nextIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prevIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
        selectItem(prevIndex);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        var link = items[selectedIndex].querySelector('a');
        if (link) link.click();
      }
    });

    // Click to select
    items.forEach(function (item, index) {
      item.addEventListener('click', function () {
        selectItem(index);
        var link = item.querySelector('a');
        if (link) {
          setTimeout(closePalette, 100);
        }
      });
      item.addEventListener('mouseenter', function () {
        selectItem(index);
      });
    });

    // Filter items based on input
    if (input) {
      input.addEventListener('input', function () {
        var query = input.value.toLowerCase();
        items.forEach(function (item) {
          var title = item.querySelector('.command-palette__item-title').textContent.toLowerCase();
          var desc = item.querySelector('.command-palette__item-desc').textContent.toLowerCase();
          var match = title.includes(query) || desc.includes(query);
          item.style.display = match ? 'flex' : 'none';
        });
        selectedIndex = -1;
      });
    }
  }

  function initCollapsibles() {
    document.querySelectorAll('.collapsible').forEach(function (collapsible) {
      var trigger = collapsible.querySelector('.collapsible__trigger');
      var content = collapsible.querySelector('.collapsible__content');
      if (!trigger || !content) return;

      trigger.addEventListener('click', function () {
        collapsible.classList.toggle('is-open');
      });
    });
  }

  function initSwitches() {
    document.querySelectorAll('.switch input').forEach(function (input) {
      input.addEventListener('change', function () {
        var label = input.closest('.switch').querySelector('.switch__label');
        if (label) {
          label.textContent = input.checked ? 'On' : 'Off';
        }
      });
    });
  }

  function initCarousels() {
    document.querySelectorAll('.carousel').forEach(function (carousel) {
      var container = carousel.querySelector('.carousel__container');
      var slides = carousel.querySelectorAll('.carousel__slide');
      var prevBtn = carousel.querySelector('.carousel__button--prev');
      var nextBtn = carousel.querySelector('.carousel__button--next');
      var dots = carousel.querySelectorAll('.carousel__dot');
      var currentIndex = 0;
      var totalSlides = slides.length;

      if (totalSlides === 0) return;

      function goToSlide(index) {
        currentIndex = (index + totalSlides) % totalSlides;
        container.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === currentIndex);
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          goToSlide(currentIndex - 1);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          goToSlide(currentIndex + 1);
        });
      }

      dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
          goToSlide(index);
        });
      });

      // Auto-play
      var autoPlayInterval = setInterval(function () {
        goToSlide(currentIndex + 1);
      }, 5000);

      // Pause on hover
      carousel.addEventListener('mouseenter', function () {
        clearInterval(autoPlayInterval);
      });

      carousel.addEventListener('mouseleave', function () {
        autoPlayInterval = setInterval(function () {
          goToSlide(currentIndex + 1);
        }, 5000);
      });
    });
  }

  function initCalendars() {
    document.querySelectorAll('.calendar').forEach(function (calendar) {
      var header = calendar.querySelector('.calendar__header');
      var grid = calendar.querySelector('.calendar__grid');
      if (!header || !grid) return;

      var currentDate = new Date();
      var selectedDate = null;

      function renderCalendar() {
        var year = currentDate.getFullYear();
        var month = currentDate.getMonth();

        // Update title
        var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
        header.querySelector('.calendar__title').textContent = monthNames[month] + ' ' + year;

        // Clear grid
        grid.innerHTML = '';

        // Add weekday headers
        var weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        weekdays.forEach(function (day) {
          var weekdayEl = document.createElement('div');
          weekdayEl.className = 'calendar__weekday';
          weekdayEl.textContent = day;
          grid.appendChild(weekdayEl);
        });

        // Get first day of month
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var daysInPrevMonth = new Date(year, month, 0).getDate();

        // Previous month days
        for (var i = firstDay - 1; i >= 0; i--) {
          var prevDay = document.createElement('div');
          prevDay.className = 'calendar__day is-other-month';
          prevDay.textContent = daysInPrevMonth - i;
          grid.appendChild(prevDay);
        }

        // Current month days
        for (var day = 1; day <= daysInMonth; day++) {
          var dayEl = document.createElement('div');
          dayEl.className = 'calendar__day';
          dayEl.textContent = day;

          var date = new Date(year, month, day);
          var today = new Date();

          if (date.toDateString() === today.toDateString()) {
            dayEl.classList.add('is-today');
          }

          if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
            dayEl.classList.add('is-selected');
          }

          dayEl.addEventListener('click', function () {
            selectedDate = new Date(year, month, day);
            renderCalendar();
          });

          grid.appendChild(dayEl);
        }

        // Next month days
        var totalCells = firstDay + daysInMonth;
        var remainingCells = (7 - (totalCells % 7)) % 7;
        for (var nextDay = 1; nextDay <= remainingCells; nextDay++) {
          var nextDayEl = document.createElement('div');
          nextDayEl.className = 'calendar__day is-other-month';
          nextDayEl.textContent = nextDay;
          grid.appendChild(nextDayEl);
        }
      }

      // Navigation buttons
      var prevBtn = header.querySelector('.calendar__nav-btn--prev');
      var nextBtn = header.querySelector('.calendar__nav-btn--next');

      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          currentDate.setMonth(currentDate.getMonth() - 1);
          renderCalendar();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          currentDate.setMonth(currentDate.getMonth() + 1);
          renderCalendar();
        });
      }

      renderCalendar();
    });
  }

  function initDatePickers() {
    document.querySelectorAll('.date-picker').forEach(function (picker) {
      var trigger = picker.querySelector('.date-picker__input');
      var content = picker.querySelector('.date-picker__content');
      if (!trigger || !content) return;

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        picker.classList.toggle('is-open');
      });

      document.addEventListener('click', function (e) {
        if (!picker.contains(e.target)) {
          picker.classList.remove('is-open');
        }
      });
    });
  }

  function initComboboxes() {
    document.querySelectorAll('.combobox').forEach(function (combobox) {
      var input = combobox.querySelector('.combobox__input');
      var dropdown = combobox.querySelector('.combobox__dropdown');
      var options = combobox.querySelectorAll('.combobox__option');
      if (!input || !dropdown) return;

      input.addEventListener('focus', function () {
        combobox.classList.add('is-open');
      });

      input.addEventListener('input', function () {
        var query = input.value.toLowerCase();
        options.forEach(function (option) {
          var text = option.textContent.toLowerCase();
          option.style.display = text.includes(query) ? 'block' : 'none';
        });
      });

      options.forEach(function (option) {
        option.addEventListener('click', function () {
          input.value = option.textContent;
          combobox.classList.remove('is-open');
        });
      });

      document.addEventListener('click', function (e) {
        if (!combobox.contains(e.target)) {
          combobox.classList.remove('is-open');
        }
      });
    });
  }

  function initTagInputs() {
    document.querySelectorAll('.tag-input').forEach(function (tagInput) {
      var input = tagInput.querySelector('.tag-input__input');
      if (!input) return;

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && input.value.trim()) {
          e.preventDefault();
          var tag = document.createElement('span');
          tag.className = 'tag-input__tag';
          tag.innerHTML = input.value.trim() + ' <button class="tag-input__tag-remove">×</button>';

          var removeBtn = tag.querySelector('.tag-input__tag-remove');
          removeBtn.addEventListener('click', function () {
            tag.remove();
          });

          tagInput.insertBefore(tag, input);
          input.value = '';
        }
      });
    });
  }

  function initResizable() {
    document.querySelectorAll('.resizable').forEach(function (resizable) {
      var handle = resizable.querySelector('.resizable__handle');
      var leftPanel = resizable.querySelector('.resizable__panel--left');
      var rightPanel = resizable.querySelector('.resizable__panel--right');
      if (!handle || !leftPanel || !rightPanel) return;

      var isDragging = false;
      var startX = 0;
      var startWidth = 0;

      handle.addEventListener('mousedown', function (e) {
        isDragging = true;
        startX = e.clientX;
        startWidth = leftPanel.offsetWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      });

      document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        var deltaX = e.clientX - startX;
        var newWidth = Math.max(100, Math.min(startWidth + deltaX, resizable.offsetWidth - 100));
        leftPanel.style.flex = '0 0 ' + newWidth + 'px';
        rightPanel.style.flex = '1';
      });

      document.addEventListener('mouseup', function () {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      });
    });
  }

  function initSpinners() {
    // Spinners are CSS-only, no JS needed
    // Just add loading state management
    document.querySelectorAll('[data-loading]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var originalText = btn.textContent;
        btn.innerHTML = '<span class="spinner spinner--sm"></span> Loading...';
        btn.disabled = true;

        setTimeout(function () {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 2000);
      });
    });
  }

  function initProgressBars() {
    document.querySelectorAll('.progress-bar').forEach(function (bar) {
      var fill = bar.querySelector('.progress-bar__fill');
      var label = bar.querySelector('.progress-bar__label');
      if (!fill) return;

      // Animate on scroll into view
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var targetWidth = fill.style.width || fill.getAttribute('data-width') || '0%';
            fill.style.width = '0%';
            setTimeout(function () {
              fill.style.width = targetWidth;
            }, 100);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      observer.observe(bar);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
