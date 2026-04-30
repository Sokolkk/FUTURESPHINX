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
