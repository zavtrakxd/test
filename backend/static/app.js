/* CoinCasino single-page app. Vanilla JS, no frameworks. */
"use strict";

const _CFG_BASE = (window.CONFIG && window.CONFIG.API_BASE) || "";
// `location.origin` excludes any user:password, so we always derive a clean
// origin from it — Chrome refuses to fetch URLs that carry embedded creds.
const API_BASE = _CFG_BASE || location.origin;
const TUNNEL_BASIC = (window.CONFIG && window.CONFIG.TUNNEL_BASIC_AUTH) || "";
const TUNNEL_AUTH_HEADER = TUNNEL_BASIC ? "Basic " + btoa(TUNNEL_BASIC) : "";
const TOKEN_KEY = "coin-casino-token";

// ---------- state ----------
const state = {
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: null,
  cfg: null,
};

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function fmtCoins(n) {
  return Number(n || 0).toLocaleString("ru-RU") + " 🪙";
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString("ru-RU");
}

function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function")
      node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

function toast(msg, kind = "") {
  const host = $("#toast-host");
  const t = el("div", { class: `toast ${kind}` }, msg);
  host.append(t);
  setTimeout(() => {
    t.style.transition = "opacity .2s, transform .2s";
    t.style.opacity = "0";
    t.style.transform = "translateY(-4px)";
    setTimeout(() => t.remove(), 220);
  }, 3200);
}

