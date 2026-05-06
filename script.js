const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.14,
    rootMargin: "0px 0px -30px 0px"
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

(function() {
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
    payload.source = 'FutureSphinx Landing';
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

  /* ---- consent details scroll ---- */

  var consentDetails = form.querySelector('.lead-consent-details');
  if (consentDetails) {
    consentDetails.addEventListener('toggle', function () {
      if (!modal.hidden && consentDetails.open) {
        consentDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
})();

const scrollLinks = document.querySelectorAll("a.js-scroll[href^='#']");
scrollLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    const offset = window.innerWidth >= 768 ? 78 : 64;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    history.replaceState(null, "", href);
  });
});

const serviceCards = Array.from(document.querySelectorAll(".service-card--interactive"));
const tapModeQuery = window.matchMedia("(hover: none), (pointer: coarse)");

function isTapMode() {
  return tapModeQuery.matches || window.innerWidth < 900;
}

function closeServiceCards(exceptCard = null) {
  serviceCards.forEach((card) => {
    if (exceptCard && card === exceptCard) return;
    card.classList.remove("is-open");
    card.setAttribute("aria-expanded", "false");
  });
}

serviceCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    if (!isTapMode()) return;
    event.preventDefault();
    const willOpen = !card.classList.contains("is-open");
    closeServiceCards(card);
    card.classList.toggle("is-open", willOpen);
    card.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      card.click();
    }
  });
});

document.addEventListener("click", (event) => {
  if (!isTapMode()) return;
  if (!event.target.closest(".service-card--interactive")) {
    closeServiceCards();
  }
});

window.addEventListener("resize", () => {
  if (!isTapMode()) {
    closeServiceCards();
  }
});

