const revealItems = document.querySelectorAll(".reveal");
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyUs1-RhSnAnVu3MHnGt1LZ-CLM1V-k5OVudEaPMGj7uZDX2-lmnnBKiEK7C6rh_Eripg/exec";

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

const leadFormModal = document.getElementById("leadFormModal");
const leadCaptureForm = document.getElementById("leadCaptureForm");
const leadFormStatus = document.getElementById("leadFormStatus");
const leadSubmitBtn = document.getElementById("leadSubmitBtn");
const leadContactInput = document.getElementById("leadContactInput");
const leadMessageInput = document.getElementById("leadMessageInput");
const leadConsentInput = document.getElementById("leadConsentInput");
const openFormButtons = document.querySelectorAll(".js-open-form");
const closeFormTriggers = document.querySelectorAll("[data-close-form]");

function openLeadFormModal() {
  if (!leadFormModal) return;
  leadFormModal.classList.remove("is-closing");
  leadFormModal.hidden = false;
  leadFormModal.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("modal-open");
  requestAnimationFrame(() => {
    leadFormModal.classList.add("is-visible");
  });
}

function closeLeadFormModal() {
  if (!leadFormModal) return;
  leadFormModal.classList.remove("is-visible");
  leadFormModal.classList.add("is-closing");

  const finalizeClose = () => {
    leadFormModal.hidden = true;
    leadFormModal.setAttribute("aria-hidden", "true");
    leadFormModal.classList.remove("is-closing");
    document.documentElement.classList.remove("modal-open");
    if (leadFormStatus) {
      leadFormStatus.textContent = "";
      leadFormStatus.className = "lead-form__status";
    }
    if (leadCaptureForm) {
      leadCaptureForm.querySelectorAll(".is-invalid").forEach((node) => {
        node.classList.remove("is-invalid");
      });
      leadCaptureForm.querySelectorAll(".lead-field__error").forEach((node) => {
        node.textContent = "";
      });
    }
  };

  setTimeout(finalizeClose, 320);
}

openFormButtons.forEach((btn) => {
  btn.addEventListener("click", openLeadFormModal);
});

closeFormTriggers.forEach((node) => {
  node.addEventListener("click", closeLeadFormModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && leadFormModal && !leadFormModal.hidden) {
    closeLeadFormModal();
  }
});

async function handleSubmit(formData) {
  await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(formData)
  });
}

if (leadCaptureForm) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const telegramRegex = /^(?:@[\w]{5,32}|https?:\/\/(?:t\.me|telegram\.me)\/[\w]{5,32})$/i;
  const phoneRegex = /^(?:\+?\d[\d\s\-()]{8,}\d)$/;

  function isValidContact(value) {
    const clean = String(value || "").trim();
    return emailRegex.test(clean) || telegramRegex.test(clean) || phoneRegex.test(clean);
  }

  function validateContact() {
    if (!leadContactInput) return true;
    const value = leadContactInput.value.trim();
    if (!value) {
      leadContactInput.setCustomValidity("Укажите email, Telegram или телефон.");
      return false;
    }
    if (!isValidContact(value)) {
      leadContactInput.setCustomValidity("Введите корректный email, Telegram (@username или t.me/...) либо телефон.");
      return false;
    }
    leadContactInput.setCustomValidity("");
    return true;
  }

  function validateMessage() {
    if (!leadMessageInput) return true;
    const text = leadMessageInput.value.trim();
    if (text.length < 50) {
      leadMessageInput.setCustomValidity("Описание задачи должно быть не короче 50 символов.");
      return false;
    }
    leadMessageInput.setCustomValidity("");
    return true;
  }

  if (leadContactInput) {
    leadContactInput.addEventListener("input", validateContact);
  }

  if (leadMessageInput) {
    leadMessageInput.addEventListener("input", validateMessage);
  }

  leadCaptureForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const contactOk = validateContact();
    const messageOk = validateMessage();
    if (!contactOk || !messageOk || !leadCaptureForm.reportValidity()) return;

    const form = new FormData(leadCaptureForm);
    const payload = Object.fromEntries(form.entries());
    payload.task_type = payload.taskType || "";
    payload["Тип задачи"] = payload.taskType || "";
    payload["Контакт"] = payload.contact || "";
    payload["Описание"] = payload.message || "";
    payload.source = "FutureSphinx Landing";
    payload.timestamp = new Date().toISOString();

    if (leadSubmitBtn) {
      leadSubmitBtn.disabled = true;
      leadSubmitBtn.classList.add("is-loading");
      leadSubmitBtn.textContent = "Отправляем...";
    }

    if (leadFormStatus) {
      leadFormStatus.textContent = "Отправляем заявку...";
      leadFormStatus.className = "lead-form__status is-pending";
    }

    try {
      await handleSubmit(payload);
      if (leadFormStatus) {
        leadFormStatus.textContent = "Готово! Заявка отправлена.";
        leadFormStatus.className = "lead-form__status is-success";
      }
      alert("Заявка улетела в FutureSphinx!");
      leadCaptureForm.reset();
      setTimeout(() => {
        closeLeadFormModal();
      }, 800);
    } catch (error) {
      if (leadFormStatus) {
        leadFormStatus.textContent = "Не удалось отправить. Попробуйте еще раз.";
        leadFormStatus.className = "lead-form__status is-error";
      }
    } finally {
      if (leadSubmitBtn) {
        leadSubmitBtn.disabled = false;
        leadSubmitBtn.classList.remove("is-loading");
        leadSubmitBtn.textContent = "Отправить заявку";
      }
    }
  });
}