// ---------- API client ----------
async function api(path, opts = {}) {
  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type") && opts.body && !(opts.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (TUNNEL_AUTH_HEADER) {
    // Authorization is consumed by the tunnel; JWT goes in X-Auth-Token.
    headers.set("Authorization", TUNNEL_AUTH_HEADER);
    if (state.token) headers.set("X-Auth-Token", state.token);
  } else if (state.token) {
    headers.set("Authorization", `Bearer ${state.token}`);
  }
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers,
    body:
      opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)
        ? JSON.stringify(opts.body)
        : opts.body,
  });
  let data = null;
  if (res.status !== 204) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try { data = await res.json(); } catch (_) { data = null; }
    } else {
      data = await res.text();
    }
  }
  if (!res.ok) {
    const detail =
      (data && (data.detail || data.message)) ||
      (typeof data === "string" ? data : null) ||
      `HTTP ${res.status}`;
    throw new ApiError(typeof detail === "string" ? detail : JSON.stringify(detail), res.status, data);
  }
  return data;
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// ---------- auth ----------
function setToken(t) {
  state.token = t;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function refreshUser() {
  if (!state.token) {
    state.user = null;
    syncChrome();
    return null;
  }
  try {
    state.user = await api("/api/me");
  } catch (e) {
    if (e.status === 401 || e.status === 403) {
      setToken(null);
      state.user = null;
    }
  }
  syncChrome();
  return state.user;
}

function logout() {
  setToken(null);
  state.user = null;
  syncChrome();
  navigate("/login");
  toast("Вы вышли из аккаунта");
}

// ---------- chrome (header / nav) ----------
function syncChrome() {
  const isAuth = !!state.user;
  const isAdmin = isAuth && state.user.role === "admin";
  $$("[data-auth]").forEach((n) => (n.hidden = !isAuth));
  $$("[data-noauth]").forEach((n) => (n.hidden = isAuth));
  $$("[data-admin]").forEach((n) => (n.hidden = !isAdmin));

  if (isAuth) {
    $("#balance-amount").textContent = fmtNum(state.user.balance);
    $("#user-name").textContent = state.user.username;
  }
  // Highlight active link
  const path = location.hash.replace(/^#/, "") || "/";
  $$("[data-link]").forEach((a) => {
    const href = a.getAttribute("href").replace(/^#/, "");
    if (href === "/") {
      a.classList.toggle("active", path === "/" || path === "");
    } else {
      a.classList.toggle("active", path === href || path.startsWith(href + "/"));
    }
  });
}

// ---------- router ----------
const routes = [];
function route(pattern, handler, opts = {}) {
  const re = new RegExp(
    "^" +
      pattern.replace(/:[A-Za-z_]+/g, "([^/]+)").replace(/\//g, "\\/") +
      "$"
  );
  routes.push({ re, handler, opts, pattern });
}

async function dispatch() {
  const path = location.hash.replace(/^#/, "") || "/";
  $("#nav-mobile").classList.remove("open");
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) {
      // Auth gates
      if (r.opts.requireAuth && !state.user) {
        navigate(`/login?next=${encodeURIComponent(path)}`);
        return;
      }
      if (r.opts.requireAdmin && (!state.user || state.user.role !== "admin")) {
        navigate("/");
        toast("Доступ только для админов", "bad");
        return;
      }
      const root = $("#app");
      root.innerHTML = "";
      try {
        await r.handler(root, ...m.slice(1));
      } catch (e) {
        console.error(e);
        root.append(el("div", { class: "card" }, `Ошибка: ${e.message}`));
      }
      syncChrome();
      window.scrollTo({ top: 0 });
      return;
    }
  }
  $("#app").innerHTML = "<div class='card'>Страница не найдена</div>";
}

function navigate(path) {
  if (!path.startsWith("/")) path = "/" + path;
  location.hash = path;
}

window.addEventListener("hashchange", dispatch);

// ---------- pages ----------

// Landing / lobby
route("/", async (root) => {
  if (state.user) return renderLobby(root);
  root.append(landingView());
});

function landingView() {
  const wrap = el("div");
  wrap.append(
    el(
      "section",
      { class: "hero" },
      el("span", { class: "badge" }, "🎲 Игровая валюта · 18+"),
      el(
        "h1",
        {},
        "Получай джекпоты на ",
        el("span", { class: "grad-text" }, "виртуальные монеты")
      ),
      el(
        "p",
        { class: "lead" },
        "Слоты, coinflip и кости. Стартовые 1000 монет, ежедневные бонусы, квесты с наградами и таблица лидеров. Реальных денег нет — только удовольствие."
      ),
      el(
        "div",
        { class: "cta-row" },
        el("a", { class: "btn btn-primary", href: "#/register", "data-link": true }, "Создать аккаунт"),
        el("a", { class: "btn btn-ghost", href: "#/login", "data-link": true }, "Войти")
      )
    )
  );
  wrap.append(
    el(
      "section",
      { class: "section" },
      el("h2", { class: "h2" }, "Что внутри"),
      gameTilesGrid({ asLinks: false })
    )
  );
  wrap.append(
    el(
      "section",
      { class: "section grid g-3" },
      featureCard("🎁", "Стартовый бонус", "1000 монет сразу при регистрации, чтобы попробовать все игры."),
      featureCard("🗓️", "Ежедневный бонус", "Заходи раз в сутки и получай по 250 монет."),
      featureCard("🎯", "Квесты", "Сыграй, выиграй, поставь много — получи дополнительные монеты."),
      featureCard("🏆", "Топ игроков", "Поднимайся в рейтинге по балансу и общему выигрышу."),
      featureCard("🛡️", "Игровая валюта", "Никаких реальных денег и платежей — только in-game монеты."),
      featureCard("⚙️", "Качественная админка", "Управление пользователями, квестами, лог транзакций.")
    )
  );
  return wrap;
}

function featureCard(icon, title, text) {
  return el(
    "div",
    { class: "card hover-lift" },
    el("div", { style: "font-size:30px;margin-bottom:6px" }, icon),
    el("h3", { style: "margin:0 0 4px;font-size:18px" }, title),
    el("p", { class: "muted", style: "margin:0;font-size:14px" }, text)
  );
}

function gameTilesGrid({ asLinks }) {
  const items = [
    {
      icon: "🎰",
      title: "Slots Royale",
      text: "5×3, 5 линий, Wild ⭐ и Scatter 💰 с фриспинами ×2. До 2500× за линию.",
      href: "#/games/slots",
    },
    {
      icon: "🪙",
      title: "Coinflip",
      text: "Выбери орёл/решка. 1.95× за угаданный вариант.",
      href: "#/games/coinflip",
    },
    {
      icon: "🎲",
      title: "Кости",
      text: "Угадай число от 1 до 6. Награда 5.5× ставки.",
      href: "#/games/dice",
    },
  ];
  const grid = el("div", { class: "grid g-3" });
  for (const it of items) {
    const tile = el(
      "a",
      { class: "game-tile", href: asLinks === false ? "#" : it.href, "data-link": asLinks !== false ? "" : null },
      el("div", { class: "icon" }, it.icon),
      el("h3", {}, it.title),
      el("p", {}, it.text)
    );
    if (asLinks === false) {
      tile.addEventListener("click", (e) => {
        e.preventDefault();
        if (state.user) location.hash = it.href;
        else location.hash = "#/login";
      });
    }
    grid.append(tile);
  }
  return grid;
}

// Lobby (post-login home)
async function renderLobby(root) {
  root.append(
    el(
      "section",
      { class: "section" },
      el("div", { class: "h1" }, `Привет, ${state.user.username}! 👋`),
      el(
        "p",
        { class: "lead" },
        "Твой баланс: ",
        el("span", { class: "coins" }, fmtCoins(state.user.balance))
      ),
      el(
        "div",
        { class: "flex wrap" },
        el(
          "button",
          { class: "btn btn-primary", id: "claim-daily-btn", onclick: () => claimDaily() },
          "🎁 Забрать ежедневный бонус"
        ),
        el("a", { class: "btn btn-ghost", href: "#/games", "data-link": true }, "🎮 Играть"),
        el("a", { class: "btn btn-ghost", href: "#/quests", "data-link": true }, "🎯 Квесты"),
        el("a", { class: "btn btn-ghost", href: "#/leaderboard", "data-link": true }, "🏆 Топ")
      )
    )
  );
  root.append(
    el(
      "section",
      { class: "section" },
      el("h2", { class: "h2" }, "Игры"),
      gameTilesGrid({ asLinks: true })
    )
  );

  // Recent activity row
  const recentSection = el(
    "section",
    { class: "section grid g-2" },
    el(
      "div",
      { class: "card" },
      el("h3", { style: "margin-top:0" }, "Последние раунды"),
      el("div", { id: "recent-rounds" }, el("div", { class: "muted" }, "Загрузка…"))
    ),
    el(
      "div",
      { class: "card" },
      el("h3", { style: "margin-top:0" }, "Последние транзакции"),
      el("div", { id: "recent-txs" }, el("div", { class: "muted" }, "Загрузка…"))
    )
  );
  root.append(recentSection);
  loadRecentActivity();
}

async function loadRecentActivity() {
  try {
    const [rounds, txs] = await Promise.all([
      api("/api/me/rounds?limit=8"),
      api("/api/me/transactions?limit=8"),
    ]);
    const r = $("#recent-rounds");
    r.innerHTML = "";
    if (!rounds.length) r.append(el("div", { class: "muted" }, "Пока пусто."));
    for (const round of rounds) {
      r.append(
        el(
          "div",
          { class: "flex between", style: "padding:6px 0;border-bottom:1px solid var(--border);font-size:13.5px" },
          el(
            "div",
            {},
            el("strong", {}, gameLabel(round.game)),
            " ",
            el("span", { class: "muted" }, fmtDate(round.created_at))
          ),
          el(
            "div",
            { class: round.won ? "coins" : "muted" },
            round.won ? `+${fmtNum(round.payout - round.bet)}` : `−${fmtNum(round.bet)}`
          )
        )
      );
    }
    const t = $("#recent-txs");
    t.innerHTML = "";
    if (!txs.length) t.append(el("div", { class: "muted" }, "Пока пусто."));
    for (const tx of txs) {
      t.append(
        el(
          "div",
          { class: "flex between", style: "padding:6px 0;border-bottom:1px solid var(--border);font-size:13.5px" },
          el(
            "div",
            {},
            el("strong", {}, txTypeLabel(tx.type)),
            " ",
            el("span", { class: "muted" }, fmtDate(tx.created_at))
          ),
          el(
            "div",
            { class: tx.amount >= 0 ? "coins" : "muted" },
            (tx.amount >= 0 ? "+" : "") + fmtNum(tx.amount)
          )
        )
      );
    }
  } catch (e) {
    console.error(e);
  }
}

function gameLabel(g) {
  return { slots: "🎰 Слоты", coinflip: "🪙 Coinflip", dice: "🎲 Кости" }[g] || g;
}

function txTypeLabel(t) {
  return (
    {
      signup_bonus: "🎁 Стартовый бонус",
      daily_bonus: "🎁 Ежедневный бонус",
      quest_reward: "🎯 Награда за квест",
      slots_bet: "🎰 Ставка (слоты)",
      slots_win: "🎰 Выигрыш (слоты)",
      coinflip_bet: "🪙 Ставка (coinflip)",
      coinflip_win: "🪙 Выигрыш (coinflip)",
      dice_bet: "🎲 Ставка (кости)",
      dice_win: "🎲 Выигрыш (кости)",
      admin_grant: "⚙️ Начисление админом",
      admin_deduct: "⚙️ Списание админом",
      admin_set: "⚙️ Установка баланса",
    }[t] || t
  );
}

async function claimDaily() {
  const btn = $("#claim-daily-btn");
  if (btn) btn.disabled = true;
  try {
    const r = await api("/api/daily-bonus", { method: "POST" });
    if (r.granted) {
      toast(`+${fmtNum(r.amount)} 🪙 ежедневный бонус!`, "good");
    } else {
      const next = new Date(r.next_available_at);
      toast(`Уже забран. Следующий: ${fmtDate(next.toISOString())}`);
    }
    await refreshUser();
    if (location.hash === "#/" || location.hash === "" || location.hash === "#") {
      dispatch();
    }
  } catch (e) {
    toast(e.message, "bad");
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ---------- auth pages ----------
route("/login", (root) => {
  const card = el("div", { class: "card auth-card" });
  card.append(
    el("h2", {}, "Вход"),
    el("p", { class: "muted", style: "text-align:center;margin-top:0" }, "Введи логин и пароль")
  );
  const err = el("div", { class: "error-text", id: "auth-err" });
  const form = el("form", { id: "login-form" });
  form.append(
    field("Логин", "username", "text", { autocomplete: "username", required: true }),
    field("Пароль", "password", "password", { autocomplete: "current-password", required: true }),
    el("button", { class: "btn btn-primary", type: "submit", style: "width:100%;margin-top:6px" }, "Войти"),
    err
  );
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    const fd = new FormData(form);
    try {
      const r = await api("/api/auth/login", { method: "POST", body: fd });
      setToken(r.access_token);
      await refreshUser();
      const next = new URLSearchParams(location.hash.split("?")[1] || "").get("next") || "/";
      navigate(next);
      toast("Добро пожаловать!", "good");
    } catch (ex) {
      err.textContent = ex.message;
    }
  });
  card.append(form, el("div", { class: "auth-foot" }, "Нет аккаунта? ", el("a", { href: "#/register", "data-link": "" }, "Зарегистрируйся")));
  root.append(card);
});

route("/register", (root) => {
  const card = el("div", { class: "card auth-card" });
  card.append(el("h2", {}, "Регистрация"));
  const err = el("div", { class: "error-text", id: "reg-err" });
  const form = el("form", { id: "reg-form" });
  form.append(
    field("Логин (3-24 символа, буквы/цифры/_)", "username", "text", { required: true, minlength: 3, maxlength: 24, pattern: "[A-Za-z0-9_]+" }),
    field("Пароль (мин. 6 символов)", "password", "password", { required: true, minlength: 6, maxlength: 72, autocomplete: "new-password" }),
    el("button", { class: "btn btn-primary", type: "submit", style: "width:100%;margin-top:6px" }, "Создать аккаунт и получить 1000 🪙"),
    err
  );
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const r = await api("/api/auth/register", { method: "POST", body: data });
      setToken(r.access_token);
      await refreshUser();
      navigate("/");
      toast(`Добро пожаловать, ${data.username}! +${fmtNum(state.user.balance)} 🪙`, "good");
    } catch (ex) {
      err.textContent = ex.message;
    }
  });
  card.append(form, el("div", { class: "auth-foot" }, "Уже есть аккаунт? ", el("a", { href: "#/login", "data-link": "" }, "Войти")));
  root.append(card);
});

