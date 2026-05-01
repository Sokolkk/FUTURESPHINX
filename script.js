/* Оптимизированный скрипт для стабильной работы на мобильных устройствах */
document.addEventListener("DOMContentLoaded", () => {
  const revealItems = document.querySelectorAll(".reveal");
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyUs1-RhSnAnVu3MHnGt1LZ-CLM1V-k5OVudEaPMGj7uZDX2-lmnnBKiEK7C6rh_Eripg/exec";

  // Intersection Observer для плавного появления
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.1, // Уменьшен порог для гарантированного срабатывания на мобильных
      rootMargin: "0px 0px -50px 0px"
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  // Логика модального окна
  const leadFormModal = document.getElementById("leadFormModal");
  const leadCaptureForm = document.getElementById("leadCaptureForm");
  const openFormButtons = document.querySelectorAll(".js-open-form");
  const closeFormTriggers = document.querySelectorAll("[data-close-form]");

  function openLeadFormModal() {
    if (!leadFormModal) return;
    leadFormModal.hidden = false;
    document.documentElement.classList.add("modal-open");
    setTimeout(() => leadFormModal.classList.add("is-visible"), 10);
  }

  function closeLeadFormModal() {
    if (!leadFormModal) return;
    leadFormModal.classList.remove("is-visible");
    setTimeout(() => {
      leadFormModal.hidden = true;
      document.documentElement.classList.remove("modal-open");
    }, 300);
  }

  openFormButtons.forEach(btn => btn.addEventListener("click", openLeadFormModal));
  closeFormTriggers.forEach(node => node.addEventListener("click", closeLeadFormModal));

  // Плавный скролл
  const scrollLinks = document.querySelectorAll("a.js-scroll[href^='#']");
  scrollLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      const offset = window.innerWidth >= 768 ? 78 : 64;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  // Canvas FX - ОПТИМИЗИРОВАНО
  const canvas = document.getElementById("fxCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.2 + Math.random() * 0.5,
      size: 0.8 + Math.random() * 1.5
    }));

    function resize() {
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      const w = canvas.parentElement.clientWidth;
      // ИСПРАВЛЕНО: Теперь высота берется от окна (viewport), а не от бесконечного контейнера
      const h = window.innerHeight; 
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function render(now) {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p, i) => {
        p.x += 0.0001 * p.speed;
        if (p.x > 1.1) p.x = -0.1;
        
        const px = p.x * w;
        const py = p.y * h;
        ctx.beginPath();
        ctx.fillStyle = "rgba(0,209,255,0.4)";
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(render);
    }

    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(render);
  }

  // FAQ
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
});
