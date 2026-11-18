/* ============================================================
   ui.js — komponen UI bersama (toast + modal confirm)
   ------------------------------------------------------------
   Dipakai semua halaman portal UTS. Tidak butuh dependency;
   pola mirip Shadcn/HeroUI tetapi ditulis langsung dengan
   HTML + CSS + JS vanilla.
   ============================================================ */
(function () {
  'use strict';

  var MAF = (window.MAF = window.MAF || {});

  /* ---------- Toast ---------- */
  function ensureWrap() {
    var wrap = document.querySelector('.toast-wrap');
    if (wrap) return wrap;
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    wrap.setAttribute('aria-live', 'polite');
    document.body.appendChild(wrap);
    return wrap;
  }

  var ICONS = {
    ok: '✓',
    info: 'i',
    warn: '!',
    error: '×'
  };

  function toast(message, type) {
    type = type || 'info';
    var wrap = ensureWrap();

    var node = document.createElement('div');
    node.className = 'toast toast--' + type;
    node.innerHTML =
      '<span class="toast__icon" aria-hidden="true">' + (ICONS[type] || ICONS.info) + '</span>' +
      '<span class="toast__body"></span>';
    node.querySelector('.toast__body').textContent = String(message);

    wrap.appendChild(node);

    window.setTimeout(function () {
      node.classList.add('is-leaving');
      window.setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 220);
    }, 4200);

    return node;
  }

  MAF.toast = toast;

  /* ---------- Modal confirm ---------- */
  function confirmDialog(options) {
    options = options || {};
    var title = options.title || 'Konfirmasi';
    var message = options.message || '';
    var confirmLabel = options.confirmLabel || 'Ya, lanjutkan';
    var cancelLabel = options.cancelLabel || 'Batal';
    var danger = options.danger === true;

    return new Promise(function (resolve) {
      var modal = document.createElement('div');
      modal.className = 'modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'modal-title');

      modal.innerHTML =
        '<div class="modal__backdrop" data-modal-close></div>' +
        '<div class="modal__dialog">' +
          '<h3 id="modal-title"></h3>' +
          '<p></p>' +
          '<div class="modal__actions">' +
            '<button type="button" class="btn btn--ghost btn--sm" data-modal-cancel></button>' +
            '<button type="button" class="btn btn--sm ' + (danger ? 'btn--danger' : 'btn--primary') + '" data-modal-confirm></button>' +
          '</div>' +
        '</div>';

      modal.querySelector('#modal-title').textContent = title;
      modal.querySelector('p').textContent = message;
      modal.querySelector('[data-modal-cancel]').textContent = cancelLabel;
      modal.querySelector('[data-modal-confirm]').textContent = confirmLabel;

      var previousFocus = document.activeElement;
      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';

      var confirmBtn = modal.querySelector('[data-modal-confirm]');
      confirmBtn.focus();

      function close(result) {
        document.removeEventListener('keydown', onKey, true);
        if (modal.parentNode) modal.parentNode.removeChild(modal);
        document.body.style.overflow = '';
        if (previousFocus && previousFocus.focus) previousFocus.focus();
        resolve(result);
      }

      function onKey(event) {
        if (event.key === 'Escape') {
          event.stopPropagation();
          close(false);
        }
      }

      modal.addEventListener('click', function (event) {
        var target = event.target;
        if (target.closest('[data-modal-close]')) close(false);
        else if (target.closest('[data-modal-cancel]')) close(false);
        else if (target.closest('[data-modal-confirm]')) close(true);
      });
      document.addEventListener('keydown', onKey, true);
    });
  }

  MAF.confirm = confirmDialog;
})();