function field(label, name, type, attrs = {}) {
  const wrap = el("div", { class: "field" });
  wrap.append(
    el("label", { class: "label" }, label),
    el("input", Object.assign({ class: "input", name, type }, attrs))
  );
  return wrap;
}

// ---------- games ----------
route("/games", (root) => {
  if (!state.user) return navigate("/login?next=/games");
  root.append(
    el("section", { class: "section" }, el("h1", { class: "h1" }, "Игры"), el("p", { class: "lead" }, "Выбери игру и поставь монеты.")),
    gameTilesGrid({ asLinks: true })
  );
});

route("/games/slots", (root) => renderSlots(root), { requireAuth: true });
route("/games/coinflip", (root) => renderCoinflip(root), { requireAuth: true });
route("/games/dice", (root) => renderDice(root), { requireAuth: true });

// 5×3 slot machine — 5 paylines, wild ⭐, scatter 💰, free spins.
const SLOT_REELS = 5;
const SLOT_ROWS = 3;
const SLOT_SYMBOLS = ["🍒", "🍋", "🍊", "🔔", "💎", "7️⃣", "⭐", "💰"];
const SLOT_LINE_COLORS = ["#ffc83d", "#5cf2c4", "#ff7adb", "#74b6ff", "#ffae5c"];
const SLOT_PAYLINES = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
];
const SLOT_PAYTABLE = [
  { sym: "7️⃣", name: "Семёрка", x: { 3: 75, 4: 380, 5: 2500 } },
  { sym: "💎", name: "Бриллиант", x: { 3: 22, 4: 110, 5: 550 } },
  { sym: "⭐", name: "Wild — заменяет любой символ кроме 💰", x: { 3: 28, 4: 140, 5: 1100 } },
  { sym: "🔔", name: "Колокольчик", x: { 3: 7, 4: 35, 5: 220 } },
  { sym: "🍊", name: "Апельсин", x: { 3: 3.5, 4: 16, 5: 80 } },
  { sym: "🍋", name: "Лимон", x: { 3: 2.5, 4: 10, 5: 50 } },
  { sym: "🍒", name: "Вишня", x: { 3: 2, 4: 7, 5: 35 } },
  { sym: "💰", name: "Scatter — 3+ → бонус-фриспины", x: { 3: 5, 4: 20, 5: 100 } },
];

function renderSlots(root) {
  const cellsByPos = []; // [reelIdx][rowIdx] = <span> for highlighting
  const reelsContainer = el("div", { class: "reels" });
  for (let r = 0; r < SLOT_REELS; r++) {
    cellsByPos[r] = [];
    const reel = el("div", { class: "reel", "data-reel": String(r) });
    const strip = el("div", { class: "reel-strip" });
    // Pre-fill with random symbols; final ones get rendered after spin
    const startSyms = randomReelSymbols(SLOT_ROWS);
    for (let i = 0; i < SLOT_ROWS; i++) {
      const span = el("span", {}, startSyms[i]);
      strip.append(span);
      cellsByPos[r][i] = span;
    }
    reel.append(strip);
    reel._strip = strip;
    reel._currentSyms = startSyms.slice();
    reelsContainer.append(reel);
  }

  // Payline overlay (drawn over the reels once they land)
  const payNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(payNS, "svg");
  svg.setAttribute("class", "payline-svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");

  const board = el(
    "div",
    { class: "slots-board" },
    reelsContainer,
    el("div", { class: "fs-counter hidden", id: "fs-counter" }, "")
  );
  board.append(svg);
  board._svg = svg;
  board._cells = cellsByPos;

  const banner = el("div", { class: "slots-banner hidden", id: "slots-banner" }, "🎉 FREE SPINS!");

  const machine = el(
    "div",
    { class: "slots-machine" },
    el("h2", { class: "h2", style: "margin-top:0" }, "🎰 Slots Royale"),
    el(
      "p",
      { class: "muted", style: "margin:0 0 10px" },
      "5 барабанов × 3 ряда, 5 линий выплат. ⭐ Wild подставляется в линию, 💰 Scatter (3+) даёт фриспины с ×2 множителем."
    ),
    banner,
    board,
    paylineLegendEl(),
    el("div", { class: "win-line-list", id: "slots-line-list" }),
    el("div", { class: "slots-result", id: "slots-result" }, "")
  );

  const paytableToggle = el(
    "button",
    {
      type: "button",
      class: "btn btn-ghost",
      style: "margin-top:10px",
      onclick: () => {
        const pt = $("#slots-paytable");
        pt.style.display = pt.style.display === "none" ? "" : "none";
      },
    },
    "Таблица выплат"
  );
  const paytable = paytableEl();
  paytable.id = "slots-paytable";
  paytable.style.display = "none";

  const card = el(
    "div",
    { class: "card", style: "max-width:780px;margin:0 auto" },
    machine,
    betControls("slots"),
    paytableToggle,
    paytable
  );
  root.append(card);

  // Stash board on the router root and on #app so animateGame can find it.
  root._slotBoard = board;
  const app = $("#app");
  if (app) app._slotBoard = board;

  updateFreeSpinUI();
}

function randomReelSymbols(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
  return out;
}

function paylineLegendEl() {
  const legend = el("div", { class: "payline-legend", id: "slots-legend" });
  ["Линия 1: ━", "Линия 2: ━ ▲", "Линия 3: ━ ▼", "Линия 4: V", "Линия 5: ^"].forEach((label, i) => {
    legend.append(
      el(
        "span",
        { class: "pl-pill", "data-line": String(i), style: `color:${SLOT_LINE_COLORS[i]}` },
        el("span", { class: "pl-dot" }),
        label
      )
    );
  });
  return legend;
}

function paytableEl() {
  const wrap = el("div", { class: "slots-paytable" });
  for (const entry of SLOT_PAYTABLE) {
    const card = el("div", { class: "pt-card" });
    card.append(
      el(
        "div",
        { style: "display:flex;align-items:center;gap:8px;margin-bottom:4px" },
        el("span", { class: "sym" }, entry.sym),
        el("b", {}, entry.name)
      )
    );
    for (const k of [3, 4, 5]) {
      card.append(
        el(
          "div",
          { class: "row" },
          el("span", {}, `× ${k}`),
          el("b", {}, `${entry.x[k]}× линия`)
        )
      );
    }
    wrap.append(card);
  }
  return wrap;
}

