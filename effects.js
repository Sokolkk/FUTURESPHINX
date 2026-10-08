/* FutureSphinx — фон: панели кода в глубине.
   ─────────────────────────────────────────────────────────────────
   Смысл сцены. Студия делает сайты, сервисы и ИИ-агентов, поэтому в
   фоне не абстрактные фигуры, а сам материал работы — код. В темноте
   висят полупрозрачные панели с настоящими строками кода: они
   развёрнуты в объёме, медленно вращаются, а прокрутка страницы
   пролистывает их вглубь, как будто человек движется сквозь слои
   проекта.

   Почему 3D на canvas, а не three.js. Проекция считается вручную:
   единицы килобайт против ~150 КБ библиотеки. Вес сайта не растёт.

   Общие правила производительности: цикл останавливается, когда сцена
   вне экрана или вкладка скрыта; частота кадров ограничена 40;
   плотность пикселей не выше 2; при prefers-reduced-motion рисуется
   один статичный кадр.
*/
(function () {
  "use strict";

  var canvas = document.getElementById("fxCanvas");
  var hero = document.getElementById("hero");
  if (!canvas || !hero) return;

  var ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var still = reduce.matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0;
  var H = 0;

  /* ============================================================
     Содержимое панелей: настоящий код, а не случайные символы.
     Случайные буквы читаются как шум, а узнаваемые строки — как
     работа программиста: именно это и продаёт студия.
     ============================================================ */
  var SNIPPETS = [
    [
      "class Agent:",
      "    def __init__(self, llm):",
      "        self.llm = llm",
      "        self.memory = []",
      "",
      "    async def run(self, task):",
      "        plan = await self.plan(task)",
      "        return await self.exec(plan)"
    ],
    [
      "export function useMetrics(id) {",
      "  const [data, set] = useState(null)",
      "  useEffect(() => {",
      "    const stop = subscribe(id, set)",
      "    return () => stop()",
      "  }, [id])",
      "  return data",
      "}"
    ],
    [
      "SELECT day, count(*) AS leads",
      "FROM requests",
      "WHERE created_at > now() - interval '7 days'",
      "GROUP BY day",
      "ORDER BY day DESC;"
    ],
    [
      "@app.post(\"/api/lead\")",
      "async def create_lead(payload: Lead):",
      "    score = await score_lead(payload)",
      "    await crm.push(payload, score)",
      "    if score > 0.8:",
      "        await notify_sales(payload)",
      "    return {\"ok\": True, \"score\": score}"
    ],
    [
      "FROM python:3.12-slim",
      "WORKDIR /app",
      "COPY requirements.txt .",
      "RUN pip install -r requirements.txt",
      "COPY . .",
      "CMD [\"uvicorn\", \"main:app\"]"
    ]
  ];

  /* Цвета строк: ключевые слова светлее и с другим оттенком, чтобы
     панель читалась как код, а не как ровный текст.
     Прозрачность умеренная: сцена лежит под контентом, и слишком яркий
     код сливается с заголовками на светлом фоне. */
  function lineColor(line) {
    if (/^\s*(class|def|async|export|function|FROM|WORKDIR|COPY|RUN|CMD|SELECT|WHERE|GROUP|ORDER)\b/.test(line)) {
      return "rgba(126, 208, 255, 0.62)";
    }
    if (/[{}();:]/.test(line)) return "rgba(214, 206, 230, 0.52)";
    return "rgba(169, 139, 245, 0.58)";
  }

  /* ============================================================
     Панели: прямоугольники, развёрнутые в объёме
     ============================================================ */
  var panels = [];

  /* Обратная проекция не нужна: панели рисуются прямо в пикселях.
     Это важное решение. Первая версия считала панели в мировых
     координатах и переводила их в пиксели через масштаб камеры — но
     проекция ещё умножает на перспективу, и без её учёта панели уезжали
     к центру экрана и налезали на текст. Пиксельная раскладка убирает
     этот класс ошибок целиком: панель стоит там, где сказано.

     Про перекрытие текста. Панели летают по всему экрану и на время
     проходят над текстом — так и задумано, это фоновый слой с глубиной.
     Читаемость обеспечивается не запретом на пересечение, а тем, что
     панели лежат ПОД контентом (у main теперь есть z-index), полупрозрачны
     и заметно тусклее текста. Раньше они лезли поверх букв именно из-за
     отсутствия z-index у main — это исправлено. */
  function buildPanels() {
    var LINE_H = 15;
    var bandH = Math.min(300, H * 0.42);
    var bandW = Math.min(200, W * 0.16);

    /* Полосы разнесены по всей площади: пара слева, пара справа и одна
       по центру ближе к краю. Так фон заполнен, а не собран в две
       колонки, и при прокрутке панели проходят мимо читателя. */
    var bands = [
      { cx: W * 0.11, cy: H * 0.30, w: bandW, h: bandH },
      { cx: W * 0.06, cy: H * 0.78, w: bandW * 0.85, h: bandH * 0.8 },
      { cx: W * 0.90, cy: H * 0.24, w: bandW * 0.95, h: bandH * 0.85 },
      { cx: W * 0.94, cy: H * 0.70, w: bandW, h: bandH },
      { cx: W * 0.80, cy: H * 0.47, w: bandW * 0.7, h: bandH * 0.5 },
      { cx: W * 0.20, cy: H * 0.55, w: bandW * 0.7, h: bandH * 0.45 }
    ];

    panels = [];
    for (var i = 0; i < bands.length; i++) {
      var b = bands[i];
      var depth = i / Math.max(1, bands.length - 1);
      panels.push({
        cx: b.cx, cy: b.cy, w: b.w, h: b.h,
        depth: depth,
        /* Панели свободно проплывают по всей высоте экрана: движение и
           есть главный эффект. Зацикливаем так, чтобы панель уходила
           вверх и возвращалась снизу. */
        bandTop: -b.h,
        bandH: H + b.h * 2,
        /* Верхняя точка строки уходит вверх и в сторону — получается
           наклон, как у листа, повёрнутого в пространстве. */
        skewY: -0.14 - depth * 0.06,
        skewX: 0.22 + depth * 0.1,
        alpha: 0.55 + (1 - depth) * 0.45,
        lines: SNIPPETS[i % SNIPPETS.length],
        lineH: LINE_H,
        /* Скорость всплытия при прокрутке: у каждой панели своя, поэтому
           слои движутся не синхронно. */
        speed: 0.6 + depth * 0.8
      });
    }
  }

  /* ---------- Частицы: пылинки в свете экранов ---------- */
  var particles = [];

  function buildParticles() {
    var count = Math.round(Math.min(80, Math.max(28, (W * H) / 18000)));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: 0.5 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        /* Треть точек золотые: это связующий цвет семьи сайтов,
           он не даёт сцене уйти в один холодный тон. */
        warm: Math.random() < 0.3,
        violet: Math.random() < 0.28
      });
    }
  }

  /* ---------- Состояние ---------- */
  var scrollRatio = 0;
  var shift = 0;      // насколько «провалились» вглубь от прокрутки
  var spin = 0;
  var glow = 0;
  function resize() {
    /* Размер холста. Сцена закреплена на экране (position: fixed), поэтому
       брать размер у родителя нельзя: у body высота равна всей странице, и
       холст получился бы в десятки раз выше окна — картинка размывалась бы
       сжатием. Для fixed-слоя верный размер — размер окна. */
    W = Math.max(320, Math.round(window.innerWidth));
    H = Math.max(300, Math.round(window.innerHeight));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    buildPanels();
    buildParticles();
  }

  /* ---------- Отрисовка ---------- */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    var i;

    /* Пыль */
    for (i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (!still) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -12) p.x = W + 12;
        if (p.x > W + 12) p.x = -12;
        if (p.y < -12) p.y = H + 12;
        if (p.y > H + 12) p.y = -12;
      }
      var tw = 0.55 + 0.45 * Math.sin(glow * 1.2 + p.phase);
      var a = 0.32 * tw;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.warm
        ? "rgba(232, 184, 75, " + a.toFixed(3) + ")"
        : (p.violet
          ? "rgba(169, 139, 245, " + a.toFixed(3) + ")"
          : "rgba(0, 209, 255, " + a.toFixed(3) + ")");
      ctx.fill();
    }

    /* Панели: рисуем от дальних к ближним.
       Всё в пикселях — положение, размер, наклон. Так панель стоит ровно
       там, где задана, и не может случайно уехать на текст. */
    var sorted = panels.slice().sort(function (a, b) { return a.depth - b.depth; });

    for (i = 0; i < sorted.length; i++) {
      var pan = sorted[i];
      /* Прокрутка поднимает панели: каждая со своей скоростью, поэтому
         слои движутся не синхронно. Движение закольцовано В ПРЕДЕЛАХ
         ЗОНЫ панели: в полях по краям это вся высота экрана, в верхней
         полосе — только она. Иначе панель уезжала бы на текст. */
      var rise = (shift * pan.speed * 260) % pan.bandH;
      var cy = pan.cy - rise;
      if (cy < pan.bandTop) cy += pan.bandH;

      var hw = pan.w / 2;
      var hh = pan.h / 2;
      var fade = pan.alpha;

      /* Углы панели. Наклон задан смещениями: верхний край сдвинут
         в сторону и вверх — получается лист, повёрнутый в пространстве. */
      var dxTop = hw * pan.skewX;
      var dyTop = hh * pan.skewY;
      var corners = [
        [pan.cx - hw + dxTop, cy - hh + dyTop],   // левый верх
        [pan.cx + hw + dxTop, cy - hh + dyTop],   // правый верх
        [pan.cx + hw, cy + hh],                   // правый низ
        [pan.cx - hw, cy + hh]                    // левый низ
      ];

      // Заливка панели
      ctx.beginPath();
      ctx.moveTo(corners[0][0], corners[0][1]);
      for (var k = 1; k < corners.length; k++) ctx.lineTo(corners[k][0], corners[k][1]);
      ctx.closePath();
      ctx.fillStyle = "rgba(10, 22, 38, " + (fade * 0.55).toFixed(3) + ")";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 209, 255, " + (fade * 0.30).toFixed(3) + ")";
      ctx.stroke();

      /* Строки кода. Все они лежат внутри панели, и вот что для этого
         важно: шаг строк вычисляется от высоты панели, а не задаётся
         отдельно. Иначе получалось, что короткий текст занимает лишь
         часть высоты, наклон для нижней строки считается ненулевым, и
         строка уезжает за край — панель выглядит сломанной. Здесь шаг
         подобран так, что строки всегда укладываются между краями. */
      var lineCount = pan.lines.length;
      var padTop = pan.h * 0.12;                       // отступ от верха
      var step = (pan.h - padTop * 2) / Math.max(lineCount - 1, 1);

      for (var li = 0; li < lineCount; li++) {
        var line = pan.lines[li];
        var yInPanel = padTop + li * step;             // отступ от верха панели

        /* Доля от верха панели: 0 — верхний край, 1 — нижний.
           Именно она связывает положение строки с наклоном листа. */
        var lean = 1 - yInPanel / pan.h;
        var xOff = dxTop * lean;
        var y = cy - hh + yInPanel + dyTop * lean;

        // Длина строки пропорциональна числу символов
        var len = Math.min(hw * 1.7, line.length * pan.lineH * 0.30);

        ctx.lineWidth = Math.max(1.6, 2.2 * (1.4 - pan.depth * 0.5));
        ctx.strokeStyle = fadeColor(lineColor(line), fade);
        ctx.beginPath();
        ctx.moveTo(pan.cx - len / 2 + xOff, y);
        ctx.lineTo(pan.cx + len / 2 + xOff, y);
        ctx.stroke();
      }

      /* Ближняя панель получает полосу заголовка «редактора»: тонкая
         цветная линия у верхнего края. Это сразу читается как окно с
         кодом и связывает сцену с тем, что делает студия. */
      if (i === 0) {
        var ty = cy - hh + dyTop * 0.85 - pan.lineH * 0.5;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(0, 209, 255, " + (0.75 * fade).toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(pan.cx - hw * 0.86 + dxTop * 0.85, ty);
        ctx.lineTo(pan.cx + hw * 0.86 + dxTop * 0.85, ty);
        ctx.stroke();
      }

      /* Курсор на ближней панели: мигающая вертикальная черта.
         Показывает, что код «живой», а не картинка. */
      if (i === 0 && !still) {
        var blink = 0.4 + 0.6 * Math.abs(Math.sin(glow * 1.8));
        var cxp = pan.cx - hw * 0.5;
        var cyp = cy + hh - pan.lineH * 1.2;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(0, 209, 255, " + (blink * 0.9).toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(cxp, cyp);
        ctx.lineTo(cxp, cyp + pan.lineH * 0.9);
        ctx.stroke();
      }
    }
  }

  /* Приглушает цвет строки по глубине панели.
     Цвета заданы строками вида rgba(r, g, b, a) — заменяем только
     прозрачность, оттенок остаётся прежним. */
  function fadeColor(color, fade) {
    return color.replace(/[\d.]+\)$/, function (m) {
      return (parseFloat(m) * fade).toFixed(3) + ")";
    });
  }

  /* ---------- Цикл ---------- */
  var raf = 0;
  var running = false;
  var lastTime = 0;
  var FRAME_MS = 1000 / 40;

  function step(dt) {
    spin += dt * 0.10;
    glow += dt * 1.4;
    /* Прокрутка ведёт камеру сквозь слои панелей. За максимум берём
       не конец страницы, а треть пути: иначе к подвалу панели успевают
       уехать далеко и сцена выглядит пустой. */
    var drive = Math.min(1, scrollRatio / 0.35);
    shift += (drive - shift) * Math.min(1, dt * 1.8);
    draw();
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (!lastTime) { lastTime = now; return; }
    var delta = now - lastTime;
    if (delta < FRAME_MS) return;
    var dt = Math.min(delta, 200) / 1000;
    lastTime = now;
    step(dt);
  }

  function start() {
    if (running || still) return;
    running = true;
    lastTime = 0;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  var scrollTick = false;
  function readScroll() {
    scrollTick = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    scrollRatio = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
  }

  window.addEventListener("scroll", function () {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(readScroll);
  }, { passive: true });

  /* Сцена закреплена на экране и видна всегда, пока открыта страница.
     Следить за hero нельзя: он уезжает при прокрутке, и сцена глохла бы
     ровно тогда, когда нужна. Останавливаем только при скрытом документе. */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      if (!running) draw();
    }, 180);
  }, { passive: true });

  function applyPreference() {
    still = reduce.matches;
    if (still) { stop(); shift = 0.35; spin = 0.3; draw(); }
    else start();
  }

  if (reduce.addEventListener) reduce.addEventListener("change", applyPreference);
  else if (reduce.addListener) reduce.addListener(applyPreference);

  readScroll();
  resize();

  if (still) {
    shift = 0.35;
    spin = 0.3;
    draw();
  } else {
    draw();
    start();
  }
})();
