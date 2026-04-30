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

const leadFormModal = document.getElementById("leadFormModal");
const leadFormFrame = document.getElementById("leadFormFrame");
const openFormButtons = document.querySelectorAll(".js-open-form");
const closeFormTriggers = document.querySelectorAll("[data-close-form]");
const LEAD_FORM_URL =
  "https://docs.google.com/forms/d/1P0dNcvU47DQthmNrHhw9G24BvqxxIcordiSaCe7hW4g/viewform?embedded=true";

function openLeadFormModal() {
  if (!leadFormModal) return;
  if (leadFormFrame && !leadFormFrame.getAttribute("src")) {
    leadFormFrame.setAttribute("src", LEAD_FORM_URL);
  }
  leadFormModal.hidden = false;
  leadFormModal.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("modal-open");
}

function closeLeadFormModal() {
  if (!leadFormModal) return;
  leadFormModal.hidden = true;
  leadFormModal.setAttribute("aria-hidden", "true");
  document.documentElement.classList.remove("modal-open");
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