function updateFreeSpinUI() {
  const u = state.user;
  const fsCounter = $("#fs-counter");
  const banner = $("#slots-banner");
  const playBtn = $("#play-btn");
  const betInput = $("#bet-input");
  if (!u) return;
  if (u.free_spins_remaining > 0) {
    if (fsCounter) {
      fsCounter.textContent = `🎁 Free spins: ${u.free_spins_remaining} (×2)`;
      fsCounter.classList.remove("hidden");
    }
    if (banner) banner.classList.remove("hidden");
    if (playBtn) playBtn.textContent = `🎰 FREE SPIN ×${u.free_spin_bet}`;
    if (betInput) betInput.disabled = true;
  } else {
    if (fsCounter) fsCounter.classList.add("hidden");
    if (banner) banner.classList.add("hidden");
    if (playBtn) playBtn.textContent = gameButtonLabel("slots");
    if (betInput) betInput.disabled = false;
  }
}

function spinReelTo(reelEl, finalSymbols, delayMs, durationMs) {
  return new Promise((resolve) => {
    const strip = reelEl._strip;
    const cellH = reelEl.firstElementChild.firstElementChild.offsetHeight || 76;
    const padding = 30; // extra symbols to spin past
    const symbolBuffer = [];
    for (let i = 0; i < padding; i++) {
      symbolBuffer.push(SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
    }
    // Build new strip: current symbols + buffer + final symbols.
    strip.innerHTML = "";
    const currentSyms = reelEl._currentSyms || randomReelSymbols(SLOT_ROWS);
    const allSyms = [...currentSyms, ...symbolBuffer, ...finalSymbols];
    for (const s of allSyms) strip.append(el("span", {}, s));
    // Total distance to translate so finalSymbols line up at the top.
    const distance = (allSyms.length - SLOT_ROWS) * cellH;

    setTimeout(() => {
      reelEl.classList.add("spinning");
      strip.style.transition = "none";
      strip.style.transform = "translateY(0)";
      // Force reflow so the next transition triggers correctly.
      void strip.offsetHeight;
      strip.style.transition = `transform ${durationMs}ms cubic-bezier(0.2, 0.85, 0.25, 1)`;
      strip.style.transform = `translateY(${-distance}px)`;
      const onEnd = () => {
        reelEl.classList.remove("spinning");
        strip.removeEventListener("transitionend", onEnd);
        // Snap: replace strip with just the final symbols at offset 0
        strip.style.transition = "none";
        strip.style.transform = "translateY(0)";
        strip.innerHTML = "";
        const cells = [];
        for (const s of finalSymbols) {
          const span = el("span", {}, s);
          strip.append(span);
          cells.push(span);
        }
        reelEl._currentSyms = finalSymbols.slice();
        // Update cell refs in cellsByPos (passed via closure caller below).
        resolve(cells);
      };
      strip.addEventListener("transitionend", onEnd);
    }, delayMs);
  });
}

async function animateSlotSpin(board, grid) {
  const reels = board.querySelectorAll(".reel");
  const tasks = [];
  for (let r = 0; r < SLOT_REELS; r++) {
    const reel = reels[r];
    const finalSyms = grid[r];
    tasks.push(
      spinReelTo(reel, finalSyms, r * 130, 850 + r * 90).then((cells) => {
        // Update board._cells refs
        board._cells[r] = cells;
      })
    );
  }
  // Clear previous highlights/lines while spinning.
  clearSlotHighlights(board);
  await Promise.all(tasks);
}

function clearSlotHighlights(board) {
  if (!board) return;
  board.querySelectorAll(".cell-glow").forEach((g) => g.remove());
  if (board._svg) {
    while (board._svg.firstChild) board._svg.removeChild(board._svg.firstChild);
  }
  document.querySelectorAll("#slots-legend .pl-pill").forEach((p) => p.classList.remove("active"));
}

function highlightSlotWins(board, details) {
  const lines = details.lines || [];
  const scatter = details.scatter;

  // Highlight cells per winning payline.
  for (const line of lines) {
    const color = SLOT_LINE_COLORS[line.line_index] || "#ffc83d";
    for (let r = 0; r < line.count; r++) {
      const row = line.rows[r];
      const cellSpan = board._cells[r][row];
      if (!cellSpan) continue;
      glowCell(board, r, row, color);
    }
    drawPayline(board, line.line_index, line.rows, line.count, color);
    const pill = document.querySelector(`#slots-legend [data-line="${line.line_index}"]`);
    if (pill) pill.classList.add("active");
  }

  // Highlight scatter cells in pink.
  if (scatter && scatter.positions) {
    for (const [r, row] of scatter.positions) {
      glowCell(board, r, row, "#ff7adb", true);
    }
  }
}

function glowCell(board, reelIdx, rowIdx, color, isScatter = false) {
  const reels = board.querySelectorAll(".reel");
  const reel = reels[reelIdx];
  if (!reel) return;
  const cellH = reel.firstElementChild.firstElementChild.offsetHeight || 76;
  const glow = el("div", { class: "cell-glow" + (isScatter ? " scatter" : "") });
  glow.style.position = "absolute";
  glow.style.left = "2px";
  glow.style.right = "2px";
  glow.style.top = `${rowIdx * cellH + 2}px`;
  glow.style.height = `${cellH - 4}px`;
  glow.style.borderRadius = "8px";
  glow.style.setProperty("--gold", color);
  glow.style.borderColor = color;
  glow.style.boxShadow = `0 0 14px 2px ${color}, inset 0 0 14px ${color}55`;
  reel.appendChild(glow);
}

function drawPayline(board, lineIndex, rows, count, color) {
  const svg = board._svg;
  if (!svg) return;
  const ns = "http://www.w3.org/2000/svg";
  const path = document.createElementNS(ns, "path");
  path.setAttribute("stroke", color);
  // Compute % positions: x along reel center, y along row center.
  // Reels are evenly spaced; with 5 reels the centers are at 10%, 30%, 50%, 70%, 90%.
  // Rows: 3 rows; centers at 16.66%, 50%, 83.33%.
  const xs = [10, 30, 50, 70, 90];
  const ysByRow = [16.66, 50, 83.33];
  let d = "";
  for (let r = 0; r < count; r++) {
    const x = xs[r];
    const y = ysByRow[rows[r]];
    d += (r === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2) + " ";
  }
  path.setAttribute("d", d.trim());
  path.style.color = color;
  svg.appendChild(path);
  // Trigger fade-in
  requestAnimationFrame(() => path.classList.add("show"));
}

function betControls(game, extras) {
  const controls = el("div", { style: "margin-top:14px" });
  const betInput = el("input", { class: "input", id: "bet-input", type: "number", min: "1", value: "50", style: "max-width:120px" });
  const playBtn = el("button", { class: "btn btn-primary", id: "play-btn" }, gameButtonLabel(game));
  const quick = el(
    "div",
    { class: "bet-quick" },
    ...[10, 50, 100, 500, 1000].map((v) =>
      el("button", { type: "button", onclick: () => (betInput.value = v) }, String(v))
    )
  );
  controls.append(
    el("div", { class: "label" }, "Ставка"),
    el("div", { class: "bet-row" }, betInput, quick, playBtn)
  );
  if (extras) controls.append(extras);
  controls.append(el("div", { id: "play-error", class: "error-text" }));

  playBtn.addEventListener("click", () => playGame(game, betInput));
  return controls;
}

function gameButtonLabel(game) {
  return game === "slots" ? "🎰 Крутить" : game === "coinflip" ? "🪙 Бросить" : "🎲 Бросить";
}

async function playGame(game, betInput) {
  const errEl = $("#play-error");
  errEl.textContent = "";
  const playBtn = $("#play-btn");
  const isFreeSpinSlots =
    game === "slots" && state.user && state.user.free_spins_remaining > 0;
  const bet = isFreeSpinSlots
    ? state.user.free_spin_bet
    : parseInt(betInput.value, 10);
  if (!isFreeSpinSlots) {
    if (!Number.isFinite(bet) || bet <= 0) {
      errEl.textContent = "Введи корректную ставку";
      return;
    }
    if (bet > state.user.balance) {
      errEl.textContent = "Недостаточно монет";
      return;
    }
  }
  playBtn.disabled = true;
  let body = { bet };
  if (game === "coinflip") {
    const sel = document.querySelector(".choice-row .selected");
    if (!sel) {
      errEl.textContent = "Выбери орёл или решка";
      playBtn.disabled = false;
      return;
    }
    body.side = sel.dataset.side;
  } else if (game === "dice") {
    const sel = document.querySelector(".dice-pick .selected");
    if (!sel) {
      errEl.textContent = "Выбери число 1-6";
      playBtn.disabled = false;
      return;
    }
    body.number = parseInt(sel.dataset.number, 10);
  }

  try {
    const result = await api(`/api/games/${game}`, { method: "POST", body });
    state.user.balance = result.new_balance;
    if (game === "slots" && result.details) {
      state.user.free_spins_remaining = result.details.free_spins_remaining ?? 0;
      state.user.free_spin_bet = result.details.free_spin_bet ?? 0;
    }
    syncChrome();
    await animateGame(game, result);
    showGameResult(game, result);
    if (game === "slots") updateFreeSpinUI();
  } catch (e) {
    errEl.textContent = e.message;
  } finally {
    playBtn.disabled = false;
  }
}

async function animateGame(game, result) {
  if (game === "slots") {
    const root = $("#app");
    const board = (root && root._slotBoard) || $(".slots-board");
    if (board) {
      await animateSlotSpin(board, result.details.grid);
      // Slight settle pause then highlight wins
      await delay(120);
      highlightSlotWins(board, result.details);
    }
  } else if (game === "coinflip") {
    const coin = $("#coin");
    coin.classList.remove("flipping");
    void coin.offsetWidth;
    coin.classList.add("flipping");
    await delay(1100);
    coin.textContent = result.details.landed === "heads" ? "О" : "Р";
  } else if (game === "dice") {
    const die = $("#die");
    die.classList.remove("rolling");
    void die.offsetWidth;
    die.classList.add("rolling");
    await delay(900);
    die.textContent = String(result.details.rolled);
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function showGameResult(game, result) {
  let text;
  if (result.won) {
    const profit = result.payout - result.bet;
    text = `🏆 Победа! +${fmtNum(profit)} 🪙 (выплата ${fmtNum(result.payout)})`;
    toast(`+${fmtNum(profit)} 🪙`, "good");
  } else {
    text = result.bet > 0
      ? `❌ Не повезло. −${fmtNum(result.bet)} 🪙`
      : "Без выигрыша";
  }
  if (game === "slots") {
    const r = $("#slots-result");
    if (r) {
      r.textContent = text;
      r.style.color = result.won ? "var(--good)" : "var(--muted)";
    }
    // Build per-line breakdown.
    const list = $("#slots-line-list");
    if (list) {
      list.innerHTML = "";
      const d = result.details || {};
      for (const line of d.lines || []) {
        const row = el(
          "div",
          { class: "line-row" },
          el(
            "span",
            {},
            `Линия ${line.line_index + 1} (${line.line_name}) — ${line.symbol} × ${line.count}`
          ),
          el("b", { style: "color:var(--good)" }, `+${fmtNum(line.payout)} 🪙`)
        );
        list.append(row);
      }
      if (d.scatter) {
        const sc = d.scatter;
        const row = el(
          "div",
          { class: "line-row scatter" },
          el(
            "span",
            {},
            `💰 Scatter × ${sc.count} → ${sc.multiplier}× ставки${sc.free_spins_awarded ? ` + ${sc.free_spins_awarded} фриспинов` : ""}`
          ),
          el(
            "b",
            { style: "color:#ff7adb" },
            `+${fmtNum(sc.payout)} 🪙`
          )
        );
        list.append(row);
      }
    }
    if (result.details && result.details.free_spins_awarded > 0) {
      toast(
        `🎉 +${result.details.free_spins_awarded} фриспинов с ×2 множителем!`,
        "good"
      );
    }
  } else if (game === "coinflip") {
    const r = $("#cf-result");
    if (r) {
      r.textContent = text;
      r.style.color = result.won ? "var(--good)" : "var(--muted)";
    }
  } else if (game === "dice") {
    const r = $("#dice-result");
    if (r) {
      r.textContent = text;
      r.style.color = result.won ? "var(--good)" : "var(--muted)";
    }
  }
}

function renderCoinflip(root) {
  const card = el("div", { class: "card", style: "max-width:520px;margin:0 auto;text-align:center" });
  card.append(
    el("h2", { class: "h2", style: "margin-top:0" }, "🪙 Coinflip"),
    el("p", { class: "muted", style: "margin:0 0 12px" }, "Угадай — получишь 1.95× ставки."),
    el("div", { id: "coin", class: "coin" }, "?"),
    el(
      "div",
      { class: "choice-row" },
      el("button", { class: "btn btn-ghost", "data-side": "heads", onclick: pickSide }, "Орёл"),
      el("button", { class: "btn btn-ghost", "data-side": "tails", onclick: pickSide }, "Решка")
    ),
    el("div", { class: "slots-result", id: "cf-result" }, ""),
    betControls("coinflip")
  );
  root.append(card);
}

function pickSide(e) {
  const btns = document.querySelectorAll(".choice-row .btn");
  btns.forEach((b) => b.classList.remove("selected"));
  e.currentTarget.classList.add("selected");
}

function renderDice(root) {
  const card = el("div", { class: "card", style: "max-width:520px;margin:0 auto;text-align:center" });
  const pickRow = el("div", { class: "dice-pick" });
  for (let i = 1; i <= 6; i++) {
    pickRow.append(
      el("button", { type: "button", "data-number": String(i), onclick: pickDice }, String(i))
    );
  }
  card.append(
    el("h2", { class: "h2", style: "margin-top:0" }, "🎲 Кости"),
    el("p", { class: "muted", style: "margin:0 0 12px" }, "Угадай число — выигрыш 5.5× ставки."),
    el("div", { id: "die", class: "die" }, "?"),
    el("div", { class: "label", style: "text-align:left" }, "Твоё число"),
    pickRow,
    el("div", { class: "slots-result", id: "dice-result" }, ""),
    betControls("dice")
  );
  root.append(card);
}

function pickDice(e) {
  document.querySelectorAll(".dice-pick button").forEach((b) => b.classList.remove("selected"));
  e.currentTarget.classList.add("selected");
}

// ---------- quests ----------
route("/quests", async (root) => {
  root.append(el("h1", { class: "h1" }, "Квесты"), el("p", { class: "lead" }, "Выполняй задания и забирай монеты."));
  const list = el("div", { class: "grid g-2" });
  list.append(skeletonCard(), skeletonCard(), skeletonCard());
  root.append(list);
  const items = await api("/api/quests");
  list.innerHTML = "";
  if (!items.length) {
    list.append(el("div", { class: "card muted" }, "Сейчас активных квестов нет."));
    return;
  }
  for (const it of items) list.append(renderQuestCard(it));
}, { requireAuth: true });

function renderQuestCard(item) {
  const q = item.quest;
  const progress = Math.min(100, Math.round((item.progress / q.target) * 100));
  const card = el("div", { class: "card" });
  const status = item.claimed
    ? el("span", { class: "tag good" }, "Получено")
    : item.completed
    ? el("span", { class: "tag warn" }, "Готово к получению")
    : el("span", { class: "tag info" }, "В процессе");
  card.append(
    el(
      "div",
      { class: "flex between" },
      el("h3", { style: "margin:0" }, q.title),
      status
    ),
    el("p", { class: "muted", style: "margin:6px 0 8px" }, q.description),
    el("div", { class: "flex between", style: "font-size:13px" },
      el("span", {}, `${fmtNum(item.progress)} / ${fmtNum(q.target)}`),
      el("span", { class: "coins" }, `+${fmtNum(q.reward)} 🪙`)
    ),
    el("div", { class: "progress" }, el("div", { class: "progress-fill", style: `width:${progress}%` })),
  );
  if (item.completed && !item.claimed) {
    const btn = el("button", { class: "btn btn-success", style: "margin-top:6px;width:100%" }, "Забрать награду");
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await api(`/api/quests/${q.id}/claim`, { method: "POST" });
        toast(`+${fmtNum(q.reward)} 🪙 за «${q.title}»`, "good");
        await refreshUser();
        dispatch();
      } catch (e) {
        toast(e.message, "bad");
        btn.disabled = false;
      }
    });
    card.append(btn);
  }
  return card;
}

