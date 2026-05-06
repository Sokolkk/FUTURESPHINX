(function () {
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyUs1-RhSnAnVu3MHnGt1LZ-CLM1V-k5OVudEaPMGj7uZDX2-lmnnBKiEK7C6rh_Eripg/exec';

  var modal = document.getElementById('leadFormModal');
  var form = document.getElementById('leadCaptureForm');
  var statusEl = document.getElementById('leadFormStatus');
  var submitBtn = document.getElementById('leadSubmitBtn');
  var nameInput = form && form.querySelector('input[name="name"]');
  var contactInput = document.getElementById('leadContactInput');
  var taskInput = form && form.querySelector('select[name="taskType"]');
  var messageInput = document.getElementById('leadMessageInput');
  var consentInput = document.getElementById('leadConsentInput');

  if (!modal || !form) return;

  /* ---- open / close ---- */

  function open() {
    modal.classList.remove('is-closing');
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('modal-open');
    requestAnimationFrame(function () {
      modal.classList.add('is-visible');
    });
  }

  function close(finalize) {
    if (finalize) return forceClose();
    modal.classList.remove('is-visible');
    modal.classList.add('is-closing');
    setTimeout(forceClose, 300);
  }

  function forceClose() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('is-visible', 'is-closing');
    document.documentElement.classList.remove('modal-open');
    if (statusEl) { statusEl.textContent = ''; statusEl.className = 'lead-form__status'; }
    clearErrors();
  }

  document.querySelectorAll('.js-open-form').forEach(function (btn) {
    btn.addEventListener('click', open);
  });

  document.querySelectorAll('[data-close-form]').forEach(function (el) {
    el.addEventListener('click', function () { close(); });
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hidden) close();
  });

  modal.addEventListener('click', function (e) {
    if (e.target === modal) close();
  });

  /* ---- validation ---- */

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  var tgRe = /^(?:@[\w]{5,32}|https?:\/\/(?:t\.me|telegram\.me)\/[\w]{5,32})$/i;
  var phoneRe = /^(?:\+?\d[\d\s\-()]{8,}\d)$/;

  function isValidContact(v) {
    var s = String(v || '').trim();
    return emailRe.test(s) || tgRe.test(s) || phoneRe.test(s);
  }

  function ensureErrorEl(field) {
    var wrap = field.closest('.lead-field, .lead-consent');
    if (!wrap) return null;
    var el = wrap.querySelector('.lead-field__error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'lead-field__error';
      el.setAttribute('aria-live', 'polite');
      wrap.appendChild(el);
    }
    return el;
  }

  function setError(field, msg) {
    field.classList.toggle('is-invalid', !!msg);
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    var err = ensureErrorEl(field);
    if (err) err.textContent = msg || '';
  }

  function clearErrors() {
    [nameInput, contactInput, taskInput, messageInput, consentInput].forEach(function (f) {
      if (f) setError(f, '');
    });
  }

  function validateField(field) {
    if (!field) return true;
    var msg = '';

    if (field === nameInput) {
      var v = field.value.trim();
      if (!v) msg = 'Укажите имя.';
      else if (v.length < 2) msg = 'Имя должно быть не короче 2 символов.';
    } else if (field === contactInput) {
      var cv = field.value.trim();
      if (!cv) msg = 'Укажите email, Telegram или телефон.';
      else if (!isValidContact(cv)) msg = 'Введите корректный email, Telegram (@username) или телефон.';
    } else if (field === taskInput) {
      if (!field.value.trim()) msg = 'Выберите тип задачи.';
    } else if (field === messageInput) {
      var mv = field.value.trim();
      if (mv.length < 50) msg = 'Описание должно быть не короче 50 символов.';
    } else if (field === consentInput) {
      if (!field.checked) msg = 'Подтвердите согласие на обработку данных.';
    }

    setError(field, msg);
    return !msg;
  }

  /* ---- live validation ---- */

  if (contactInput) contactInput.addEventListener('input', function () { validateField(contactInput); });
  if (messageInput) messageInput.addEventListener('input', function () { validateField(messageInput); });

  /* ---- submit ---- */

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var ok = true;
    [nameInput, contactInput, taskInput, messageInput, consentInput].forEach(function (f) {
      if (!validateField(f)) ok = false;
    });
    if (!ok) {
      if (statusEl) { statusEl.textContent = 'Проверьте поля: есть ошибки.'; statusEl.className = 'lead-form__status is-error'; }
      return;
    }

    var fd = new FormData(form);
    var payload = Object.fromEntries(fd.entries());
    payload.source = 'FutureSphinx Lite';
    payload.timestamp = new Date().toISOString();

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Отправляем...'; }
    if (statusEl) { statusEl.textContent = 'Отправляем заявку...'; statusEl.className = 'lead-form__status is-pending'; }

    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) })
      .then(function () {
        if (statusEl) { statusEl.textContent = 'Готово! Заявка отправлена.'; statusEl.className = 'lead-form__status is-success'; }
        form.reset();
        setTimeout(function () { close(true); }, 900);
      })
      .catch(function () {
        if (statusEl) { statusEl.textContent = 'Ошибка отправки. Попробуйте ещё раз.'; statusEl.className = 'lead-form__status is-error'; }
      })
      .finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Отправить заявку'; }
      });
  });

  /* ---- consent details ---- */

  var consentDetails = form.querySelector('.lead-consent-details');
  if (consentDetails) {
    consentDetails.addEventListener('toggle', function () {
      if (!modal.hidden && consentDetails.open) {
        consentDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
})();
