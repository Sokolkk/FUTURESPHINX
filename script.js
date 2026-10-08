/* FutureSphinx — базовый скрипт страницы.
   Меню-диалог, кнопка «наверх», появление блоков при прокрутке, год.
   Всё написано без библиотек и без стрелочных функций: страница должна
   работать и в старых браузерах, и при отключённом JavaScript — просто
   без удобств.
*/
(function () {
  "use strict";

  /* ============================================================
     1. Меню-диалог
     Используем нативный <dialog>: он попадает в top layer, поэтому
     никакие z-index и «просвечивающие» подложки его не перекроют.
     Ровно та же схема, что на двух других сайтах семьи.
     ============================================================ */
  var menu = document.getElementById("siteMenu");
  var openBtn = document.querySelector("[data-menu-open]") || document.querySelector(".nav__toggle");
  var closeBtns = document.querySelectorAll("[data-menu-close]");

  function openMenu() {
    if (!menu || menu.open) return;
    if (typeof menu.showModal === "function") menu.showModal();
    else menu.setAttribute("open", "");
    document.documentElement.classList.add("menu-open");
  }

  function closeMenu() {
    if (!menu || !menu.open) return;
    if (typeof menu.close === "function") menu.close();
    else menu.removeAttribute("open");
    document.documentElement.classList.remove("menu-open");
  }

  if (openBtn) openBtn.addEventListener("click", openMenu);
  closeBtns.forEach(function (btn) { btn.addEventListener("click", closeMenu); });

  if (menu) {
    // Клик по пункту меню закрывает его и ведёт к разделу
    menu.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function () { closeMenu(); });
    });

    // Escape у <dialog> закрывает сам, но класс на html надо снять вручную
    menu.addEventListener("close", function () {
      document.documentElement.classList.remove("menu-open");
    });
    menu.addEventListener("cancel", function () {
      document.documentElement.classList.remove("menu-open");
    });
    // Клик мимо панели закрывает меню
    menu.addEventListener("click", function (e) {
      if (e.target === menu) closeMenu();
    });
  }

  /* ============================================================
     2. Кнопка «наверх»
     ============================================================ */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    toTop.addEventListener("click", function () {
      var smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
    });

    var topTick = false;
    function updateTop() {
      topTick = false;
      toTop.classList.toggle("is-visible", window.pageYOffset > 600);
    }
    window.addEventListener("scroll", function () {
      if (topTick) return;
      topTick = true;
      requestAnimationFrame(updateTop);
    }, { passive: true });
    updateTop();
  }

  /* ============================================================
     3. Появление блоков при прокрутке
     ============================================================ */
  var revealItems = document.querySelectorAll(".reveal");

  if (revealItems.length) {
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      revealItems.forEach(function (el) { observer.observe(el); });

      /* Страховка: карточки и блоки не должны остаться невидимыми, если
         наблюдатель не сработал (быстрая прокрутка, переход по якорю,
         нестандартный браузер). Проверяем регулярно, а не один раз, и
         останавливаемся, когда раскрывать больше нечего. */
      var rescue = setInterval(function () {
        var pending = document.querySelectorAll(".reveal:not(.is-visible)");
        if (!pending.length) { clearInterval(rescue); return; }
        pending.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-visible");
        });
      }, 1200);
    }
  }

  /* ============================================================
     4. Год в подвале
     ============================================================ */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