function skeletonCard() {
  const c = el("div", { class: "card" });
  c.append(
    el("div", { class: "skeleton", style: "height:18px;width:60%;margin-bottom:8px" }),
    el("div", { class: "skeleton", style: "height:12px;width:90%;margin-bottom:6px" }),
    el("div", { class: "skeleton", style: "height:8px;width:100%;margin:10px 0" }),
    el("div", { class: "skeleton", style: "height:32px;width:100%" })
  );
  return c;
}

// ---------- leaderboard ----------
route("/leaderboard", async (root) => {
  root.append(el("h1", { class: "h1" }, "🏆 Топ игроков"), el("p", { class: "lead" }, "Лучшие по балансу. Заработай больше монет — поднимешься выше."));
  const card = el("div", { class: "card", style: "padding:0" });
  card.append(
    el(
      "div",
      { class: "lb-row", style: "background:var(--surface-strong);font-weight:600;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.05em" },
      el("div", {}, "#"),
      el("div", {}, "Игрок"),
      el("div", {}, "Баланс"),
      el("div", { class: "lb-extra" }, "Лучший выигрыш")
    )
  );
  const list = await api("/api/leaderboard?limit=20");
  if (!list.length) {
    card.append(el("div", { class: "lb-row" }, el("div", { class: "muted" }, "Пока пусто.")));
  }
  for (const row of list) {
    const rankClass = row.rank === 1 ? "gold" : row.rank === 2 ? "silver" : row.rank === 3 ? "bronze" : "";
    card.append(
      el(
        "div",
        { class: "lb-row" },
        el("div", { class: `lb-rank ${rankClass}` }, row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : "#" + row.rank),
        el("div", {}, row.username),
        el("div", { class: "coins" }, fmtNum(row.balance) + " 🪙"),
        el("div", { class: "lb-extra muted" }, fmtNum(row.biggest_win))
      )
    );
  }
  root.append(card);
});