const canvas = document.getElementById("fxCanvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  const host = canvas.parentElement;
  const particles = Array.from({ length: 34 }, () => ({
    x: Math.random(),
    y: Math.random(),
    speed: 0.2 + Math.random() * 0.6,
    size: 0.8 + Math.random() * 2.2
  }));

  function resize() {
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const w = host.clientWidth;
    const h = host.clientHeight;
    canvas.width = Math.floor(w * ratio);
    canvas.height = Math.floor(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawArcPath(t, width, height, offset, amp, color, alpha, line) {
    ctx.beginPath();
    for (let x = 0; x <= width; x += 8) {
      const y =
        height * (0.35 + offset) +
        Math.sin(x * 0.012 + t * 0.0026 + offset * 22) * amp +
        Math.cos(x * 0.006 + t * 0.0019) * amp * 0.45;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color.replace("ALPHA", String(alpha));
    ctx.lineWidth = line;
    ctx.shadowColor = color.replace("ALPHA", String(alpha * 1.4));
    ctx.shadowBlur = 15;
    ctx.stroke();
  }

  function render(now) {
    const w = host.clientWidth;
    const h = host.clientHeight;
    ctx.clearRect(0, 0, w, h);

    drawArcPath(now, w, h, 0.04, 20, "rgba(0,209,255,ALPHA)", 0.5, 2.4);
    drawArcPath(now, w, h, 0.1, 14, "rgba(124,88,255,ALPHA)", 0.42, 2);
    drawArcPath(now, w, h, 0.15, 26, "rgba(255,86,165,ALPHA)", 0.3, 1.6);

    particles.forEach((p, i) => {
      p.x += (0.00018 + i * 0.000002) * p.speed;
      p.y += Math.sin(now * 0.0003 + i) * 0.00025;
      if (p.x > 1.1) p.x = -0.1;
      if (p.y > 1.1) p.y = -0.1;
      if (p.y < -0.1) p.y = 1.1;

      const px = p.x * w;
      const py = p.y * h;
      ctx.beginPath();
      ctx.fillStyle = "rgba(130,229,255,0.55)";
      ctx.shadowColor = "rgba(0,209,255,0.9)";
      ctx.shadowBlur = 10;
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(render);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(render);
}

const offerPills = Array.from(document.querySelectorAll(".offer-pill"));
const offerText = document.getElementById("offerText");

const offerMap = {
  startup:
    "Фокус на молниеносном MVP: собираем ключевую функциональность, запускаем тест на рынке и докручиваем продукт по метрикам.",
  ecom:
    "Фокус на росте продаж: ускоряем обработку заказов, внедряем персонализацию и автоматизируем маркетинговые сценарии с понятным ROI.",
  b2b:
    "Фокус на воронке и операционной эффективности: объединяем CRM, автоматизируем лидогенерацию и повышаем скорость работы команды."
};

function updateOffer(nextOffer) {
  if (!offerText || !offerMap[nextOffer]) return;
  offerText.textContent = offerMap[nextOffer];
  offerPills.forEach((pill) => {
    const isActive = pill.dataset.offer === nextOffer;
    pill.classList.toggle("is-active", isActive);
    pill.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

offerPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    updateOffer(pill.dataset.offer);
  });
});

if (offerPills.length) {
  updateOffer("startup");
}

const roiRevenueInput = document.getElementById("roiRevenue");
const roiLeadsInput = document.getElementById("roiLeads");
const roiCostsInput = document.getElementById("roiCosts");
const roiSavings = document.getElementById("roiSavings");
const roiExtraLeads = document.getElementById("roiExtraLeads");
const roiExtraRevenue = document.getElementById("roiExtraRevenue");

function formatCurrency(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(Math.max(0, value));
}

function calculateRoi() {
  if (
    !roiRevenueInput ||
    !roiLeadsInput ||
    !roiCostsInput ||
    !roiSavings ||
    !roiExtraLeads ||
    !roiExtraRevenue
  ) {
    return;
  }

  const revenue = Number(roiRevenueInput.value) || 0;
  const leads = Math.max(1, Number(roiLeadsInput.value) || 0);
  const costs = Number(roiCostsInput.value) || 0;

  const savings = costs * 0.37;
  const extraLeads = Math.round(leads * 0.28);
  const leadValue = revenue / leads;
  const extraRevenue = extraLeads * leadValue * 0.72;

  roiSavings.textContent = formatCurrency(savings);
  roiExtraLeads.textContent = new Intl.NumberFormat("ru-RU").format(extraLeads);
  roiExtraRevenue.textContent = formatCurrency(extraRevenue);
}

[roiRevenueInput, roiLeadsInput, roiCostsInput].forEach((input) => {
  if (!input) return;
  input.addEventListener("input", calculateRoi);
});

calculateRoi();

const faqItems = Array.from(document.querySelectorAll(".faq-item"));
faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    faqItems.forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const growthSection = document.getElementById("growth");
const metricNodes = Array.from(document.querySelectorAll(".metric-value"));

function animateMetricValue(node, target, { prefix = "", suffix = "", sign = "" } = {}) {
  if (!node) return;
  if (reducedMotion) {
    const finalSign = sign ? sign : target < 0 ? "-" : "";
    node.textContent = `${finalSign}${prefix}${Math.abs(Math.round(target))}${suffix}`;
    return;
  }

  const start = performance.now();
  const duration = 1300;
  const from = 0;
  const to = Math.abs(target);
  const fixedSign = sign ? sign : target < 0 ? "-" : "";

  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = Math.round(from + (to - from) * eased);
    node.textContent = `${fixedSign}${prefix}${val}${suffix}`;
    if (p < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

if (growthSection && metricNodes.length >= 3) {
  const metricObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateMetricValue(metricNodes[0], -37, { suffix: "%" });
        animateMetricValue(metricNodes[1], 2, { prefix: "x" });
        animateMetricValue(metricNodes[2], 28, { sign: "+", suffix: "%" });
        observer.disconnect();
      });
    },
    { threshold: 0.35 }
  );
  metricObserver.observe(growthSection);
}

const premiumCards = Array.from(
  document.querySelectorAll(
    ".metric-card, .offer-card, .roi-card, .proof-card, .ba-card, .process-grid li, .trust-points span"
  )
);

if (!reducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  premiumCards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * 5.2;
      const ry = (px - 0.5) * 6.4;
      card.style.transform = `perspective(720px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

const roiResult = document.querySelector(".roi-result");
if (roiResult) {
  let roiFlashTimer = null;
  [roiRevenueInput, roiLeadsInput, roiCostsInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      roiResult.classList.add("is-flash");
      clearTimeout(roiFlashTimer);
      roiFlashTimer = setTimeout(() => {
        roiResult.classList.remove("is-flash");
      }, 260);
    });
  });
}