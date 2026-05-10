/* =================================================================
   DevinOS — interactive logic
   ================================================================= */

(() => {
  "use strict";

  /* ---------------------- Apps registry ---------------------- */

  const APPS = [
    { id: "messages", name: "Сообщения", g1: "#34c0ff", g2: "#1c6df0", icon: iconChat() },
    { id: "phone",    name: "Телефон",   g1: "#3ddc84", g2: "#0aa869", icon: iconPhone() },
    { id: "mail",     name: "Почта",     g1: "#5d8dff", g2: "#2148e6", icon: iconMail() },
    { id: "browser",  name: "Браузер",   g1: "#ff7e4d", g2: "#ff2d6e", icon: iconGlobe() },
    { id: "music",    name: "Музыка",    g1: "#ff5cae", g2: "#7a5cff", icon: iconMusic() },
    { id: "photos",   name: "Галерея",   g1: "#ffd86b", g2: "#ff6e3c", icon: iconImage() },
    { id: "camera",   name: "Камера",    g1: "#5a5a66", g2: "#1a1a22", icon: iconCamera() },
    { id: "weather",  name: "Погода",    g1: "#56c6ff", g2: "#2c7bff", icon: iconWeather() },
    { id: "calendar", name: "Календарь", g1: "#ffffff", g2: "#dadbe1", icon: iconCalendar() },
    { id: "notes",    name: "Заметки",   g1: "#ffe8a8", g2: "#ffb84d", icon: iconNotes() },
    { id: "clock",    name: "Часы",      g1: "#1a1a22", g2: "#3a3a4a", icon: iconClockApp() },
    { id: "calc",     name: "Калькулятор", g1: "#ff9f3d", g2: "#ff5e3a", icon: iconCalc() },
    { id: "maps",     name: "Карты",     g1: "#7be0a3", g2: "#27a35d", icon: iconMap() },
    { id: "files",    name: "Файлы",     g1: "#67c0ff", g2: "#3a7bff", icon: iconFolder() },
    { id: "wallet",   name: "Кошелёк",   g1: "#222226", g2: "#3a3a44", icon: iconCard() },
    { id: "store",    name: "Маркет",    g1: "#3ec5ff", g2: "#5e5cff", icon: iconBag() },
    { id: "settings", name: "Настройки", g1: "#a9b3c2", g2: "#525864", icon: iconGear() },
    { id: "appgallery", name: "Темы",    g1: "#c084ff", g2: "#7a3dff", icon: iconSparkle() },
  ];

  const APP_BY_ID = Object.fromEntries(APPS.map((a) => [a.id, a]));

  const NOTIFICATIONS = [
    { id: 1, app: "messages", title: "Лена", body: "Бери зонт, обещают дождь к вечеру.", time: "сейчас" },
    { id: 2, app: "mail",     title: "Анна Петрова", body: "Re: договор — посмотрите раздел 4, отметила правки.", time: "9:38" },
    { id: 3, app: "calendar", title: "Через 30 минут", body: "Standup команды · Zoom · 10:00 – 10:15", time: "9:30" },
    { id: 4, app: "music",    title: "Свет в окне", body: "Ночной экспресс · скачано офлайн", time: "9:20" },
    { id: 5, app: "store",    title: "Готово к обновлению", body: "12 приложений ждут обновления через Wi‑Fi.", time: "вчера" },
  ];

  /* ---------------------- DOM helpers ---------------------- */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const el = (tag, props = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") node.className = v;
      else if (k === "style") {
        // Support CSS custom properties (e.g. "--g1") via setProperty.
        for (const [sk, sv] of Object.entries(v)) {
          if (sk.startsWith("--")) node.style.setProperty(sk, sv);
          else node.style[sk] = sv;
        }
      }
      else if (k === "html") node.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (v === true) node.setAttribute(k, "");
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (c == null) continue;
      node.append(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  };

  /* ---------------------- State ---------------------- */

  const state = {
    locked: true,
    panelOpen: null,            // 'cc' | 'notif' | null
    appOpen: null,              // app id | null
    recentsOpen: false,
    musicPlaying: true,
    history: [],
    recents: ["browser", "messages", "photos"],
  };

  /* ---------------------- Boot ---------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    renderHomeGrid();
    renderNotifications();
    renderRecents();
    bindGestures();
    bindUiEvents();
    startClock();
    setActiveScreen("lock");
  });

  /* ---------------------- Home grid ---------------------- */

  function renderHomeGrid() {
    const grid = $("#homeGrid");
    grid.innerHTML = "";
    for (const a of APPS) {
      grid.append(makeAppIcon(a, true));
    }
  }

  function makeAppIcon(a, withLabel) {
    const tile = el("span", {
      class: "ai-tile",
      style: { "--g1": a.g1, "--g2": a.g2 },
    });
    tile.innerHTML = a.icon;
    const btn = el("button", { class: "app-icon", "data-app": a.id, "aria-label": a.name },
      withLabel ? [tile, el("span", { class: "ai-label" }, a.name)] : [tile]
    );
    btn.addEventListener("click", () => openApp(a.id));
    return btn;
  }

  /* ---------------------- Notifications ---------------------- */

  function renderNotifications() {
    const list = $("#npList");
    list.innerHTML = "";
    NOTIFICATIONS.forEach((n) => {
      const a = APP_BY_ID[n.app];
      const item = el("div", { class: "np-item" }, [
        el("span", {
          class: "np-icon",
          style: { "--g1": a?.g1 || "#888", "--g2": a?.g2 || "#444" },
          html: a?.icon || "",
        }),
        el("div", { class: "np-text" }, [
          el("div", { class: "np-app" }, a?.name || n.app),
          el("div", { class: "np-title" }, n.title),
          el("div", { class: "np-body" }, n.body),
        ]),
        el("div", { class: "np-time" }, n.time),
      ]);
      list.append(item);
    });
  }

  /* ---------------------- Recents ---------------------- */

  function renderRecents() {
    const list = $("#recentsList");
    list.innerHTML = "";
    if (!state.recents.length) {
      list.append(el("div", { class: "recents-empty", style: { color: "var(--fg-mute)", textAlign: "center", width: "100%", padding: "40px 0" } }, "Нет недавних приложений"));
      return;
    }
    state.recents.forEach((id) => {
      const a = APP_BY_ID[id];
      if (!a) return;
      const card = el("div", { class: "recent-card" }, [
        el("div", { class: "recent-header" }, [
          el("span", {
            class: "ai-tile",
            style: { "--g1": a.g1, "--g2": a.g2, width: "26px", height: "26px", borderRadius: "8px" },
            html: a.icon,
          }),
          el("span", {}, a.name),
        ]),
        el("div", {
          class: "recent-preview",
          style: { "--g1": a.g1, "--g2": a.g2 },
        }),
      ]);
      card.addEventListener("click", () => {
        closeRecents();
        openApp(id);
      });
      list.append(card);
    });
  }

  /* ---------------------- Screens ---------------------- */

  function setActiveScreen(name) {
    $$(".screen").forEach((s) => s.setAttribute("data-active", "false"));
    if (name === "lock") $("#screenLock").setAttribute("data-active", "true");
    if (name === "home") $("#screenHome").setAttribute("data-active", "true");
    if (name === "recents") $("#screenRecents").setAttribute("data-active", "true");
  }

  function unlock() {
    state.locked = false;
    setActiveScreen("home");
  }
  function lock() {
    closePanels();
    closeApp(true);
    closeRecents();
    state.locked = true;
    setActiveScreen("lock");
  }

  /* ---------------------- Panels ---------------------- */

  function openPanel(name) {
    if (state.appOpen) return; // panels not over apps in this UX
    closePanels();
    state.panelOpen = name;
    if (name === "cc")    $("#controlCenter").setAttribute("data-open", "true");
    if (name === "notif") $("#notificationPanel").setAttribute("data-open", "true");
  }
  function closePanels() {
    state.panelOpen = null;
    $("#controlCenter").setAttribute("data-open", "false");
    $("#notificationPanel").setAttribute("data-open", "false");
  }

  /* ---------------------- Recents ---------------------- */

  function openRecents() {
    if (state.locked) return;
    closePanels();
    closeApp(true);
    state.recentsOpen = true;
    renderRecents();
    setActiveScreen("recents");
  }
  function closeRecents() {
    if (!state.recentsOpen) return;
    state.recentsOpen = false;
    setActiveScreen("home");
  }

  /* ---------------------- Apps ---------------------- */

  function openApp(id) {
    if (state.locked) {
      // Some apps are accessible from lock screen (camera, flashlight)
      if (id !== "camera") return;
    }
    const app = APP_BY_ID[id];
    if (!app) return;

    state.appOpen = id;
    closePanels();
    closeRecents();

    // Rotate recents (most recent first, no dupes, max 6)
    state.recents = [id, ...state.recents.filter((x) => x !== id)].slice(0, 6);

    $("#appTitle").textContent = app.name;
    const body = $("#appBody");
    body.innerHTML = "";
    body.append(renderAppBody(id));

    $("#appHost").setAttribute("data-open", "true");
  }

  function closeApp(silent) {
    if (!state.appOpen && !silent) return;
    state.appOpen = null;
    $("#appHost").setAttribute("data-open", "false");
  }

  /* ---------------------- App content renderers ---------------------- */

  function renderAppBody(id) {
    switch (id) {
      case "settings":  return renderSettingsApp();
      case "calc":      return renderCalcApp();
      case "weather":   return renderWeatherApp();
      case "notes":     return renderNotesApp();
      case "photos":    return renderPhotosApp();
      case "calendar":  return renderCalendarApp();
      case "clock":     return renderClockApp();
      case "music":     return renderMusicApp();
      case "messages":  return renderMessagesApp();
      case "phone":     return renderPhoneApp();
      case "mail":      return renderMailApp();
      case "browser":   return renderBrowserApp();
      case "camera":    return renderCameraApp();
      case "maps":      return renderMapsApp();
      case "files":     return renderFilesApp();
      case "wallet":    return renderWalletApp();
      case "store":     return renderStoreApp();
      case "appgallery":return renderThemesApp();
      default:          return el("div", { style: { padding: "40px 0", textAlign: "center", color: "var(--fg-mute)" } }, "Приложение в разработке");
    }
  }

  /* ----- Settings ----- */

  function renderSettingsApp() {
    const root = el("div");

    root.append(
      el("div", { class: "section-title" }, "Тема"),
      buildThemeGrid(),

      el("div", { class: "section-title" }, "Обои"),
      buildWallpaperPicker(),

      el("div", { class: "section-title" }, "Подключения"),
      buildToggleList([
        { id: "wifi",     name: "Wi‑Fi", sub: "Home‑5G", on: true,  icon: iconWifi() },
        { id: "bt",       name: "Bluetooth", sub: "Выкл", on: false, icon: iconBt() },
        { id: "cell",     name: "Мобильные данные", sub: "5G+",  on: true,  icon: iconCell() },
        { id: "airplane", name: "Режим полёта", sub: "Выкл", on: false, icon: iconPlane() },
        { id: "hotspot",  name: "Точка доступа", sub: "Выкл", on: false, icon: iconHotspot() },
      ]),

      el("div", { class: "section-title" }, "Уведомления"),
      buildToggleList([
        { id: "noti_sound",  name: "Звук", on: true,  icon: iconBell() },
        { id: "noti_lock",   name: "На экране блокировки", on: true,  icon: iconLock() },
        { id: "noti_dnd",    name: "Не беспокоить", sub: "С 23:00 до 7:00", on: false, icon: iconMoon() },
      ]),

      el("div", { class: "section-title" }, "О устройстве"),
      el("div", { class: "list-card" }, [
        listRow("Модель", "DevinOS Phone X1", iconInfo()),
        listRow("Версия системы", "DevinOS 1.0", iconChip()),
        listRow("Память", "256 ГБ · занято 142 ГБ", iconStorage()),
        listRow("Аккумулятор", "100% · идеальное состояние", iconBattery()),
      ]),

      el("div", { style: { height: "8px" } }),
    );
    return root;
  }

  function buildThemeGrid() {
    const grid = el("div", { class: "theme-grid" });
    const themes = [
      { id: "dark",  name: "Тёмная",  p1: "#0a0b12", p2: "#2d0f3a" },
      { id: "light", name: "Светлая", p1: "#f4f5fa", p2: "#e9e3ff" },
    ];
    const current = document.body.getAttribute("data-theme");
    themes.forEach((t) => {
      const card = el("button", {
        class: "theme-card",
        "aria-pressed": String(current === t.id),
        style: { "--p1": t.p1, "--p2": t.p2 },
      }, [
        el("div", { class: "theme-preview" }),
        el("div", { class: "theme-name" }, t.name),
      ]);
      card.addEventListener("click", () => {
        document.body.setAttribute("data-theme", t.id);
        $$(".theme-card", grid).forEach((c, i) => c.setAttribute("aria-pressed", String(themes[i].id === t.id)));
      });
      grid.append(card);
    });
    return grid;
  }

  function buildWallpaperPicker() {
    const grid = el("div", { class: "wp-picker" });
    const wps = [
      { id: "aurora", cls: "wp-tile--aurora" },
      { id: "sunset", cls: "wp-tile--sunset" },
      { id: "ocean",  cls: "wp-tile--ocean"  },
      { id: "mono",   cls: "wp-tile--mono"   },
    ];
    const current = document.body.getAttribute("data-wallpaper");
    wps.forEach((w) => {
      const tile = el("button", {
        class: `wp-tile ${w.cls}`,
        "aria-pressed": String(current === w.id),
        "data-wallpaper": w.id,
      });
      tile.addEventListener("click", () => {
        document.body.setAttribute("data-wallpaper", w.id);
        $$(".wp-tile", grid).forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.wallpaper === w.id)));
        $$(".wp-chip").forEach((c) => c.classList.toggle("wp-chip--active", c.dataset.wallpaper === w.id));
      });
      grid.append(tile);
    });
    return grid;
  }

  function buildToggleList(items) {
    const card = el("div", { class: "list-card" });
    items.forEach((it) => {
      const sw = el("div", {
        class: "switch",
        role: "switch",
        "aria-checked": String(it.on),
        tabindex: "0",
      });
      sw.addEventListener("click", () => {
        const now = sw.getAttribute("aria-checked") === "true" ? "false" : "true";
        sw.setAttribute("aria-checked", now);
      });
      card.append(
        el("div", { class: "list-row" }, [
          el("span", {
            class: "list-icon",
            style: { "--g1": "#9aa3b2", "--g2": "#525864" },
            html: it.icon || "",
          }),
          el("div", { class: "list-text" }, [
            el("span", { class: "list-title" }, it.name),
            it.sub ? el("span", { class: "list-sub" }, it.sub) : null,
          ]),
          sw,
        ]),
      );
    });
    return card;
  }

  function listRow(title, sub, iconHtml) {
    return el("div", { class: "list-row" }, [
      el("span", { class: "list-icon", html: iconHtml || "" }),
      el("div", { class: "list-text" }, [
        el("span", { class: "list-title" }, title),
        sub ? el("span", { class: "list-sub" }, sub) : null,
      ]),
      el("span", { style: { color: "var(--fg-mute)" } }, "›"),
    ]);
  }

  /* ----- Calculator ----- */

  function renderCalcApp() {
    const root = el("div");
    const display = el("div", { class: "calc-display" }, "0");
    const grid = el("div", { class: "calc-grid" });

    const layout = [
      ["AC", "+/-", "%", "÷"],
      ["7", "8", "9", "×"],
      ["4", "5", "6", "−"],
      ["1", "2", "3", "+"],
      ["0", ".", "="],
    ];

    let expr = "0";
    let lastOp = false;

    const isOp = (k) => "+−×÷".includes(k);
    const opMap = { "+": "+", "−": "-", "×": "*", "÷": "/" };

    function update() {
      display.textContent = expr;
    }
    function press(key) {
      if (key === "AC") { expr = "0"; lastOp = false; }
      else if (key === "+/-") {
        if (expr.startsWith("-")) expr = expr.slice(1);
        else if (expr !== "0") expr = "-" + expr;
      }
      else if (key === "%") {
        try { expr = String(parseFloat(expr) / 100); } catch { /* noop */ }
      }
      else if (key === "=") {
        try {
          let s = expr;
          for (const k of "+−×÷") s = s.split(k).join(opMap[k]);
          // eslint-disable-next-line no-new-func
          const v = Function(`"use strict"; return (${s})`)();
          expr = String(Math.round(v * 1e10) / 1e10);
        } catch { expr = "Ошибка"; }
        lastOp = false;
      }
      else if (isOp(key)) {
        if (lastOp) expr = expr.slice(0, -1) + key;
        else expr += key;
        lastOp = true;
      }
      else {
        if (expr === "0" && key !== ".") expr = key;
        else if (expr === "Ошибка") expr = key;
        else expr += key;
        lastOp = false;
      }
      update();
    }

    layout.forEach((row) => {
      row.forEach((k) => {
        let cls = "calc-btn";
        if (isOp(k) || k === "=") cls += " calc-btn--op";
        else if (["AC", "+/-", "%"].includes(k)) cls += " calc-btn--util";
        if (k === "0") cls += " calc-btn--zero";
        const b = el("button", { class: cls }, k);
        b.addEventListener("click", () => press(k));
        grid.append(b);
      });
    });

    root.append(display, grid);
    return root;
  }

  /* ----- Weather ----- */

  function renderWeatherApp() {
    const root = el("div");
    root.append(
      el("div", { class: "weather-hero" }, [
        el("div", { class: "weather-hero__city" }, "Москва"),
        el("div", { class: "weather-hero__temp" }, "+18°"),
        el("div", { class: "weather-hero__cond" }, "Облачно с прояснениями"),
        el("div", { class: "weather-hero__range" }, "Макс +21° · Мин +12°"),
      ]),
    );

    const hours = el("div", { class: "weather-hours" });
    const data = [
      ["Сейчас", "+18°"], ["10", "+19°"], ["11", "+20°"], ["12", "+21°"],
      ["13", "+21°"], ["14", "+20°"], ["15", "+19°"], ["16", "+18°"],
      ["17", "+17°"], ["18", "+16°"], ["19", "+15°"], ["20", "+14°"],
    ];
    data.forEach(([t, v]) => {
      hours.append(el("div", { class: "wh-cell" }, [
        el("div", { class: "wh-time" }, t),
        el("div", { class: "wh-temp" }, v),
      ]));
    });
    root.append(el("div", { class: "section-title" }, "Почасовой прогноз"), hours);

    const days = el("div", { class: "list-card" });
    const week = [
      ["Сегодня",       "+12°", "+21°", "Облачно"],
      ["Вторник",        "+13°", "+22°", "Малооблачно"],
      ["Среда",          "+14°", "+24°", "Солнечно"],
      ["Четверг",        "+15°", "+22°", "Дождь"],
      ["Пятница",        "+11°", "+18°", "Гроза"],
      ["Суббота",        "+10°", "+16°", "Облачно"],
      ["Воскресенье",    "+12°", "+19°", "Малооблачно"],
    ];
    week.forEach(([d, lo, hi, cond]) => {
      days.append(el("div", { class: "list-row" }, [
        el("span", { class: "list-icon", style: { "--g1": "#56c6ff", "--g2": "#2c7bff" }, html: iconWeatherSimple() }),
        el("div", { class: "list-text" }, [
          el("span", { class: "list-title" }, d),
          el("span", { class: "list-sub" }, cond),
        ]),
        el("span", { style: { fontSize: "13px", fontWeight: "600" } }, `${lo} / ${hi}`),
      ]));
    });
    root.append(el("div", { class: "section-title" }, "На неделю"), days);
    return root;
  }

  /* ----- Notes ----- */

  function renderNotesApp() {
    const root = el("div");
    const notes = [
      { t: "Идеи на выходные", m: "сегодня · 9:12", x: "Велосипед в Коломенском, кофе у реки, найти новую книгу про дизайн." },
      { t: "Список покупок",   m: "вчера · 21:40", x: "Молоко, хлеб, оливки, пасту, помидоры черри, твёрдый сыр." },
      { t: "Цели на месяц",    m: "8 мая",         x: "Закончить лекцию, добежать 30 км суммарно, посадить базилик." },
      { t: "Цитата",           m: "5 мая",         x: "«Простота — это высшая форма утончённости.» — Леонардо да Винчи" },
    ];
    notes.forEach((n) => root.append(el("div", { class: "note-card" }, [
      el("div", { class: "note-title" }, n.t),
      el("div", { class: "note-meta" }, n.m),
      el("div", { class: "note-text" }, n.x),
    ])));
    return root;
  }

  /* ----- Photos ----- */

  function renderPhotosApp() {
    const root = el("div");
    const grid = el("div", { class: "photo-grid" });
    const palettes = [
      ["#ff7a3c", "#d63384"], ["#4326b0", "#c2185b"], ["#0e62a0", "#00c2a8"],
      ["#34c759", "#1aa847"], ["#ffd86b", "#ff8a3d"], ["#7a5cff", "#ff5cae"],
      ["#5d8dff", "#2148e6"], ["#56c6ff", "#2c7bff"], ["#ff5e3a", "#c43d2c"],
      ["#3a3a4a", "#0a0b12"], ["#ffbe1a", "#ff6e3c"], ["#27a35d", "#066a2d"],
      ["#c084ff", "#7a3dff"], ["#ff3d6e", "#ff7e4d"], ["#1a1a22", "#3a3a4a"],
      ["#74e0a3", "#27a35d"], ["#0c8edb", "#055287"], ["#ff8c5e", "#ff2d6e"],
    ];
    palettes.forEach(([a, b]) => {
      grid.append(el("div", {
        class: "photo-tile",
        style: { background: `linear-gradient(135deg, ${a}, ${b})` },
      }));
    });
    root.append(el("div", { class: "section-title" }, "Недавние"), grid);
    return root;
  }

  /* ----- Calendar ----- */

  function renderCalendarApp() {
    const root = el("div");
    const now = new Date();
    const month = now.toLocaleString("ru", { month: "long", year: "numeric" });
    root.append(el("div", { class: "section-title" }, capitalize(month)));

    const cal = el("div", { class: "list-card", style: { padding: "10px" } });
    const weekHead = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "11px", color: "var(--fg-mute)", padding: "4px 0" } });
    ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].forEach((d) => weekHead.append(el("div", {}, d)));
    cal.append(weekHead);

    const grid = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", padding: "4px 0" } });
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let offset = (first.getDay() + 6) % 7; // monday-first
    for (let i = 0; i < offset; i++) grid.append(el("div", {}));
    for (let d = 1; d <= last; d++) {
      const isToday = d === now.getDate();
      const cell = el("div", {
        style: {
          aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: isToday ? "700" : "500",
          color: isToday ? "#fff" : "var(--fg)",
          background: isToday ? "linear-gradient(135deg, var(--accent), var(--accent-2))" : "transparent",
          borderRadius: "10px",
        }
      }, String(d));
      grid.append(cell);
    }
    cal.append(grid);
    root.append(cal);

    root.append(el("div", { class: "section-title" }, "Сегодня"));
    const events = el("div", { class: "list-card" });
    [
      ["10:00 – 10:15", "Standup команды", "Zoom · 5 участников"],
      ["12:30 – 13:30", "Обед с Никитой", "Кафе «Площадь»"],
      ["15:00 – 16:00", "Проектное ревью", "Офис · переговорка 3"],
      ["18:30 – 20:00", "Тренировка", "Парк Горького · бег"],
    ].forEach(([t, ti, sub]) => {
      events.append(el("div", { class: "list-row" }, [
        el("span", { class: "list-icon", style: { "--g1": "#5d8dff", "--g2": "#2148e6" }, html: iconCalendar() }),
        el("div", { class: "list-text" }, [
          el("span", { class: "list-title" }, ti),
          el("span", { class: "list-sub" }, sub),
        ]),
        el("span", { style: { fontSize: "11px", color: "var(--fg-mute)", textAlign: "right", whiteSpace: "nowrap" } }, t),
      ]));
    });
    root.append(events);

    return root;
  }

  /* ----- Clock ----- */

  function renderClockApp() {
    const root = el("div");
    const cities = [
      ["Москва", "9:41", "Сейчас"],
      ["Лондон", "7:41", "−2 ч"],
      ["Нью‑Йорк", "2:41", "−7 ч"],
      ["Токио", "15:41", "+6 ч"],
      ["Сан‑Франциско", "23:41", "−10 ч (вчера)"],
    ];
    root.append(el("div", { class: "section-title" }, "Мировое время"));
    const card = el("div", { class: "list-card" });
    cities.forEach(([c, t, d]) => {
      card.append(el("div", { class: "list-row" }, [
        el("span", { class: "list-icon", style: { "--g1": "#1a1a22", "--g2": "#3a3a4a" }, html: iconClockApp() }),
        el("div", { class: "list-text" }, [
          el("span", { class: "list-title" }, c),
          el("span", { class: "list-sub" }, d),
        ]),
        el("span", { style: { fontSize: "20px", fontWeight: "300", letterSpacing: "-0.5px" } }, t),
      ]));
    });
    root.append(card);

    root.append(el("div", { class: "section-title" }, "Будильник"));
    const alarms = el("div", { class: "list-card" });
    [
      ["7:00", "Пн – Пт", true],
      ["9:30", "Сб, Вс", true],
      ["13:00", "Сон 20 минут", false],
    ].forEach(([t, sub, on]) => {
      const sw = el("div", { class: "switch", role: "switch", "aria-checked": String(on), tabindex: "0" });
      sw.addEventListener("click", () => sw.setAttribute("aria-checked", sw.getAttribute("aria-checked") === "true" ? "false" : "true"));
      alarms.append(el("div", { class: "list-row" }, [
        el("span", { style: { fontSize: "26px", fontWeight: "300", color: on ? "var(--fg)" : "var(--fg-mute)" } }, t),
        el("div", { class: "list-text" }, [el("span", { class: "list-sub" }, sub)]),
        sw,
      ]));
    });
    root.append(alarms);
    return root;
  }

  /* ----- Music ----- */

  function renderMusicApp() {
    const root = el("div");
    const card = el("div", { class: "glass", style: { borderRadius: "24px", padding: "18px", marginBottom: "16px" } }, [
      el("div", { style: { aspectRatio: "1 / 1", borderRadius: "20px", background: "linear-gradient(135deg, #7a5cff, #ff5cae)", marginBottom: "16px" } }),
      el("div", { style: { fontSize: "20px", fontWeight: "600" } }, "Свет в окне"),
      el("div", { style: { fontSize: "14px", color: "var(--fg-soft)" } }, "Ночной экспресс · Альбом «Дым»"),
      el("div", { class: "music-progress", style: { marginTop: "16px", height: "4px", background: "rgba(127,127,127,0.3)", borderRadius: "999px", overflow: "hidden" } }, [
        el("span", { style: { display: "block", height: "100%", width: "38%", background: "linear-gradient(90deg, var(--accent), var(--accent-2))" } }),
      ]),
      el("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--fg-mute)", marginTop: "4px" } }, [
        el("span", {}, "1:14"),
        el("span", {}, "−2:02"),
      ]),
      el("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", gap: "24px", marginTop: "18px" } }, [
        el("button", { html: iconPrev(), style: { width: "44px", height: "44px" } }),
        el("button", { html: iconPlayBig(), style: { width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" } }),
        el("button", { html: iconNext(), style: { width: "44px", height: "44px" } }),
      ]),
    ]);
    root.append(card);

    root.append(el("div", { class: "section-title" }, "Очередь"));
    const list = el("div", { class: "list-card" });
    [
      ["Свет в окне",  "Ночной экспресс", "3:16", true],
      ["Море вне сезона", "Алина Тут", "4:02", false],
      ["Полупрозрачный", "Сны Холмов", "3:48", false],
      ["Тёплый бетон", "Скайлайн", "5:11", false],
      ["Парус",        "Айвазовский Бэнд", "3:33", false],
    ].forEach(([t, ar, dur, playing]) => {
      list.append(el("div", { class: "list-row" }, [
        el("span", { class: "list-icon", style: { "--g1": "#ff5cae", "--g2": "#7a5cff" }, html: iconMusic() }),
        el("div", { class: "list-text" }, [
          el("span", { class: "list-title", style: { color: playing ? "var(--accent)" : undefined } }, t),
          el("span", { class: "list-sub" }, ar),
        ]),
        el("span", { style: { fontSize: "12px", color: "var(--fg-mute)" } }, dur),
      ]));
    });
    root.append(list);
    return root;
  }

  /* ----- Messages ----- */

  function renderMessagesApp() {
    const root = el("div");
    const chats = [
      ["Лена",     "Бери зонт, обещают дождь к вечеру.", "9:38", "ЛК", "#34c0ff", "#1c6df0"],
      ["Никита",   "Сейчас буду в офисе, кофе у меня.", "9:14", "НМ", "#3ddc84", "#0aa869"],
      ["Мама",     "Приедешь в субботу?", "вчера", "МА", "#ff9f3d", "#ff5e3a"],
      ["Команда DevinOS", "Иван: пушнул фикс по UI", "вчера", "DO", "#7a5cff", "#ff5cae"],
      ["Доставка", "Заказ #21442 в пути.", "пн", "ДО", "#a9b3c2", "#525864"],
    ];
    const list = el("div", { class: "list-card" });
    chats.forEach(([n, m, t, in_, g1, g2]) => {
      list.append(el("div", { class: "list-row" }, [
        el("span", {
          class: "list-icon",
          style: { "--g1": g1, "--g2": g2, fontWeight: "700" },
        }, in_),
        el("div", { class: "list-text" }, [
          el("span", { class: "list-title" }, n),
          el("span", { class: "list-sub" }, m),
        ]),
        el("span", { style: { fontSize: "11px", color: "var(--fg-mute)" } }, t),
      ]));
    });
    root.append(el("div", { class: "section-title" }, "Чаты"), list);
    return root;
  }

  /* ----- Phone ----- */

  function renderPhoneApp() {
    const root = el("div");
    const calls = [
      ["Лена",     "входящий", "9:32", "01:14"],
      ["Никита",   "исходящий", "вчера", "12:40"],
      ["+7 999 ...", "пропущенный", "вчера", "—"],
      ["Мама",     "входящий", "пн", "00:32"],
      ["Кафе «Площадь»", "исходящий", "пн", "00:08"],
    ];
    const list = el("div", { class: "list-card" });
    calls.forEach(([n, k, t, dur]) => {
      const missed = k === "пропущенный";
      list.append(el("div", { class: "list-row" }, [
        el("span", { class: "list-icon", style: { "--g1": missed ? "#ff5e3a" : "#3ddc84", "--g2": missed ? "#c43d2c" : "#0aa869" }, html: iconPhone() }),
        el("div", { class: "list-text" }, [
          el("span", { class: "list-title", style: { color: missed ? "var(--accent)" : undefined } }, n),
          el("span", { class: "list-sub" }, `${k} · ${dur}`),
        ]),
        el("span", { style: { fontSize: "11px", color: "var(--fg-mute)" } }, t),
      ]));
    });
    root.append(el("div", { class: "section-title" }, "Недавние"), list);
    return root;
  }

  /* ----- Mail ----- */

  function renderMailApp() {
    const root = el("div");
    const list = el("div", { class: "list-card" });
    [
      ["Анна Петрова", "Re: договор", "Посмотрите раздел 4, отметила правки и предложение по срокам.", "9:38", "АП", "#5d8dff", "#2148e6"],
      ["GitHub",      "PR #482 готов к ревью",  "Иван открыл PR и попросил вас как ревьюера.", "9:12", "GH", "#222226", "#3a3a44"],
      ["Тинькофф",    "Чек на 540 ₽",           "Сегодня в 8:42, кафе «Площадь».", "8:43", "T",  "#ffe066", "#ffaf00"],
      ["DevinOS Team", "Welcome aboard 🎉",     "Приятного использования! Если что-то не так — пишите.", "вчера", "DO", "#7a5cff", "#ff5cae"],
    ].forEach(([from, subj, snip, t, ini, g1, g2]) => {
      list.append(el("div", { class: "list-row" }, [
        el("span", { class: "list-icon", style: { "--g1": g1, "--g2": g2, fontWeight: "700" } }, ini),
        el("div", { class: "list-text" }, [
          el("span", { class: "list-title" }, from),
          el("span", { class: "list-sub", style: { color: "var(--fg)" } }, subj),
          el("span", { class: "list-sub" }, snip),
        ]),
        el("span", { style: { fontSize: "11px", color: "var(--fg-mute)" } }, t),
      ]));
    });
    root.append(el("div", { class: "section-title" }, "Входящие"), list);
    return root;
  }

  /* ----- Browser ----- */

  function renderBrowserApp() {
    const root = el("div");
    root.append(el("div", { style: { padding: "8px 0 12px" } }, [
      el("div", { class: "glass", style: { display: "flex", alignItems: "center", gap: "8px", borderRadius: "16px", padding: "10px 14px" } }, [
        el("span", { html: iconLockSmall(), style: { display: "inline-flex", color: "var(--fg-mute)" } }),
        el("span", { style: { fontSize: "14px" } }, "https://devin.ai"),
      ]),
    ]));
    root.append(el("div", { class: "section-title" }, "Избранное"));
    const grid = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" } });
    [
      ["Devin",   "#ff8a3d", "#ff3d6e"],
      ["GitHub",  "#222226", "#3a3a44"],
      ["YouTube", "#ff2d2d", "#a30000"],
      ["VK",      "#0078ff", "#004db3"],
      ["Habr",    "#65a4cd", "#2c5d80"],
      ["Wiki",    "#3a3a44", "#1a1a22"],
      ["Telegram","#34c0ff", "#1c6df0"],
      ["X",       "#000000", "#222226"],
    ].forEach(([n, g1, g2]) => {
      grid.append(el("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" } }, [
        el("span", {
          class: "ai-tile",
          style: { "--g1": g1, "--g2": g2, width: "52px", height: "52px", borderRadius: "16px", color: "#fff", fontWeight: "700", fontSize: "16px" },
        }, n[0]),
        el("span", { class: "ai-label", style: { color: "var(--fg)", textShadow: "none" } }, n),
      ]));
    });
    root.append(grid);
    return root;
  }

  /* ----- Camera ----- */

  function renderCameraApp() {
    const root = el("div", { style: { display: "flex", flexDirection: "column", alignItems: "center" } });
    root.append(
      el("div", {
        style: {
          width: "100%",
          aspectRatio: "3 / 4",
          borderRadius: "20px",
          background: "linear-gradient(135deg, #1a1a22 0%, #3a3a44 50%, #1a1a22 100%)",
          marginTop: "10px",
          position: "relative",
          overflow: "hidden",
        }
      }, [
        el("div", {
          style: {
            position: "absolute",
            inset: "0",
            background: "radial-gradient(70% 50% at 50% 50%, rgba(255,255,255,0.06), transparent)",
          }
        }),
        el("div", {
          style: {
            position: "absolute", left: "20px", top: "20px", padding: "4px 10px",
            background: "rgba(0,0,0,0.5)", borderRadius: "12px", fontSize: "12px", color: "#fff",
          }
        }, "1×"),
        el("div", {
          style: {
            position: "absolute", right: "20px", top: "20px", padding: "4px 10px",
            background: "rgba(0,0,0,0.5)", borderRadius: "12px", fontSize: "12px", color: "#ffd86b",
          }
        }, "HDR"),
      ]),
      el("div", { style: { display: "flex", gap: "16px", marginTop: "20px", fontSize: "13px", color: "var(--fg-soft)" } }, [
        el("span", {}, "Видео"),
        el("span", { style: { color: "var(--accent)", fontWeight: "600" } }, "Фото"),
        el("span", {}, "Портрет"),
        el("span", {}, "Ночь"),
      ]),
      el("button", {
        style: {
          width: "72px", height: "72px", borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
          marginTop: "16px",
          boxShadow: "0 0 0 4px rgba(255,255,255,0.15), 0 0 0 6px rgba(255,255,255,0.08)",
        }
      }),
    );
    return root;
  }

  /* ----- Maps ----- */

  function renderMapsApp() {
    const root = el("div");
    root.append(
      el("div", {
        style: {
          width: "100%", height: "300px", borderRadius: "20px",
          marginTop: "10px",
          background: `
            radial-gradient(80% 60% at 30% 40%, #d3eed8, transparent),
            radial-gradient(80% 60% at 70% 70%, #c1f5ec, transparent),
            linear-gradient(180deg, #e9f5ec, #d3eed8)
          `,
          position: "relative", overflow: "hidden",
        }
      }, [
        el("div", {
          style: {
            position: "absolute", left: "20px", top: "30px", right: "60px", height: "8px",
            background: "linear-gradient(90deg, transparent, #c4d6cc 20%, #c4d6cc 80%, transparent)",
            borderRadius: "4px",
            transform: "rotate(-8deg)",
          }
        }),
        el("div", {
          style: {
            position: "absolute", left: "60px", top: "120px", right: "20px", height: "10px",
            background: "linear-gradient(90deg, transparent, #ffe0b1 20%, #ffe0b1 80%, transparent)",
            borderRadius: "5px",
            transform: "rotate(5deg)",
          }
        }),
        el("div", {
          style: {
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
            width: "16px", height: "16px", borderRadius: "50%",
            background: "var(--accent)",
            boxShadow: "0 0 0 6px rgba(255, 110, 60, 0.3), 0 0 0 12px rgba(255, 110, 60, 0.15)",
          }
        }),
      ])
    );
    root.append(el("div", { class: "section-title" }, "Рядом"));
    const list = el("div", { class: "list-card" });
    [
      ["Кафе «Площадь»",   "120 м · открыто",   "★ 4.8"],
      ["Парк Горького",     "1.2 км · парк",    "★ 4.9"],
      ["Аптека 36.6",      "350 м · открыто",  "★ 4.5"],
      ["Метро Парк культуры","450 м · станция", "—"],
    ].forEach(([n, sub, rate]) => {
      list.append(el("div", { class: "list-row" }, [
        el("span", { class: "list-icon", style: { "--g1": "#7be0a3", "--g2": "#27a35d" }, html: iconMap() }),
        el("div", { class: "list-text" }, [
          el("span", { class: "list-title" }, n),
          el("span", { class: "list-sub" }, sub),
        ]),
        el("span", { style: { fontSize: "12px", color: "var(--fg-mute)" } }, rate),
      ]));
    });
    root.append(list);
    return root;
  }

  /* ----- Files ----- */

  function renderFilesApp() {
    const root = el("div");
    root.append(el("div", { class: "section-title" }, "Хранилище"));
    root.append(el("div", { class: "list-card" }, [
      el("div", { class: "list-row" }, [
        el("span", { class: "list-icon", style: { "--g1": "#67c0ff", "--g2": "#3a7bff" }, html: iconStorage() }),
        el("div", { class: "list-text" }, [
          el("span", { class: "list-title" }, "Внутренняя память"),
          el("span", { class: "list-sub" }, "142.0 / 256.0 ГБ занято"),
        ]),
        el("span", { style: { color: "var(--fg-mute)" } }, "›"),
      ]),
    ]));

    root.append(el("div", { class: "section-title" }, "Категории"));
    const list = el("div", { class: "list-card" });
    [
      ["Изображения", "8 124 файла",     iconImage(), "#ff7e4d", "#ff2d6e"],
      ["Видео",       "412 файлов",      iconVideo(), "#ff3d6e", "#a3055a"],
      ["Аудио",       "1 240 треков",    iconMusic(), "#ff5cae", "#7a5cff"],
      ["Документы",   "236 документов",  iconDoc(),   "#5d8dff", "#2148e6"],
      ["Архивы",      "18 архивов",      iconZip(),   "#ffd86b", "#ff8a3d"],
    ].forEach(([n, sub, ic, g1, g2]) => {
      list.append(el("div", { class: "list-row" }, [
        el("span", { class: "list-icon", style: { "--g1": g1, "--g2": g2 }, html: ic }),
        el("div", { class: "list-text" }, [
          el("span", { class: "list-title" }, n),
          el("span", { class: "list-sub" }, sub),
        ]),
        el("span", { style: { color: "var(--fg-mute)" } }, "›"),
      ]));
    });
    root.append(list);
    return root;
  }

  /* ----- Wallet ----- */

  function renderWalletApp() {
    const root = el("div");
    const card = el("div", {
      style: {
        height: "200px", borderRadius: "20px",
        background: "linear-gradient(135deg, #2a1a4d 0%, #4a1a7a 60%, #c2185b 100%)",
        padding: "18px", color: "#fff", position: "relative", overflow: "hidden",
        marginTop: "10px",
      }
    }, [
      el("div", { style: { fontSize: "12px", opacity: "0.7" } }, "DevinOS Wallet"),
      el("div", { style: { fontSize: "28px", fontWeight: "300", letterSpacing: "-0.5px", marginTop: "12px" } }, "₽ 142 480.55"),
      el("div", { style: { position: "absolute", bottom: "18px", left: "18px", fontSize: "13px", letterSpacing: "3px" } }, "•••• 7421"),
      el("div", { style: { position: "absolute", bottom: "18px", right: "18px", fontSize: "12px", opacity: "0.8" } }, "12/28"),
      el("div", {
        style: {
          position: "absolute", right: "-30px", top: "-30px", width: "180px", height: "180px", borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        }
      }),
    ]);
    root.append(card);
    root.append(el("div", { class: "section-title" }, "Последние операции"));
    const list = el("div", { class: "list-card" });
    [
      ["Кафе «Площадь»",   "сегодня 8:42",  "−540 ₽",  "#ff5e3a", "#c43d2c"],
      ["Зарплата",         "10 мая",        "+184 200 ₽", "#3ddc84", "#0aa869"],
      ["Озон",             "9 мая",         "−2 120 ₽", "#5d8dff", "#2148e6"],
      ["Перевод от Лены",  "8 мая",         "+1 500 ₽", "#3ddc84", "#0aa869"],
      ["Яндекс.Такси",     "8 мая",         "−280 ₽",   "#ffd86b", "#ffaf00"],
    ].forEach(([n, t, amt, g1, g2]) => {
      const positive = amt.startsWith("+");
      list.append(el("div", { class: "list-row" }, [
        el("span", { class: "list-icon", style: { "--g1": g1, "--g2": g2 }, html: iconCard() }),
        el("div", { class: "list-text" }, [
          el("span", { class: "list-title" }, n),
          el("span", { class: "list-sub" }, t),
        ]),
        el("span", {
          style: { fontSize: "14px", fontWeight: "600", color: positive ? "#3ddc84" : "var(--fg)" }
        }, amt),
      ]));
    });
    root.append(list);
    return root;
  }

  /* ----- Store ----- */

  function renderStoreApp() {
    const root = el("div");
    const featured = el("div", {
      style: {
        height: "180px", borderRadius: "20px", marginTop: "10px",
        background: "linear-gradient(135deg, #3ec5ff, #5e5cff)",
        padding: "18px", color: "#fff", position: "relative", overflow: "hidden",
      }
    }, [
      el("div", { style: { fontSize: "12px", opacity: "0.85" } }, "ИГРА НЕДЕЛИ"),
      el("div", { style: { fontSize: "26px", fontWeight: "700", letterSpacing: "-0.5px", marginTop: "8px" } }, "Sky Above"),
      el("div", { style: { fontSize: "13px", opacity: "0.8", marginTop: "4px" } }, "Атмосферная аркада с открытым миром"),
      el("button", {
        style: {
          marginTop: "12px", padding: "8px 16px", borderRadius: "999px",
          background: "rgba(255,255,255,0.18)", color: "#fff", fontWeight: "600", fontSize: "13px",
        }
      }, "Установить"),
    ]);
    root.append(featured);

    root.append(el("div", { class: "section-title" }, "Топ приложений"));
    const list = el("div", { class: "list-card" });
    [
      ["Notes Pro",     "продуктивность", "★ 4.8", "#ffe8a8", "#ffb84d"],
      ["Aurora Music",  "медиа",          "★ 4.7", "#ff5cae", "#7a5cff"],
      ["Tracks",        "спорт",          "★ 4.6", "#3ddc84", "#0aa869"],
      ["Bites",         "еда",            "★ 4.5", "#ff7e4d", "#ff2d6e"],
      ["Studio",        "фото",           "★ 4.9", "#a9b3c2", "#525864"],
    ].forEach(([n, cat, rate, g1, g2]) => {
      list.append(el("div", { class: "list-row" }, [
        el("span", { class: "list-icon", style: { "--g1": g1, "--g2": g2 }, html: iconBag() }),
        el("div", { class: "list-text" }, [
          el("span", { class: "list-title" }, n),
          el("span", { class: "list-sub" }, `${cat} · ${rate}`),
        ]),
        el("button", {
          style: {
            padding: "6px 14px", borderRadius: "999px", fontSize: "12px",
            fontWeight: "600", background: "rgba(127,127,127,0.18)",
          }
        }, "Загрузить"),
      ]));
    });
    root.append(list);
    return root;
  }

  /* ----- Themes / app gallery ----- */

  function renderThemesApp() {
    const root = el("div");
    root.append(el("div", { class: "section-title" }, "Темы оформления"));
    const grid = el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } });
    [
      ["Aurora",   "#4326b0", "#c2185b"],
      ["Sunset",   "#ff7a3c", "#d63384"],
      ["Ocean",    "#0e62a0", "#00c2a8"],
      ["Forest",   "#27a35d", "#066a2d"],
      ["Mono",     "#2a2a30", "#15151a"],
      ["Velvet",   "#7a3dff", "#c084ff"],
    ].forEach(([n, g1, g2]) => {
      grid.append(el("div", { class: "theme-card", style: { "--p1": g1, "--p2": g2 } }, [
        el("div", { class: "theme-preview" }),
        el("div", { class: "theme-name" }, n),
      ]));
    });
    root.append(grid);
    return root;
  }

  /* ---------------------- Clock ---------------------- */

  function startClock() {
    const lockTime  = $("#lockTime");
    const lockDate  = $("#lockDate");
    const sbTime    = $("#sbTime");
    const npClock   = $("#npClock");
    const npDate    = $("#npDate");
    const clockDigi = $("#clockDigital");
    const handHour    = $("#handHour");
    const handMinute  = $("#handMinute");
    const handSecond  = $("#handSecond");

    const fmtDate = (d) => {
      const days = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
      const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
    };

    function tick() {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const big = `${d.getHours()}:${mm}`;
      lockTime.textContent = big;
      sbTime.textContent = `${d.getHours()}:${mm}`;
      npClock.textContent = big;
      lockDate.textContent = fmtDate(d);
      npDate.textContent = fmtDate(d);
      if (clockDigi) clockDigi.textContent = `${hh}:${mm}`;

      const s = d.getSeconds() + d.getMilliseconds() / 1000;
      const m = d.getMinutes() + s / 60;
      const h = (d.getHours() % 12) + m / 60;
      if (handSecond) handSecond.style.transform = `rotate(${s * 6}deg)`;
      if (handMinute) handMinute.style.transform = `rotate(${m * 6}deg)`;
      if (handHour)   handHour.style.transform   = `rotate(${h * 30}deg)`;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------- Gestures ---------------------- */

  function bindGestures() {
    const phone = $("#phone");
    let start = null;
    let zone = null;

    phone.addEventListener("pointerdown", (ev) => {
      if (ev.button && ev.button !== 0) return;
      start = { x: ev.clientX, y: ev.clientY, t: performance.now() };
      const target = ev.target;
      if (target.closest('.gesture-zone[data-gesture="cc"]'))    zone = "cc";
      else if (target.closest('.gesture-zone[data-gesture="notif"]')) zone = "notif";
      else zone = null;
    });

    phone.addEventListener("pointerup", (ev) => {
      if (!start) return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      const dt = performance.now() - start.t;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Tap: small move
      if (absX < 8 && absY < 8 && dt < 300) {
        // Allow taps to bubble to children. Just close panels if open + tapped wallpaper
        if (state.panelOpen) {
          // If tap landed on wallpaper area outside panel, close panel
          const onPanel = ev.target.closest(".panel");
          if (!onPanel) closePanels();
        }
        start = null; zone = null;
        return;
      }

      // Swipe down from a top zone -> open panel
      if (dy > 60 && absY > absX && start.y < 80 && !state.locked) {
        if (zone === "cc")    openPanel("cc");
        if (zone === "notif") openPanel("notif");
        start = null; zone = null;
        return;
      }

      // Swipe up from bottom edge
      if (dy < -50 && absY > absX) {
        const fromBottom = phone.getBoundingClientRect().bottom - start.y < 80;
        if (state.locked && fromBottom) {
          unlock();
        } else if (state.appOpen && fromBottom) {
          // Long swipe up = recents, short = home
          if (-dy > 200) openRecents();
          else closeApp();
        } else if (state.panelOpen && fromBottom) {
          closePanels();
        } else if (state.recentsOpen && fromBottom) {
          closeRecents();
        } else if (!state.locked && fromBottom) {
          if (-dy > 200) openRecents();
        }
      }

      // Swipe up on a panel -> close
      if (dy < -50 && absY > absX && state.panelOpen) {
        const onPanel = ev.target.closest(".panel");
        if (onPanel) closePanels();
      }

      start = null; zone = null;
    });

    phone.addEventListener("pointercancel", () => { start = null; zone = null; });
  }

  /* ---------------------- UI events ---------------------- */

  function bindUiEvents() {
    // App back
    $("#appBack").addEventListener("click", () => closeApp());

    // Recents clear
    $("#recentsClear").addEventListener("click", () => {
      state.recents = [];
      renderRecents();
      closeRecents();
    });

    // CC tiles
    $$("#controlCenter [aria-pressed]").forEach((b) => {
      b.addEventListener("click", () => {
        const next = b.getAttribute("aria-pressed") === "true" ? "false" : "true";
        b.setAttribute("aria-pressed", next);
        if (b.id === "ccThemeToggle") toggleTheme();
      });
    });
    $("#ccMusicPlay").addEventListener("click", () => {
      state.musicPlaying = !state.musicPlaying;
      const el = $("#ccMusicPlay");
      el.innerHTML = state.musicPlaying
        ? `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`
        : `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="6" y="5" width="4" height="14" fill="currentColor" rx="1"/><rect x="14" y="5" width="4" height="14" fill="currentColor" rx="1"/></svg>`;
    });

    // Lock screen music play
    $("#lockMusicPlay")?.addEventListener("click", (e) => {
      e.stopPropagation();
      $("#ccMusicPlay").click();
    });
    $("#lockCamera")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openApp("camera");
    });

    // Hint panel
    $("#hintLockBtn")?.addEventListener("click", () => lock());
    $("#hintThemeBtn")?.addEventListener("click", () => toggleTheme());
    $$(".wp-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.body.setAttribute("data-wallpaper", chip.dataset.wallpaper);
      });
    });

    // Bigwidget clicks
    $$(".bigwidget").forEach((w) => w.addEventListener("click", () => openApp(w.dataset.app)));
    $("#homeSearch")?.addEventListener("click", () => {
      // soft tactile
      const s = $("#homeSearch");
      s.style.transform = "scale(0.97)";
      setTimeout(() => (s.style.transform = ""), 160);
    });

    // Esc key & keyboard
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (state.panelOpen) return closePanels();
        if (state.recentsOpen) return closeRecents();
        if (state.appOpen) return closeApp();
        if (!state.locked) return lock();
      }
      if (e.key === "h" && !state.locked) closeApp();
    });
  }

  function toggleTheme() {
    const cur = document.body.getAttribute("data-theme");
    document.body.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
  }

  function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

  /* ---------------------- Inline icons ---------------------- */

  function iconChat()    { return `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V5Z" fill="#fff"/></svg>`; }
  function iconPhone()   { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.36 2.3.55 3.6.55a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A18 18 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.3.2 2.5.55 3.6a1 1 0 0 1-.25 1l-2.2 2.2Z" fill="#fff"/></svg>`; }
  function iconMail()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="3" y="6" width="18" height="13" rx="2" fill="#fff"/><path d="M3 7l9 7 9-7" stroke="rgba(0,0,0,0.18)" stroke-width="1.4" fill="none"/></svg>`; }
  function iconGlobe()   { return `<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" fill="none" stroke="#fff" stroke-width="2"/></svg>`; }
  function iconMusic()   { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 18V6l11-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm11-6a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" fill="#fff"/></svg>`; }
  function iconImage()   { return `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="3" y="5" width="18" height="14" rx="2" fill="#fff"/><circle cx="8.5" cy="10" r="1.6" fill="rgba(0,0,0,0.3)"/><path d="M5 17l4-4 3 3 4-5 4 6" stroke="rgba(0,0,0,0.25)" stroke-width="1.4" fill="none" stroke-linejoin="round"/></svg>`; }
  function iconCamera()  { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 4l1.5-2h3L15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4Zm3 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" fill="#fff"/></svg>`; }
  function iconWeather() { return `<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="9" cy="10" r="4" fill="#ffd86b"/><path d="M5 17a5 5 0 0 1 9-2 4 4 0 1 1 0 8H8a4 4 0 0 1-3-6Z" fill="#fff"/></svg>`; }
  function iconWeatherSimple() { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 17a5 5 0 0 1 9-2 4 4 0 1 1 0 8H8a4 4 0 0 1-3-6Z" fill="#fff"/></svg>`; }
  function iconCalendar(){ return `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="3" y="5" width="18" height="16" rx="2" fill="#fff"/><path d="M3 9h18" stroke="rgba(0,0,0,0.2)" stroke-width="1.4"/><rect x="6" y="3" width="2" height="4" rx="1" fill="rgba(0,0,0,0.5)"/><rect x="16" y="3" width="2" height="4" rx="1" fill="rgba(0,0,0,0.5)"/><rect x="7" y="12" width="3" height="3" rx="1" fill="#ff3d6e"/></svg>`; }
  function iconNotes()   { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 4a2 2 0 0 1 2-2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Z" fill="#fff"/><path d="M14 2v5h5" fill="rgba(0,0,0,0.18)"/><path d="M8 12h8M8 16h6" stroke="rgba(0,0,0,0.4)" stroke-width="1.4" stroke-linecap="round"/></svg>`; }
  function iconClockApp(){ return `<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="9" fill="#fff"/><path d="M12 7v5l3.5 2" stroke="#1a1a22" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`; }
  function iconCalc()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="4" y="3" width="16" height="18" rx="2" fill="#fff"/><rect x="6" y="5" width="12" height="4" rx="1" fill="rgba(0,0,0,0.3)"/><circle cx="8" cy="13" r="1" fill="rgba(0,0,0,0.45)"/><circle cx="12" cy="13" r="1" fill="rgba(0,0,0,0.45)"/><circle cx="16" cy="13" r="1" fill="rgba(0,0,0,0.45)"/><circle cx="8" cy="17" r="1" fill="rgba(0,0,0,0.45)"/><circle cx="12" cy="17" r="1" fill="rgba(0,0,0,0.45)"/><circle cx="16" cy="17" r="1" fill="rgba(0,0,0,0.45)"/></svg>`; }
  function iconMap()     { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 3l-6 2v16l6-2 6 2 6-2V3l-6 2-6-2Zm0 0v16M15 5v16" fill="#fff" stroke="rgba(0,0,0,0.25)" stroke-width="1.2"/></svg>`; }
  function iconFolder()  { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" fill="#fff"/></svg>`; }
  function iconCard()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="3" y="6" width="18" height="13" rx="2" fill="#fff"/><rect x="3" y="9" width="18" height="3" fill="rgba(0,0,0,0.5)"/><rect x="6" y="15" width="6" height="2" rx="1" fill="rgba(0,0,0,0.4)"/></svg>`; }
  function iconBag()     { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 7a6 6 0 0 1 12 0v1h2l-1 13H5L4 8h2V7Zm2 1h8V7a4 4 0 0 0-8 0v1Z" fill="#fff"/></svg>`; }
  function iconGear()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 4a9 9 0 0 0-.18-1.78l2-1.5-2-3.46-2.36.7a9 9 0 0 0-3.08-1.78L15 1.5h-6l-.38 2.68a9 9 0 0 0-3.08 1.78l-2.36-.7-2 3.46 2 1.5A9 9 0 0 0 3 12c0 .6.06 1.2.18 1.78l-2 1.5 2 3.46 2.36-.7a9 9 0 0 0 3.08 1.78L9 22.5h6l.38-2.68a9 9 0 0 0 3.08-1.78l2.36.7 2-3.46-2-1.5A9 9 0 0 0 21 12Z" fill="#fff"/></svg>`; }
  function iconSparkle() { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4L12 2Z" fill="#fff"/><circle cx="19" cy="5" r="1.4" fill="#fff"/><circle cx="5" cy="19" r="1.2" fill="#fff"/></svg>`; }
  function iconWifi()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 21a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Zm-5-6.6a8 8 0 0 1 10 0l1.4-1.4a10 10 0 0 0-12.8 0L7 14.4Zm-3.6-3.6a13 13 0 0 1 17.2 0L21 9.4a15 15 0 0 0-18 0L3.4 10.8Z" fill="#fff"/></svg>`; }
  function iconBt()      { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 6l10 12-5 4V2l5 4L7 18" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>`; }
  function iconCell()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="3" y="14" width="3" height="6" rx="1" fill="#fff"/><rect x="8" y="10" width="3" height="10" rx="1" fill="#fff"/><rect x="13" y="6" width="3" height="14" rx="1" fill="#fff"/><rect x="18" y="2" width="3" height="18" rx="1" fill="#fff"/></svg>`; }
  function iconPlane()   { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M2 14l9-3V5a2 2 0 1 1 4 0v6l9 3v3l-9-2.4V19l3 2v2l-5-1.6L8 23v-2l3-2v-4.4L2 17v-3Z" fill="#fff"/></svg>`; }
  function iconHotspot() { return `<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="3" fill="#fff"/><path d="M5.6 18.4a8 8 0 0 1 12.8 0M3 21a12 12 0 0 1 18 0M8.4 15.6a4 4 0 0 1 7.2 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`; }
  function iconBell()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Zm4 4h4a2 2 0 1 1-4 0Z" fill="#fff"/></svg>`; }
  function iconLock()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="5" y="11" width="14" height="10" rx="2" fill="#fff"/><path d="M8 11V8a4 4 0 1 1 8 0v3" fill="none" stroke="#fff" stroke-width="2"/></svg>`; }
  function iconLockSmall(){ return `<svg viewBox="0 0 24 24" width="14" height="14"><rect x="6" y="11" width="12" height="9" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 1 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`; }
  function iconMoon()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3a9 9 0 1 0 9 9c-3 1-9-3-9-9Z" fill="#fff"/></svg>`; }
  function iconInfo()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="9" fill="#fff"/><circle cx="12" cy="8" r="1.4" fill="rgba(0,0,0,0.55)"/><rect x="11" y="11" width="2" height="7" rx="1" fill="rgba(0,0,0,0.55)"/></svg>`; }
  function iconChip()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="6" y="6" width="12" height="12" rx="2" fill="#fff"/><rect x="9" y="9" width="6" height="6" rx="1" fill="rgba(0,0,0,0.55)"/><path d="M3 10h3M3 14h3M18 10h3M18 14h3M10 3v3M14 3v3M10 18v3M14 18v3" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg>`; }
  function iconStorage() { return `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="4" y="6" width="16" height="4" rx="1" fill="#fff"/><rect x="4" y="14" width="16" height="4" rx="1" fill="#fff"/><circle cx="8" cy="8"  r="1" fill="rgba(0,0,0,0.5)"/><circle cx="8" cy="16" r="1" fill="rgba(0,0,0,0.5)"/></svg>`; }
  function iconBattery() { return `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="3" y="7" width="16" height="10" rx="2" fill="#fff"/><rect x="20" y="10" width="2" height="4" rx="1" fill="#fff"/><rect x="5" y="9" width="12" height="6" rx="1" fill="rgba(0,0,0,0.45)"/></svg>`; }
  function iconVideo()   { return `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="3" y="6" width="13" height="12" rx="2" fill="#fff"/><path d="M16 10l5-3v10l-5-3v-4Z" fill="#fff"/></svg>`; }
  function iconDoc()     { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 4a2 2 0 0 1 2-2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Z" fill="#fff"/><path d="M14 2v5h5" fill="rgba(0,0,0,0.2)"/></svg>`; }
  function iconZip()     { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Z" fill="#fff"/><rect x="11" y="3" width="2" height="2" fill="rgba(0,0,0,0.4)"/><rect x="11" y="6" width="2" height="2" fill="rgba(0,0,0,0.4)"/><rect x="11" y="9" width="2" height="2" fill="rgba(0,0,0,0.4)"/><rect x="11" y="12" width="2" height="2" fill="rgba(0,0,0,0.4)"/><rect x="10" y="15" width="4" height="5" rx="1" fill="rgba(0,0,0,0.5)"/></svg>`; }
  function iconPrev()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 5v14M20 5v14L9 12 20 5Z" fill="currentColor"/></svg>`; }
  function iconNext()    { return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M18 5v14M4 5v14L15 12 4 5Z" fill="currentColor"/></svg>`; }
  function iconPlayBig() { return `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`; }
})();