// ---------- profile ----------
route("/profile", async (root) => {
  const u = state.user;
  root.append(el("h1", { class: "h1" }, "Профиль"));
  root.append(
    el(
      "section",
      { class: "section grid g-3" },
      statTile("Баланс", fmtNum(u.balance), true),
      statTile("Сыграно раундов", fmtNum(u.total_games_played)),
      statTile("Победы", fmtNum(u.total_games_won)),
      statTile("Поставлено", fmtNum(u.total_bet)),
      statTile("Всего выиграно", fmtNum(u.total_won)),
      statTile("Лучший выигрыш", fmtNum(u.biggest_win))
    )
  );

  const grid = el("section", { class: "section grid g-2" });
  grid.append(
    el("div", { class: "card" }, el("h2", { class: "h2" }, "История раундов"), el("div", { id: "p-rounds" })),
    el("div", { class: "card" }, el("h2", { class: "h2" }, "Транзакции"), el("div", { id: "p-txs" }))
  );
  root.append(grid);

  const [rounds, txs] = await Promise.all([
    api("/api/me/rounds?limit=30"),
    api("/api/me/transactions?limit=30"),
  ]);
  const rEl = $("#p-rounds");
  if (!rounds.length) rEl.append(el("div", { class: "muted" }, "Пока пусто."));
  for (const r of rounds) {
    rEl.append(
      el(
        "div",
        { class: "flex between", style: "padding:8px 0;border-bottom:1px solid var(--border);font-size:14px" },
        el(
          "div",
          {},
          el("strong", {}, gameLabel(r.game)),
          " ",
          el("span", { class: "muted" }, fmtDate(r.created_at))
        ),
        el(
          "div",
          { class: r.won ? "coins" : "muted" },
          r.won ? `+${fmtNum(r.payout - r.bet)}` : `−${fmtNum(r.bet)}`
        )
      )
    );
  }
  const tEl = $("#p-txs");
  if (!txs.length) tEl.append(el("div", { class: "muted" }, "Пока пусто."));
  for (const t of txs) {
    tEl.append(
      el(
        "div",
        { class: "flex between", style: "padding:8px 0;border-bottom:1px solid var(--border);font-size:14px" },
        el("div", {}, el("strong", {}, txTypeLabel(t.type)), " ", el("span", { class: "muted" }, fmtDate(t.created_at))),
        el(
          "div",
          { class: t.amount >= 0 ? "coins" : "muted" },
          (t.amount >= 0 ? "+" : "") + fmtNum(t.amount)
        )
      )
    );
  }
}, { requireAuth: true });

function statTile(label, value, accent) {
  return el(
    "div",
    { class: "admin-tile" + (accent ? " accent" : "") },
    el("div", { class: "lbl" }, label),
    el("div", { class: "val" }, value)
  );
}

// ---------- admin ----------
route("/admin", (root) => renderAdmin(root, "stats"), { requireAdmin: true });
route("/admin/users", (root) => renderAdmin(root, "users"), { requireAdmin: true });
route("/admin/quests", (root) => renderAdmin(root, "quests"), { requireAdmin: true });
route("/admin/transactions", (root) => renderAdmin(root, "transactions"), { requireAdmin: true });
route("/admin/rounds", (root) => renderAdmin(root, "rounds"), { requireAdmin: true });

async function renderAdmin(root, tab) {
  root.append(el("h1", { class: "h1" }, "⚙️ Админ-панель"));
  const tabs = el(
    "div",
    { class: "admin-tabs" },
    adminTab("stats", "Обзор", tab),
    adminTab("users", "Пользователи", tab),
    adminTab("quests", "Квесты", tab),
    adminTab("transactions", "Транзакции", tab),
    adminTab("rounds", "Раунды", tab)
  );
  root.append(tabs);
  const body = el("div", { id: "admin-body" });
  root.append(body);
  if (tab === "stats") return renderAdminStats(body);
  if (tab === "users") return renderAdminUsers(body);
  if (tab === "quests") return renderAdminQuests(body);
  if (tab === "transactions") return renderAdminTransactions(body);
  if (tab === "rounds") return renderAdminRounds(body);
}

function adminTab(key, label, current) {
  return el(
    "button",
    {
      class: current === key ? "active" : "",
      onclick: () => navigate(key === "stats" ? "/admin" : `/admin/${key}`),
    },
    label
  );
}