if (leadCaptureForm) {
  const leadNameInput = leadCaptureForm.querySelector('input[name="name"]');
  const leadTaskTypeInput = leadCaptureForm.querySelector('select[name="taskType"]');
  const trackedValidationFields = [
    leadNameInput,
    leadContactInput,
    leadTaskTypeInput,
    leadMessageInput,
    leadConsentInput
  ].filter(Boolean);

  function ensureInlineErrorNode(field) {
    const wrapper = field.closest(".lead-field, .lead-consent");
    if (!wrapper) return null;
    let node = wrapper.querySelector(".lead-field__error");
    if (!node) {
      node = document.createElement("p");
      node.className = "lead-field__error";
      node.setAttribute("aria-live", "polite");
      wrapper.appendChild(node);
    }
    return node;
  }

  function setInlineError(field, message) {
    const wrapper = field.closest(".lead-field, .lead-consent");
    const node = ensureInlineErrorNode(field);
    const invalid = Boolean(message);
    field.classList.toggle("is-invalid", invalid);
    field.setAttribute("aria-invalid", invalid ? "true" : "false");
    if (wrapper) wrapper.classList.toggle("is-invalid", invalid);
    if (node) node.textContent = message || "";
  }

  function validateFieldWithHint(field) {
    if (!field) return true;
    let message = "";

    if (field === leadNameInput) {
      const value = field.value.trim();
      if (!value) message = "Укажите имя.";
      else if (value.length < 2) message = "Имя должно быть не короче 2 символов.";
    } else if (field === leadTaskTypeInput) {
      if (!field.value.trim()) message = "Выберите тип задачи.";
    } else if (field === leadConsentInput) {
      if (!field.checked) message = "Подтвердите согласие на обработку персональных данных.";
    } else if (field === leadContactInput || field === leadMessageInput) {
      if (!field.checkValidity()) message = field.validationMessage || "Проверьте поле.";
    } else if (!field.checkValidity()) {
      message = field.validationMessage || "Проверьте поле.";
    }

    setInlineError(field, message);
    return !message;
  }

  function clearInlineErrors() {
    trackedValidationFields.forEach((field) => setInlineError(field, ""));
  }

  const submitValidationHandler = (event) => {
    let firstInvalidField = null;
    trackedValidationFields.forEach((field) => {
      const ok = validateFieldWithHint(field);
      if (!ok && !firstInvalidField) firstInvalidField = field;
    });

    if (firstInvalidField) {
      event.preventDefault();
      event.stopImmediatePropagation();
      firstInvalidField.focus({ preventScroll: false });
      if (leadFormStatus) {
        leadFormStatus.textContent = "Проверьте поля формы: есть ошибки.";
        leadFormStatus.className = "lead-form__status is-error";
      }
      return;
    }
  };

  leadCaptureForm.addEventListener("submit", submitValidationHandler, true);

  trackedValidationFields.forEach((field) => {
    const ev = field === leadTaskTypeInput || field === leadConsentInput ? "change" : "input";
    field.addEventListener(ev, () => validateFieldWithHint(field));
  });

  if (leadFormModal) {
    leadFormModal.addEventListener("transitionend", () => {
      if (leadFormModal.hidden) clearInlineErrors();
    });
  }
}

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