async function renderAdminStats(root) {
  root.append(el("div", { class: "muted" }, "Загрузка…"));
  const stats = await api("/api/admin/stats");
  root.innerHTML = "";
  const grid = el("div", { class: "admin-grid" });
  const tiles = [
    ["Всего пользователей", stats.total_users, true],
    ["Админов", stats.total_admins],
    ["Забанено", stats.banned_users],
    ["Новых за 24ч", stats.new_users_24h],
    ["Монет в обороте", stats.coins_in_circulation, true],
    ["Сыграно раундов", stats.total_rounds],
    ["Всего ставок", stats.total_bet],
    ["Всего выплат", stats.total_payout],
    ["Прибыль казино", stats.house_balance, true],
    ["Активных квестов", stats.active_quests],
  ];
  for (const [lbl, val, accent] of tiles) {
    grid.append(
      el(
        "div",
        { class: "admin-tile" + (accent ? " accent" : "") },
        el("div", { class: "lbl" }, lbl),
        el("div", { class: "val" }, fmtNum(val))
      )
    );
  }
  root.append(grid);
}

async function renderAdminUsers(root) {
  const search = el("input", {
    class: "input",
    type: "search",
    placeholder: "Поиск по логину…",
    style: "max-width:280px;margin-bottom:12px",
  });
  root.append(el("div", { class: "flex" }, search));
  const tableWrap = el("div", { class: "table-wrap" });
  const refresh = async () => {
    tableWrap.innerHTML = "";
    const q = search.value.trim();
    const users = await api(`/api/admin/users?limit=200${q ? `&q=${encodeURIComponent(q)}` : ""}`);
    const table = el("table", { class: "table" });
    table.append(
      el(
        "thead",
        {},
        el(
          "tr",
          {},
          el("th", {}, "ID"),
          el("th", {}, "Логин"),
          el("th", {}, "Роль"),
          el("th", { class: "right" }, "Баланс"),
          el("th", { class: "right" }, "Игр"),
          el("th", { class: "right" }, "Побед"),
          el("th", {}, "Статус"),
          el("th", {}, "Создан"),
          el("th", {}, "")
        )
      )
    );
    const tbody = el("tbody");
    for (const u of users) {
      tbody.append(
        el(
          "tr",
          {},
          el("td", { class: "mono muted" }, "#" + u.id),
          el("td", {}, u.username),
          el("td", {}, u.role === "admin" ? el("span", { class: "tag warn" }, "admin") : "user"),
          el("td", { class: "right coins" }, fmtNum(u.balance)),
          el("td", { class: "right" }, fmtNum(u.total_games_played)),
          el("td", { class: "right" }, fmtNum(u.total_games_won)),
          el(
            "td",
            {},
            u.banned ? el("span", { class: "tag bad" }, "banned") : el("span", { class: "tag good" }, "active")
          ),
          el("td", { class: "muted" }, fmtDate(u.created_at)),
          el(
            "td",
            { class: "right" },
            el("button", { class: "btn btn-ghost", style: "padding:6px 10px;font-size:12px", onclick: () => openUserModal(u, refresh) }, "Управлять")
          )
        )
      );
    }
    table.append(tbody);
    tableWrap.append(table);
  };
  search.addEventListener("input", () => {
    clearTimeout(search._t);
    search._t = setTimeout(refresh, 250);
  });
  root.append(tableWrap);
  await refresh();
}

function openUserModal(u, onChanged) {
  const bg = el("div", { class: "modal-bg" });
  bg.addEventListener("click", (e) => {
    if (e.target === bg) bg.remove();
  });
  const close = () => bg.remove();
  const err = el("div", { class: "error-text" });
  const ok = el("div", { class: "success-text" });

  const balanceDelta = el("input", { class: "input", type: "number", value: "0" });
  const setBalance = el("input", { class: "input", type: "number", value: String(u.balance) });
  const reasonInput = el("input", { class: "input", type: "text", placeholder: "Причина (опц.)" });

  async function patch(payload) {
    err.textContent = "";
    ok.textContent = "";
    try {
      const updated = await api(`/api/admin/users/${u.id}`, { method: "PATCH", body: { ...payload, reason: reasonInput.value } });
      Object.assign(u, updated);
      ok.textContent = "Обновлено";
      onChanged && onChanged();
      if (state.user && state.user.id === u.id) await refreshUser();
    } catch (e) {
      err.textContent = e.message;
    }
  }

  const modal = el(
    "div",
    { class: "modal" },
    el("h3", {}, `Пользователь: ${u.username}`),
    el("div", { class: "muted", style: "margin-bottom:10px;font-size:13px" }, `ID #${u.id} · ${u.role} · баланс ${fmtNum(u.balance)} 🪙`),
    el("div", { class: "field" }, el("label", { class: "label" }, "Изменить баланс на (+/−)"), balanceDelta),
    el(
      "div",
      { class: "flex", style: "margin-bottom:10px" },
      el("button", { class: "btn btn-success", onclick: () => patch({ balance_delta: parseInt(balanceDelta.value, 10) || 0 }) }, "Применить"),
      el("button", { class: "btn btn-ghost", onclick: () => (balanceDelta.value = 1000) }, "+1000"),
      el("button", { class: "btn btn-ghost", onclick: () => (balanceDelta.value = -1000) }, "−1000")
    ),
    el("div", { class: "field" }, el("label", { class: "label" }, "Установить баланс ровно"), setBalance),
    el("div", { class: "flex", style: "margin-bottom:10px" }, el("button", { class: "btn btn-ghost", onclick: () => patch({ set_balance: parseInt(setBalance.value, 10) || 0 }) }, "Установить")),
    el("div", { class: "field" }, el("label", { class: "label" }, "Роль"),
      el("div", { class: "flex" },
        el("button", { class: "btn btn-ghost", onclick: () => patch({ role: "admin" }) }, "Сделать админом"),
        el("button", { class: "btn btn-ghost", onclick: () => patch({ role: "user" }) }, "Снять админку")
      )
    ),
    el("div", { class: "field" }, el("label", { class: "label" }, "Бан"),
      el("div", { class: "flex" },
        el("button", { class: "btn btn-danger", onclick: () => patch({ banned: true }) }, "Забанить"),
        el("button", { class: "btn btn-success", onclick: () => patch({ banned: false }) }, "Разбанить")
      )
    ),
    el("div", { class: "field" }, reasonInput),
    el("div", { class: "field" }, el("button", { class: "btn btn-danger", onclick: async () => {
      if (!confirm(`Удалить ${u.username}? Это действие необратимо.`)) return;
      try {
        await api(`/api/admin/users/${u.id}`, { method: "DELETE" });
        toast("Пользователь удалён", "good");
        close();
        onChanged && onChanged();
      } catch (e) { err.textContent = e.message; }
    } }, "Удалить аккаунт")),
    err,
    ok,
    el("div", { class: "flex", style: "justify-content:flex-end;margin-top:10px" }, el("button", { class: "btn btn-ghost", onclick: close }, "Закрыть"))
  );
  bg.append(modal);
  document.body.append(bg);
}

async function renderAdminQuests(root) {
  const tableWrap = el("div", { class: "table-wrap" });
  const headerRow = el(
    "div",
    { class: "flex between", style: "margin-bottom:12px" },
    el("div", { class: "muted" }, "Создавай и редактируй квесты для игроков."),
    el("button", { class: "btn btn-primary", onclick: () => openQuestModal(null, refresh) }, "+ Новый квест")
  );
  root.append(headerRow, tableWrap);

  async function refresh() {
    tableWrap.innerHTML = "";
    const list = await api("/api/admin/quests");
    const table = el("table", { class: "table" });
    table.append(
      el("thead", {}, el("tr", {},
        el("th", {}, "ID"),
        el("th", {}, "Код"),
        el("th", {}, "Название"),
        el("th", {}, "Тип"),
        el("th", { class: "right" }, "Цель"),
        el("th", { class: "right" }, "Награда"),
        el("th", {}, "Статус"),
        el("th", {}, "")
      ))
    );
    const tbody = el("tbody");
    for (const q of list) {
      tbody.append(el("tr", {},
        el("td", { class: "mono muted" }, "#" + q.id),
        el("td", { class: "mono" }, q.code),
        el("td", {}, q.title),
        el("td", { class: "muted" }, q.type),
        el("td", { class: "right" }, fmtNum(q.target)),
        el("td", { class: "right coins" }, fmtNum(q.reward)),
        el("td", {}, q.active ? el("span", { class: "tag good" }, "active") : el("span", { class: "tag" }, "off")),
        el("td", { class: "right" },
          el("div", { class: "flex" },
            el("button", { class: "btn btn-ghost", style: "padding:6px 10px;font-size:12px", onclick: () => openQuestModal(q, refresh) }, "Изменить"),
            el("button", { class: "btn btn-danger", style: "padding:6px 10px;font-size:12px", onclick: async () => {
              if (!confirm(`Удалить квест «${q.title}»?`)) return;
              try { await api(`/api/admin/quests/${q.id}`, { method: "DELETE" }); toast("Удалён"); refresh(); }
              catch (e) { toast(e.message, "bad"); }
            } }, "×")
          )
        )
      ));
    }
    table.append(tbody);
    tableWrap.append(table);
  }
  await refresh();
}

function openQuestModal(quest, onChanged) {
  const bg = el("div", { class: "modal-bg" });
  bg.addEventListener("click", (e) => {
    if (e.target === bg) bg.remove();
  });
  const err = el("div", { class: "error-text" });
  const form = el("form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.target = parseInt(data.target, 10);
    data.reward = parseInt(data.reward, 10);
    data.active = form.elements.active.checked;
    data.repeatable = form.elements.repeatable.checked;
    try {
      if (quest) await api(`/api/admin/quests/${quest.id}`, { method: "PUT", body: data });
      else await api("/api/admin/quests", { method: "POST", body: data });
      toast("Сохранено", "good");
      bg.remove();
      onChanged && onChanged();
    } catch (ex) { err.textContent = ex.message; }
  });
  form.append(
    field("Код (a-z0-9_)", "code", "text", { value: quest?.code || "", required: true, pattern: "[a-z0-9_]+" }),
    field("Название", "title", "text", { value: quest?.title || "", required: true }),
    el("div", { class: "field" },
      el("label", { class: "label" }, "Описание"),
      el("textarea", { class: "input textarea", name: "description", rows: "2" }, quest?.description || "")
    ),
    el("div", { class: "field" },
      el("label", { class: "label" }, "Тип"),
      (function(){
        const sel = el("select", { class: "input", name: "type" });
        for (const [v, lbl] of [
          ["play_count","Сыграть N раундов"],
          ["win_count","Выиграть N раундов"],
          ["earn_amount","Заработать всего N монет"],
          ["spend_amount","Поставить всего N монет"],
          ["biggest_win","Самый крупный выигрыш ≥ N"],
        ]) {
          const o = el("option", { value: v }, lbl);
          if (quest?.type === v) o.selected = true;
          sel.append(o);
        }
        return sel;
      })()
    ),
    field("Цель", "target", "number", { value: quest?.target ?? "10", required: true, min: "1" }),
    field("Награда (🪙)", "reward", "number", { value: quest?.reward ?? "100", required: true, min: "0" }),
    el("div", { class: "field flex" },
      el("label", { class: "muted", style: "display:flex;gap:6px;align-items:center" },
        el("input", { type: "checkbox", name: "active", checked: quest ? quest.active : true }), "Активен"),
      el("label", { class: "muted", style: "display:flex;gap:6px;align-items:center" },
        el("input", { type: "checkbox", name: "repeatable", checked: quest ? quest.repeatable : false }), "Повторяемый")
    ),
    err,
    el("div", { class: "flex", style: "justify-content:flex-end;gap:8px;margin-top:10px" },
      el("button", { class: "btn btn-ghost", type: "button", onclick: () => bg.remove() }, "Отмена"),
      el("button", { class: "btn btn-primary", type: "submit" }, quest ? "Сохранить" : "Создать")
    )
  );
  const modal = el("div", { class: "modal" }, el("h3", {}, quest ? "Редактирование квеста" : "Новый квест"), form);
  bg.append(modal);
  document.body.append(bg);
}

async function renderAdminTransactions(root) {
  const list = await api("/api/admin/transactions?limit=200");
  const table = el("table", { class: "table" });
  table.append(el("thead", {}, el("tr", {},
    el("th", {}, "Дата"),
    el("th", {}, "User"),
    el("th", {}, "Тип"),
    el("th", { class: "right" }, "Сумма"),
    el("th", { class: "right" }, "Баланс после"),
    el("th", {}, "Описание")
  )));
  const tbody = el("tbody");
  for (const t of list) {
    tbody.append(el("tr", {},
      el("td", { class: "muted" }, fmtDate(t.created_at)),
      el("td", { class: "mono" }, "#" + t.id),
      el("td", {}, txTypeLabel(t.type)),
      el("td", { class: "right " + (t.amount >= 0 ? "coins" : "") }, (t.amount >= 0 ? "+" : "") + fmtNum(t.amount)),
      el("td", { class: "right" }, fmtNum(t.balance_after)),
      el("td", { class: "muted" }, t.description || "—")
    ));
  }
  table.append(tbody);
  root.append(el("div", { class: "table-wrap" }, table));
}

async function renderAdminRounds(root) {
  const list = await api("/api/admin/rounds?limit=200");
  const table = el("table", { class: "table" });
  table.append(el("thead", {}, el("tr", {},
    el("th", {}, "Дата"),
    el("th", {}, "Игра"),
    el("th", { class: "right" }, "Ставка"),
    el("th", { class: "right" }, "Выплата"),
    el("th", {}, "Результат"),
    el("th", {}, "Детали")
  )));
  const tbody = el("tbody");
  for (const r of list) {
    let details = "";
    try { details = JSON.stringify(JSON.parse(r.details)); } catch (_) { details = r.details || ""; }
    tbody.append(el("tr", {},
      el("td", { class: "muted" }, fmtDate(r.created_at)),
      el("td", {}, gameLabel(r.game)),
      el("td", { class: "right" }, fmtNum(r.bet)),
      el("td", { class: "right " + (r.won ? "coins" : "") }, fmtNum(r.payout)),
      el("td", {}, r.won ? el("span", { class: "tag good" }, "win") : el("span", { class: "tag bad" }, "loss")),
      el("td", { class: "mono muted", style: "font-size:12px" }, details)
    ));
  }
  table.append(tbody);
  root.append(el("div", { class: "table-wrap" }, table));
}

// ---------- bootstrap ----------
document.addEventListener("DOMContentLoaded", async () => {
  $("#year").textContent = String(new Date().getFullYear());
  $("#logout-btn")?.addEventListener("click", logout);
  $("#hamburger")?.addEventListener("click", () => $("#nav-mobile").classList.toggle("open"));
  // Intercept nav clicks to also close mobile menu (handled by hashchange already)
  // Fetch public config (non-blocking)
  api("/api/config").then((c) => (state.cfg = c)).catch(() => {});
  await refreshUser();
  if (!location.hash) location.hash = "#/";
  dispatch();
});
