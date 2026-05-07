// ============================
// Constants & Storage
// ============================
const CAST_LIST_KEY = "gift_cast_names";
const SESSION_KEY = "gift_table_sessions_v2";

function loadCastList() {
  try { return JSON.parse(localStorage.getItem(CAST_LIST_KEY) || "[]"); } catch { return []; }
}
function saveCastList(arr) {
  localStorage.setItem(CAST_LIST_KEY, JSON.stringify(arr));
}
function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "{}"); } catch { return {}; }
}
function saveSessions(obj) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(obj));
}

function genUkey() {
  return "L" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

// ============================
// State
// ============================
const state = {
  cart: [],
  currentCategory: "table",
  orders: JSON.parse(localStorage.getItem("gift_orders") || "[]"),
  orderCounter: parseInt(localStorage.getItem("gift_order_counter") || "0"),
  receivedAmount: "",
  paymentMethod: "cash",
  scEnabled: true,
  customIdCounter: 9000,
  tableNumber: null,
  customerType: null,
  source: null,
  catchName: null,
  catchNames: [],
  cast: null,
  castsArr: [],
  guestCount: 0,
  checkinTime: null,
  pendingTableNumber: null,
  pendingType: null,
  pendingSource: null,
  pendingCatchName: null,
  pendingCatchNames: [],
  pendingRepeatCasts: [],
  confirmItem: null,
  confirmQty: 1,
  pendingAddItem: null,
  pendingAddQty: 1,
};

const fmt = (n) => (n < 0 ? "−¥" + Math.abs(n).toLocaleString() : "¥" + n.toLocaleString());
const pz = (n) => n.toString().padStart(2, "0");
const fmtTime = (d) => `${pz(d.getHours())}:${pz(d.getMinutes())}`;
const fmtDT = (s) => { const d = new Date(s); return `${d.getMonth() + 1}/${d.getDate()} ${fmtTime(d)}`; };

function getCartSubtotal() {
  return state.cart.reduce((s, i) => s + i.price * i.qty, 0);
}
function getTaxableSubtotal() {
  return state.cart.reduce((s, i) => s + (i.isTaxFree ? 0 : i.price * i.qty), 0);
}
function getCartSC() {
  const s = getTaxableSubtotal();
  return state.scEnabled && s > 0 ? Math.floor(s * 0.15) : 0;
}
function getCartTax() {
  const taxable = getTaxableSubtotal() + getCartSC();
  return taxable > 0 ? Math.floor(taxable * 0.1) : 0;
}
function getCartCardFee() {
  if (state.paymentMethod !== "card") return 0;
  const b = getCartSubtotal() + getCartSC() + getCartTax();
  return b > 0 ? Math.floor(b * 0.08) : 0;
}
function roundUpTo100(n) {
  return n % 100 === 0 ? n : Math.ceil(n / 100) * 100;
}
function getCartTotal() {
  const raw = Math.max(0, getCartSubtotal() + getCartSC() + getCartTax() + getCartCardFee());
  if (state.paymentMethod === "cash" && raw >= 10) return roundUpTo100(raw);
  return raw;
}

function saveOrders() {
  localStorage.setItem("gift_orders", JSON.stringify(state.orders));
  localStorage.setItem("gift_order_counter", state.orderCounter.toString());
}

const methodLabel = { cash: "💴 現金", card: "💳 カード", qr: "📱 QR決済" };
const getML = (m) => methodLabel[m] || m;

function getBusinessDate(s) {
  const d = s ? new Date(s) : new Date();
  if (d.getHours() < 20) d.setDate(d.getDate() - 1);
  return d.toDateString();
}
function getBusinessMonth(s) {
  const d = s ? new Date(s) : new Date();
  if (d.getDate() === 1 && d.getHours() < 20) d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${pz(d.getMonth() + 1)}`;
}

// ============================
// Session snapshot (卓ごと)
// ============================
function snapshotSession() {
  return {
    customerType: state.customerType,
    source: state.source,
    catchName: state.catchName,
    catchNames: [...state.catchNames],
    cast: state.cast,
    castsArr: [...state.castsArr],
    guestCount: state.guestCount,
    checkinTime: state.checkinTime,
    cart: state.cart.map((i) => ({ ...i })),
    scEnabled: state.scEnabled,
  };
}

function applySession(s) {
  state.customerType = s.customerType || null;
  state.source = s.source || null;
  state.catchName = s.catchName || null;
  state.catchNames = Array.isArray(s.catchNames) ? [...s.catchNames] : (s.catchName ? [s.catchName] : []);
  state.cast = s.cast || null;
  state.castsArr = Array.isArray(s.castsArr) ? [...s.castsArr] : (s.cast ? s.cast.split("・") : []);
  state.guestCount = s.guestCount || 0;
  state.checkinTime = s.checkinTime || null;
  state.cart = Array.isArray(s.cart)
    ? s.cart.map((i) => ({ ...i, ukey: i.ukey || genUkey() }))
    : [];
  state.scEnabled = s.scEnabled !== false;
  document.getElementById("sc-checkbox").checked = state.scEnabled;
}

function saveSessionForTable(tableNum) {
  if (!tableNum) return;
  const all = loadSessions();
  all[String(tableNum)] = snapshotSession();
  saveSessions(all);
}

function clearSessionForTable(tableNum) {
  if (!tableNum) return;
  const all = loadSessions();
  delete all[String(tableNum)];
  saveSessions(all);
}

function loadSessionForTable(tableNum) {
  const all = loadSessions();
  return all[String(tableNum)] || null;
}

// ============================
// Scroll Lock
// ============================
function lockScroll() {
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  document.body.style.top = `-${window.scrollY}px`;
}
function unlockScroll() {
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
  document.body.style.top = "";
  window.scrollTo(0, 0);
}

// ============================
// Clock
// ============================
function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent = `${now.getFullYear()}/${pz(now.getMonth() + 1)}/${pz(now.getDate())} ${fmtTime(now)}`;
}
setInterval(updateClock, 1000);
updateClock();

// ============================
// Navigation
// ============================
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const v = btn.dataset.view;
    document.querySelectorAll(".main-content").forEach((el) => el.classList.add("hidden"));
    document.getElementById(`view-${v}`).classList.remove("hidden");
    if (v === "history") renderHistory();
    if (v === "summary") renderSummary();
    if (v === "cast") renderCastPage();
  });
});

document.getElementById("sc-checkbox").addEventListener("change", (e) => {
  state.scEnabled = e.target.checked;
  renderCart();
});

// ============================
// Cast management page
// ============================
function renderCastPage() {
  const list = loadCastList();
  const el = document.getElementById("cast-list");
  if (list.length === 0) {
    el.innerHTML = '<div class="empty-state">まだ登録がありません</div>';
    return;
  }
  el.innerHTML = list
    .map(
      (name, idx) =>
        `<div class="cast-list-item"><span class="cast-list-name">${escapeHtml(name)}</span><button class="btn-cast-del" data-idx="${idx}">削除</button></div>`
    )
    .join("");
  el.querySelectorAll(".btn-cast-del").forEach((b) => {
    b.addEventListener("click", () => {
      const idx = parseInt(b.dataset.idx, 10);
      const n = list[idx];
      if (n && confirm(`「${n}」を削除しますか？`)) {
        saveCastList(list.filter((_, i) => i !== idx));
        renderCastPage();
      }
    });
  });
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}

document.getElementById("btn-cast-add").addEventListener("click", () => {
  const inp = document.getElementById("cast-new-name");
  const name = inp.value.trim();
  if (!name) return;
  const list = loadCastList();
  if (list.includes(name)) {
    alert("すでに登録されています");
    return;
  }
  list.push(name);
  list.sort((a, b) => a.localeCompare(b, "ja"));
  saveCastList(list);
  inp.value = "";
  renderCastPage();
});

// ============================
// Categories & Menu
// ============================
function renderCategories() {
  const c = document.getElementById("category-tabs");
  c.innerHTML = MENU_DATA.categories
    .map(
      (cat) =>
        `<button class="category-tab ${cat.id === state.currentCategory ? "active" : ""}" data-category="${cat.id}">${cat.emoji} ${cat.name}</button>`
    )
    .join("");
  c.querySelectorAll(".category-tab").forEach((t) => {
    t.addEventListener("click", () => {
      state.currentCategory = t.dataset.category;
      renderCategories();
      renderMenu();
    });
  });
}

function renderMenu() {
  const c = document.getElementById("menu-grid");

  if (state.currentCategory === "table") {
    let h = "";
    for (let i = 1; i <= 12; i++) {
      const active = state.tableNumber === i;
      let sess = null;
      if (active && state.checkinTime) {
        sess = {
          checkinTime: state.checkinTime,
          cast: state.cast,
          customerType: state.customerType,
          guestCount: state.guestCount,
        };
      } else if (!active) {
        const s = loadSessionForTable(i);
        if (s && s.checkinTime) sess = s;
      }
      let info = "";
      if (sess) {
        const t = new Date(sess.checkinTime);
        info = `${pz(t.getHours())}:${pz(t.getMinutes())}〜`;
        if (sess.cast) info += ` / ${sess.cast}`;
        else if (sess.customerType === "new") info += ` / 新規`;
        if (sess.guestCount > 0) info += ` / ${sess.guestCount}名`;
      }
      const priceLabel = active ? "✓ 選択中" : sess ? "進行中" : "選択";
      h += `<button class="menu-item table-btn ${active ? "table-active" : ""} ${sess && !active ? "table-has-session" : ""}" data-table="${i}">
        <span class="emoji">🪑</span><span class="name">卓 ${i}</span><span class="price">${priceLabel}</span>
        ${info ? `<span class="table-info">${escapeHtml(info)}</span>` : ""}</button>`;
    }
    c.innerHTML = h;
    c.querySelectorAll(".table-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const n = parseInt(b.dataset.table);
        if (state.tableNumber && state.tableNumber !== n) saveSessionForTable(state.tableNumber);
        state.pendingTableNumber = n;
        openTableModal(n);
      });
    });
    return;
  }

  if (state.currentCategory === "other") {
    const otherItems = MENU_DATA.items.filter((i) => i.category === "other");
    let oh = otherItems
      .map(
        (item) =>
          `<button class="menu-item" data-id="${item.id}"><span class="emoji">${item.emoji}</span><span class="name">${item.name}</span><span class="price">${fmt(item.price)}</span></button>`
      )
      .join("");
    oh += `<button class="menu-item menu-item-custom" id="btn-open-waribiki-other"><span class="emoji">🏷️</span><span class="name">割引</span><span class="price">金額指定</span></button>`;
    oh += `<button class="menu-item menu-item-custom" id="btn-open-custom"><span class="emoji">📝</span><span class="name">フリー入力</span><span class="price">自由金額</span></button>`;
    c.innerHTML = oh;
    c.querySelectorAll(".menu-item:not(.menu-item-custom)").forEach((el) => {
      if (el.dataset.id) el.addEventListener("click", () => { if (!guardTable()) return; openConfirmItem(parseInt(el.dataset.id)); });
    });
    document.getElementById("btn-open-custom").addEventListener("click", () => {
      if (!guardTable()) return;
      openCustomModal();
    });
    document.getElementById("btn-open-waribiki-other").addEventListener("click", () => {
      if (!guardTable()) return;
      openWaribikiModal();
    });
    return;
  }

  let items =
    state.currentCategory === "all"
      ? MENU_DATA.items
      : MENU_DATA.items.filter((i) => i.category === state.currentCategory);
  let h = items
    .map(
      (item) =>
        `<button class="menu-item" data-id="${item.id}"><span class="emoji">${item.emoji}</span><span class="name">${item.name}</span><span class="price">${fmt(item.price)}</span></button>`
    )
    .join("");

  if (state.currentCategory === "system") {
    h += `<button class="menu-item menu-item-special" id="btn-open-discount"><span class="emoji">🏷️</span><span class="name">特別プラン</span><span class="price">金額入力</span></button>`;
  }
  if (state.currentCategory === "all") {
    h += `<button class="menu-item menu-item-custom" id="btn-open-custom-all"><span class="emoji">📝</span><span class="name">フリー入力</span><span class="price">自由金額</span></button>`;
  }
  c.innerHTML = h;

  c.querySelectorAll(".menu-item:not(.menu-item-custom):not(.menu-item-special)").forEach((el) => {
    if (el.dataset.id) el.addEventListener("click", () => { if (!guardTable()) return; openConfirmItem(parseInt(el.dataset.id)); });
  });
  const db = document.getElementById("btn-open-discount");
  if (db) db.addEventListener("click", () => { if (!guardTable()) return; openDiscountModal(); });
  const cb = document.getElementById("btn-open-custom") || document.getElementById("btn-open-custom-all");
  if (cb) cb.addEventListener("click", () => { if (!guardTable()) return; openCustomModal(); });
}

function guardTable() {
  if (!state.tableNumber) {
    alert("先に卓番号を選択してください");
    return false;
  }
  return true;
}

// ============================
// Cart lines (ukey)
// ============================
function pushCartLine(obj) {
  const line = { ukey: genUkey(), ...obj };
  state.cart.push(line);
}

function tryMergeSimpleItem(item, qty) {
  if (item.requiresRecipient || item.isShotTracker) return false;
  const ex = state.cart.find((l) => l.id === item.id && l.name === item.name && !l.requiresRecipient && !l.isShotTracker);
  if (ex) {
    ex.qty += qty;
    return true;
  }
  return false;
}

function updateQtyByUkey(ukey, delta) {
  const item = state.cart.find((l) => l.ukey === ukey);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter((l) => l.ukey !== ukey);
  renderCart();
}

// ============================
// Confirm item modal
// ============================
function openConfirmItem(itemId) {
  const item = MENU_DATA.items.find((i) => i.id === itemId);
  if (!item) return;
  state.confirmItem = item;
  state.confirmQty = 1;
  document.getElementById("confirm-item-detail").innerHTML =
    `<span class="confirm-emoji">${item.emoji}</span><span class="confirm-name">${item.name}</span><span class="confirm-price">${fmt(item.price)}</span>`;
  document.getElementById("confirm-qty-num").textContent = "1";
  document.getElementById("modal-confirm-item").classList.remove("hidden");
  lockScroll();
}

document.getElementById("btn-close-confirm").addEventListener("click", () => {
  document.getElementById("modal-confirm-item").classList.add("hidden");
  unlockScroll();
});
document.getElementById("confirm-qty-minus").addEventListener("click", () => {
  if (state.confirmQty > 1) {
    state.confirmQty--;
    document.getElementById("confirm-qty-num").textContent = state.confirmQty;
  }
});
document.getElementById("confirm-qty-plus").addEventListener("click", () => {
  state.confirmQty++;
  document.getElementById("confirm-qty-num").textContent = state.confirmQty;
});

document.getElementById("btn-confirm-add").addEventListener("click", () => {
  if (!state.confirmItem) return;
  const item = state.confirmItem;
  const qty = state.confirmQty;
  document.getElementById("modal-confirm-item").classList.add("hidden");
  unlockScroll();

  if (item.requiresRecipient || item.isShotTracker) {
    state.pendingAddItem = item;
    state.pendingAddQty = qty;
    openRecipientModal();
    return;
  }
  if (!tryMergeSimpleItem(item, qty)) pushCartLine({ ...item, qty });
  renderCart();
});

// ============================
// Recipient modal
// ============================
function openRecipientModal() {
  const item = state.pendingAddItem;
  document.getElementById("recipient-modal-title").textContent = item ? `${item.name} — 誰が？` : "誰が？";
  document.getElementById("recipient-manual").value = "";
  const list = loadCastList();
  const el = document.getElementById("recipient-cast-list");
  if (list.length === 0) {
    el.innerHTML = '<p class="modal-hint">キャストタブで名前を登録するとここに表示されます</p>';
  } else {
    el.innerHTML = list.map((n) => `<button type="button" class="cast-pick-btn" data-name="${escapeAttr(n)}">${escapeHtml(n)}</button>`).join("");
    el.querySelectorAll(".cast-pick-btn").forEach((b) => {
      b.addEventListener("click", () => {
        document.getElementById("recipient-manual").value = b.dataset.name;
      });
    });
  }
  document.getElementById("modal-recipient").classList.remove("hidden");
  lockScroll();
}

document.getElementById("btn-close-recipient").addEventListener("click", () => {
  document.getElementById("modal-recipient").classList.add("hidden");
  unlockScroll();
  state.pendingAddItem = null;
});

document.getElementById("btn-recipient-confirm").addEventListener("click", () => {
  const name = document.getElementById("recipient-manual").value.trim();
  if (!name) {
    alert("キャスト名を選択または入力してください");
    return;
  }
  const item = state.pendingAddItem;
  const qty = state.pendingAddQty;
  if (!item) return;

  if (item.isShotTracker) {
    const baseName = item.name.replace("（カウント）", "").trim();
    pushCartLine({
      id: item.id,
      name: `${baseName}（カウント）【${name}】`,
      price: 0,
      category: item.category,
      emoji: item.emoji,
      qty,
      isShotTracker: true,
    });
  } else {
    pushCartLine({
      id: item.id,
      name: `${item.name}（${name}）`,
      price: item.price,
      category: item.category,
      emoji: item.emoji,
      qty,
      requiresRecipient: true,
    });
  }
  document.getElementById("modal-recipient").classList.add("hidden");
  unlockScroll();
  state.pendingAddItem = null;
  renderCart();
});

// ============================
// Table modal
// ============================
function hideAllTableSteps() {
  ["table-step0-resume", "table-step1", "table-step2-new", "table-step2-repeat", "table-step3-guests", "table-step-catch"].forEach((id) => {
    document.getElementById(id).classList.add("hidden");
  });
}

function bindGuestButtons() {
  document.querySelectorAll(".guest-num-btn").forEach((b) => {
    b.addEventListener("click", () => finishCheckin(parseInt(b.dataset.guests, 10)));
  });
}

function showFreshTableModal() {
  hideAllTableSteps();
  document.getElementById("table-step1").classList.remove("hidden");
  document.getElementById("table-cast-input").value = "";
  state.pendingRepeatCasts = [];
  renderCastPicker();
  renderSelectedCastChips();
  let gh = "";
  for (let i = 1; i <= 10; i++) gh += `<button class="guest-num-btn" data-guests="${i}">${i}名</button>`;
  document.getElementById("guest-select-btns").innerHTML = gh;
  bindGuestButtons();
}

function openTableModal(n) {
  document.getElementById("modal-table-title").textContent = `🪑 卓 ${n}`;
  const existing = loadSessionForTable(n);

  hideAllTableSteps();
  if (existing && existing.checkinTime) {
    document.getElementById("table-step0-resume").classList.remove("hidden");
  } else {
    showFreshTableModal();
  }
  document.getElementById("modal-table").classList.remove("hidden");
  lockScroll();
}

document.getElementById("btn-resume-session").addEventListener("click", () => {
  const s = loadSessionForTable(state.pendingTableNumber);
  if (!s) return;
  state.tableNumber = state.pendingTableNumber;
  applySession(s);
  document.getElementById("modal-table").classList.add("hidden");
  unlockScroll();
  updateTableBadge();
  renderCart();
  renderMenu();
  state.currentCategory = "system";
  renderCategories();
  renderMenu();
});

document.getElementById("btn-new-session").addEventListener("click", () => {
  clearSessionForTable(state.pendingTableNumber);
  showFreshTableModal();
});

function closeTableModal() {
  document.getElementById("modal-table").classList.add("hidden");
  unlockScroll();
}
document.getElementById("btn-close-table").addEventListener("click", closeTableModal);

function goToGuestStep() {
  hideAllTableSteps();
  document.getElementById("table-step3-guests").classList.remove("hidden");
}

document.getElementById("btn-type-new").addEventListener("click", () => {
  hideAllTableSteps();
  document.getElementById("table-step2-new").classList.remove("hidden");
});
document.getElementById("btn-type-repeat").addEventListener("click", () => {
  hideAllTableSteps();
  state.pendingRepeatCasts = [];
  document.getElementById("table-cast-input").value = "";
  document.getElementById("table-step2-repeat").classList.remove("hidden");
  renderCastPicker();
  renderSelectedCastChips();
});

document.querySelectorAll(".source-btn").forEach((b) => {
  b.addEventListener("click", () => {
    state.pendingType = "new";
    state.pendingSource = b.dataset.source;
    state.pendingRepeatCasts = [];
    if (b.dataset.source === "キャッチ") {
      openCatchStep();
    } else {
      state.pendingCatchName = null;
      goToGuestStep();
    }
  });
});

function openCatchStep() {
  hideAllTableSteps();
  document.getElementById("table-step-catch").classList.remove("hidden");
  document.getElementById("catch-manual-input").value = "";
  state.pendingCatchNames = [];
  renderCatchPicker();
  renderCatchChips();
}

function renderCatchPicker() {
  const list = loadCastList();
  const el = document.getElementById("catch-cast-list");
  if (list.length === 0) {
    el.innerHTML = '<p class="modal-hint">キャストタブで名前を登録してください</p>';
  } else {
    el.innerHTML = list.map((n) => `<button type="button" class="cast-pick-btn" data-catch="${escapeAttr(n)}">${escapeHtml(n)}</button>`).join("");
    el.querySelectorAll("[data-catch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.catch;
        if (state.pendingCatchNames.length >= 3) { alert("最大3名までです"); return; }
        if (state.pendingCatchNames.includes(name)) return;
        state.pendingCatchNames.push(name);
        renderCatchChips();
      });
    });
  }
}

function renderCatchChips() {
  const el = document.getElementById("catch-selected-chips");
  if (state.pendingCatchNames.length === 0) {
    el.innerHTML = '<span class="modal-hint">名前をタップで追加（最大3名）</span>';
    return;
  }
  el.innerHTML = state.pendingCatchNames
    .map((n, i) => `<span class="cast-chip">${escapeHtml(n)}<button type="button" class="cast-chip-x" data-cidx="${i}">×</button></span>`)
    .join("");
  el.querySelectorAll(".cast-chip-x").forEach((b) => {
    b.addEventListener("click", () => {
      state.pendingCatchNames.splice(parseInt(b.dataset.cidx, 10), 1);
      renderCatchChips();
    });
  });
}

document.getElementById("btn-catch-confirm").addEventListener("click", () => {
  const manual = document.getElementById("catch-manual-input").value.trim();
  if (manual && state.pendingCatchNames.length < 3 && !state.pendingCatchNames.includes(manual)) {
    state.pendingCatchNames.push(manual);
    document.getElementById("catch-manual-input").value = "";
  }
  if (state.pendingCatchNames.length === 0) { alert("名前を1名以上選択してください"); return; }
  state.pendingCatchName = state.pendingCatchNames.join("・");
  goToGuestStep();
});

document.getElementById("btn-catch-skip").addEventListener("click", () => {
  state.pendingCatchName = null;
  state.pendingCatchNames = [];
  goToGuestStep();
});

function renderCastPicker() {
  const list = loadCastList();
  const el = document.getElementById("cast-picker-list");
  if (!el) return;
  if (list.length === 0) {
    el.innerHTML = '<p class="modal-hint">「キャスト」タブで名前を登録してください</p>';
    return;
  }
  el.innerHTML = list
    .map((n) => `<button type="button" class="cast-pick-btn" data-pick="${escapeAttr(n)}">${escapeHtml(n)}</button>`)
    .join("");
  el.querySelectorAll("[data-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.pick;
      if (state.pendingRepeatCasts.length >= 2) {
        alert("推しキャストは最大2名までです");
        return;
      }
      if (state.pendingRepeatCasts.includes(name)) return;
      state.pendingRepeatCasts.push(name);
      renderSelectedCastChips();
    });
  });
}

function renderSelectedCastChips() {
  const el = document.getElementById("cast-selected-chips");
  if (!el) return;
  if (state.pendingRepeatCasts.length === 0) {
    el.innerHTML = '<span class="modal-hint">名前をタップで追加（最大2名）</span>';
    return;
  }
  el.innerHTML = state.pendingRepeatCasts
    .map(
      (n, i) =>
        `<span class="cast-chip">${escapeHtml(n)}<button type="button" class="cast-chip-x" data-idx="${i}">×</button></span>`
    )
    .join("");
  el.querySelectorAll(".cast-chip-x").forEach((b) => {
    b.addEventListener("click", () => {
      const idx = parseInt(b.dataset.idx, 10);
      state.pendingRepeatCasts.splice(idx, 1);
      renderSelectedCastChips();
    });
  });
}

document.getElementById("btn-add-second-cast").addEventListener("click", () => {
  if (state.pendingRepeatCasts.length >= 2) {
    alert("すでに2名選択されています");
    return;
  }
  document.getElementById("cast-picker-list")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

document.getElementById("btn-confirm-cast").addEventListener("click", () => {
  const manual = document.getElementById("table-cast-input").value.trim();
  if (manual && state.pendingRepeatCasts.length < 2 && !state.pendingRepeatCasts.includes(manual)) {
    state.pendingRepeatCasts.push(manual);
    document.getElementById("table-cast-input").value = "";
  }
  if (state.pendingRepeatCasts.length === 0) {
    alert("推しキャストを1名以上選択するか、手入力してください");
    return;
  }
  state.pendingType = "repeat";
  state.pendingSource = null;
  goToGuestStep();
});

document.getElementById("btn-free-repeat").addEventListener("click", () => {
  state.pendingType = "repeat";
  state.pendingSource = null;
  state.pendingRepeatCasts = [];
  goToGuestStep();
});

function finishCheckin(guests) {
  state.tableNumber = state.pendingTableNumber;
  state.guestCount = guests;

  if (state.pendingType === "new") {
    state.customerType = "new";
    state.source = state.pendingSource;
    state.catchName = state.pendingCatchName || null;
    state.catchNames = [...state.pendingCatchNames];
    state.cast = null;
    state.castsArr = [];
    state.checkinTime = new Date().toISOString();
    state.cart = [];
  } else {
    state.customerType = "repeat";
    state.source = null;
    state.catchName = null;
    state.catchNames = [];
    state.castsArr = [...state.pendingRepeatCasts];
    state.cast = state.castsArr.length ? state.castsArr.join("・") : null;
    state.checkinTime = new Date().toISOString();
    state.cart = [];
    const shimei = MENU_DATA.items.find((i) => i.id === 6);
    if (shimei && state.castsArr.length) {
      state.castsArr.forEach((nm) => {
        pushCartLine({
          id: shimei.id,
          name: `推し指名（${nm}）`,
          price: shimei.price,
          category: shimei.category,
          emoji: shimei.emoji,
          qty: 1,
        });
      });
    }
  }

  updateTableBadge();
  renderCart();
  closeTableModal();
  state.currentCategory = "system";
  renderCategories();
  renderMenu();
}

// ============================
// Discount & Custom modals
// ============================
function openDiscountModal() {
  document.getElementById("modal-discount").classList.remove("hidden");
  document.getElementById("discount-name").value = "";
  document.getElementById("discount-price").value = "";
  document.getElementById("discount-name").focus();
  lockScroll();
}
document.getElementById("btn-close-discount").addEventListener("click", () => {
  document.getElementById("modal-discount").classList.add("hidden");
  unlockScroll();
});
document.getElementById("btn-add-discount").addEventListener("click", () => {
  const name = document.getElementById("discount-name").value.trim() || "特別プラン";
  const price = parseInt(document.getElementById("discount-price").value, 10) || 0;
  if (price <= 0) {
    alert("料金を入力してください");
    return;
  }
  state.customIdCounter++;
  pushCartLine({ id: state.customIdCounter, name, price, category: "system", emoji: "🏷️", qty: 1, isCustom: true });
  renderCart();
  document.getElementById("modal-discount").classList.add("hidden");
  unlockScroll();
});

function openWaribikiModal() {
  document.getElementById("modal-waribiki").classList.remove("hidden");
  document.getElementById("waribiki-name").value = "";
  document.getElementById("waribiki-price").value = "";
  document.getElementById("waribiki-name").focus();
  lockScroll();
}
document.getElementById("btn-close-waribiki").addEventListener("click", () => {
  document.getElementById("modal-waribiki").classList.add("hidden");
  unlockScroll();
});
document.getElementById("btn-add-waribiki").addEventListener("click", () => {
  const name = document.getElementById("waribiki-name").value.trim() || "割引";
  const price = parseInt(document.getElementById("waribiki-price").value, 10) || 0;
  if (price <= 0) {
    alert("割引金額を入力してください");
    return;
  }
  state.customIdCounter++;
  pushCartLine({ id: state.customIdCounter, name: `${name} (−¥${price.toLocaleString()})`, price: -price, category: "other", emoji: "🏷️", qty: 1, isCustom: true });
  renderCart();
  document.getElementById("modal-waribiki").classList.add("hidden");
  unlockScroll();
});

function openCustomModal() {
  document.getElementById("modal-custom").classList.remove("hidden");
  document.getElementById("custom-name").value = "";
  document.getElementById("custom-price").value = "";
  document.getElementById("custom-name").focus();
  lockScroll();
}
document.getElementById("btn-close-custom").addEventListener("click", () => {
  document.getElementById("modal-custom").classList.add("hidden");
  unlockScroll();
});
document.getElementById("btn-add-custom").addEventListener("click", () => {
  const name = document.getElementById("custom-name").value.trim();
  const price = parseInt(document.getElementById("custom-price").value, 10) || 0;
  if (!name || price <= 0) {
    alert("商品名と金額を入力してください");
    return;
  }
  state.customIdCounter++;
  pushCartLine({ id: state.customIdCounter, name, price, category: "other", emoji: "📝", qty: 1, isCustom: true });
  renderCart();
  document.getElementById("modal-custom").classList.add("hidden");
  unlockScroll();
});

// ============================
// Cart UI
// ============================
function clearCart() {
  if (state.tableNumber) clearSessionForTable(state.tableNumber);
  state.cart = [];
  state.tableNumber = null;
  state.customerType = null;
  state.source = null;
  state.catchName = null;
  state.catchNames = [];
  state.cast = null;
  state.castsArr = [];
  state.guestCount = 0;
  state.checkinTime = null;
  updateTableBadge();
  renderCart();
  renderMenu();
}

function renderCart() {
  const c = document.getElementById("cart-items");
  const btn = document.getElementById("btn-checkout");
  if (state.cart.length === 0) {
    c.innerHTML = `<div class="cart-empty">${state.tableNumber ? "商品を選択してください" : "卓番号を選択してください"}</div>`;
    btn.disabled = true;
  } else {
    c.innerHTML = state.cart
      .map(
        (item) =>
          `<div class="cart-item">
        <span class="item-emoji">${item.emoji}</span>
        <div class="item-info"><div class="item-name">${escapeHtml(item.name)}</div><div class="item-price">${fmt(item.price)}</div></div>
        <div class="item-qty">
          <button class="qty-btn minus" data-ukey="${item.ukey}" data-delta="-1">−</button>
          <span class="qty-count">${item.qty}</span>
          <button class="qty-btn plus" data-ukey="${item.ukey}" data-delta="1">+</button>
        </div>
        <div class="item-total">${fmt(item.price * item.qty)}</div>
      </div>`
      )
      .join("");
    btn.disabled = false;
    c.querySelectorAll(".qty-btn").forEach((b) => {
      b.addEventListener("click", () => updateQtyByUkey(b.dataset.ukey, parseInt(b.dataset.delta, 10)));
    });
  }
  document.getElementById("subtotal").textContent = fmt(getCartSubtotal());
  document.getElementById("tax").textContent = fmt(getCartTax());
  document.getElementById("sc").textContent = fmt(getCartSC());
  const cfr = document.getElementById("card-fee-row");
  if (state.paymentMethod === "card" && state.cart.length > 0) {
    cfr.classList.remove("hidden");
    document.getElementById("card-fee").textContent = fmt(getCartCardFee());
  } else cfr.classList.add("hidden");
  document.getElementById("total").textContent = fmt(getCartTotal());
  updateMobileBadge();
  if (state.tableNumber && state.checkinTime) saveSessionForTable(state.tableNumber);
}

document.getElementById("btn-clear-cart").addEventListener("click", clearCart);

document.getElementById("guest-minus").addEventListener("click", () => {
  if (state.guestCount > 1) {
    state.guestCount--;
    document.getElementById("guest-count").textContent = state.guestCount;
    renderCart();
  }
});
document.getElementById("guest-plus").addEventListener("click", () => {
  state.guestCount++;
  document.getElementById("guest-count").textContent = state.guestCount;
  renderCart();
});

function updateTableBadge() {
  const tb = document.getElementById("table-badge");
  const cb = document.getElementById("cast-badge");
  const gr = document.getElementById("cart-guest-row");
  if (state.tableNumber) {
    tb.textContent = `🪑 卓${state.tableNumber}`;
    tb.classList.add("active");
    let info = state.customerType === "new" ? "🆕 新規" : "🔄 リピート";
    if (state.source) info += ` (${state.source})`;
    if (state.catchNames && state.catchNames.length) info += ` 🤝${state.catchNames.join("・")}`;
    else if (state.catchName) info += ` 🤝${state.catchName}`;
    if (state.cast) info = `👑 ${state.cast}`;
    if (state.checkinTime) {
      const t = new Date(state.checkinTime);
      info += ` ｜ 入店 ${pz(t.getHours())}:${pz(t.getMinutes())}`;
    }
    cb.textContent = info;
    gr.classList.remove("hidden");
    document.getElementById("guest-count").textContent = state.guestCount;
  } else {
    tb.textContent = "卓未選択";
    tb.classList.remove("active");
    cb.textContent = "";
    gr.classList.add("hidden");
  }
}

// ============================
// Checkout
// ============================
function openCheckout() {
  document.getElementById("modal-checkout").classList.remove("hidden");
  document.getElementById("checkout-amount").textContent = fmt(getCartTotal());
  document.getElementById("checkout-card-fee").classList.toggle("hidden", state.paymentMethod !== "card");
  state.receivedAmount = "";
  updatePaymentUI();
  updateReceivedDisplay();
  lockScroll();
}
function closeCheckout() {
  document.getElementById("modal-checkout").classList.add("hidden");
  unlockScroll();
}
document.getElementById("btn-checkout").addEventListener("click", openCheckout);
document.getElementById("btn-close-checkout").addEventListener("click", closeCheckout);

document.querySelectorAll(".payment-btn").forEach((b) => {
  b.addEventListener("click", () => {
    state.paymentMethod = b.dataset.method;
    renderCart();
    updatePaymentUI();
  });
});

function updatePaymentUI() {
  document.querySelectorAll(".payment-btn").forEach((b) => b.classList.toggle("active", b.dataset.method === state.paymentMethod));
  document.getElementById("checkout-amount").textContent = fmt(getCartTotal());
  document.getElementById("checkout-card-fee").classList.toggle("hidden", state.paymentMethod !== "card");
  const cs = document.getElementById("cash-input-section");
  if (state.paymentMethod === "cash") {
    cs.classList.remove("hidden");
    document.getElementById("btn-confirm-payment").disabled = !canPay();
  } else {
    cs.classList.add("hidden");
    document.getElementById("btn-confirm-payment").disabled = false;
  }
}

document.querySelectorAll(".num-btn").forEach((b) => {
  b.addEventListener("click", () => {
    const v = b.dataset.val;
    if (v === "del") state.receivedAmount = state.receivedAmount.slice(0, -1);
    else if (state.receivedAmount.length < 8) state.receivedAmount += v;
    updateReceivedDisplay();
  });
});
document.querySelectorAll(".quick-btn:not(.exact)").forEach((b) => {
  b.addEventListener("click", () => {
    state.receivedAmount = b.dataset.amount;
    updateReceivedDisplay();
  });
});
document.getElementById("btn-exact").addEventListener("click", () => {
  state.receivedAmount = getCartTotal().toString();
  updateReceivedDisplay();
});

function updateReceivedDisplay() {
  const a = parseInt(state.receivedAmount, 10) || 0;
  document.getElementById("received-display").textContent = fmt(a);
  const ch = a - getCartTotal();
  const cd = document.getElementById("change-display");
  if (ch < 0) {
    cd.classList.add("negative");
    document.getElementById("change-amount").textContent = "−" + fmt(Math.abs(ch));
  } else {
    cd.classList.remove("negative");
    document.getElementById("change-amount").textContent = fmt(ch);
  }
  document.getElementById("btn-confirm-payment").disabled = !canPay();
}
function canPay() {
  return state.paymentMethod !== "cash" || (parseInt(state.receivedAmount, 10) || 0) >= getCartTotal();
}

document.getElementById("btn-confirm-payment").addEventListener("click", () => {
  const total = getCartTotal();
  const received = state.paymentMethod === "cash" ? parseInt(state.receivedAmount, 10) || 0 : total;
  state.orderCounter++;
  const order = {
    id: state.orderCounter,
    items: state.cart.map((i) => ({ ...i })),
    subtotal: getCartSubtotal(),
    tax: getCartTax(),
    sc: getCartSC(),
    cardFee: getCartCardFee(),
    total,
    received,
    change: Math.max(0, received - total),
    method: state.paymentMethod,
    scEnabled: state.scEnabled,
    tableNumber: state.tableNumber,
    customerType: state.customerType,
    source: state.source,
    catchName: state.catchName,
    catchNames: [...state.catchNames],
    cast: state.cast,
    castsArr: [...state.castsArr],
    guestCount: state.guestCount,
    checkinTime: state.checkinTime,
    checkoutTime: new Date().toISOString(),
    timestamp: new Date().toISOString(),
  };
  state.orders.push(order);
  saveOrders();
  closeCheckout();
  showReceipt(order);
});

// ============================
// Receipt
// ============================
let receiptIsFromHistory = false;

function showReceipt(order, fromHistory) {
  receiptIsFromHistory = !!fromHistory;
  const itemsH = order.items.map((i) => `<div class="receipt-item"><span>${escapeHtml(i.name)} x${i.qty}</span><span>${fmt(i.price * i.qty)}</span></div>`).join("");
  const scH = order.scEnabled ? `<div class="receipt-item"><span>SC (15%)</span><span>${fmt(order.sc)}</span></div>` : "";
  const cfH = order.cardFee > 0 ? `<div class="receipt-item"><span>カード手数料 (8%)</span><span>${fmt(order.cardFee)}</span></div>` : "";
  let infoH = `<div class="receipt-cast">🪑 卓${order.tableNumber} ｜ ${order.guestCount}名`;
  if (order.customerType === "new") {
    infoH += ` ｜ 🆕 新規 (${order.source})`;
    const catches = order.catchNames || (order.catchName ? [order.catchName] : []);
    if (catches.length) infoH += ` 🤝${catches.map(n => escapeHtml(n)).join("・")}`;
  }
  if (order.cast) infoH += ` ｜ 👑 ${escapeHtml(order.cast)}`;
  const cin = order.checkinTime ? fmtDT(order.checkinTime) : "";
  const cout = order.checkoutTime ? fmtDT(order.checkoutTime) : "";
  if (cin) infoH += `<br>⏰ 入店 ${cin} → 退店 ${cout}`;
  infoH += `</div>`;

  document.getElementById("receipt-content").innerHTML = `
    <div class="receipt-header"><div class="shop-name">Gift</div><div class="shop-info">ご来店ありがとうございます</div></div>
    ${infoH}
    <div class="receipt-items">${itemsH}</div>
    <div class="receipt-totals">
      <div class="receipt-item"><span>小計</span><span>${fmt(order.subtotal)}</span></div>
      <div class="receipt-item"><span>TAX (10%)</span><span>${fmt(order.tax)}</span></div>
      ${scH}${cfH}
      <div class="receipt-item receipt-grand-total"><span>合計</span><span>${fmt(order.total)}</span></div>
    </div>
    <div class="receipt-payment">
      <div class="receipt-item"><span>${getML(order.method)}</span><span>${fmt(order.received)}</span></div>
      ${order.method === "cash" ? `<div class="receipt-item"><span>おつり</span><span>${fmt(order.change)}</span></div>` : ""}
    </div>
    <div class="receipt-footer">No. #${order.id.toString().padStart(4, "0")}<br>${fmtDT(order.timestamp)}<br>またのご来店をお待ちしております</div>`;
  document.getElementById("modal-receipt").classList.remove("hidden");
  lockScroll();
}

function afterReceiptClose() {
  document.getElementById("modal-receipt").classList.add("hidden");
  unlockScroll();
  if (receiptIsFromHistory) {
    receiptIsFromHistory = false;
    return;
  }
  if (state.tableNumber) clearSessionForTable(state.tableNumber);
  state.cart = [];
  state.tableNumber = null;
  state.customerType = null;
  state.source = null;
  state.catchName = null;
  state.catchNames = [];
  state.cast = null;
  state.castsArr = [];
  state.guestCount = 0;
  state.checkinTime = null;
  updateTableBadge();
  renderCart();
  renderMenu();
  closeMobileCart();
}

document.getElementById("btn-close-receipt").addEventListener("click", afterReceiptClose);
document.getElementById("btn-done").addEventListener("click", afterReceiptClose);
document.getElementById("btn-print").addEventListener("click", () => window.print());

// ============================
// History
// ============================
function renderHistory() {
  const c = document.getElementById("history-list");
  const orders = [...state.orders].reverse();
  if (orders.length === 0) {
    c.innerHTML = '<div class="empty-state">まだ注文履歴がありません</div>';
    return;
  }

  c.innerHTML = orders
    .map((o) => {
      const items = o.items.map((i) => `${i.name}×${i.qty}`).join("、");
      let badges = "";
      if (o.tableNumber) badges += `<span class="order-table-badge">🪑 卓${o.tableNumber}</span>`;
      if (o.guestCount) badges += `<span class="order-source">👥 ${o.guestCount}名</span>`;
      if (o.cast) badges += `<span class="order-cast">👑 ${escapeHtml(o.cast)}</span>`;
      if (o.source) badges += `<span class="order-source">${escapeHtml(o.source)}</span>`;
      const cin = o.checkinTime ? fmtDT(o.checkinTime) : "";
      const cout = o.checkoutTime ? fmtDT(o.checkoutTime) : "";
      const timeStr = cin && cout ? `⏰ 入店 ${cin} → 退店 ${cout}` : fmtDT(o.timestamp);
      return `<div class="history-item" data-view-order="${o.id}">
      <span class="order-num">#${o.id.toString().padStart(4, "0")}</span>
      <div class="order-detail">
        <div class="order-badges">${badges}</div>
        <div class="order-time">${timeStr}</div>
        <div class="order-items-text">${escapeHtml(items)}</div>
      </div>
      <span class="order-method">${getML(o.method)}</span>
      <span class="order-total">${fmt(o.total)}</span>
      <button class="btn-delete-order" data-order-id="${o.id}" title="削除">🗑️</button>
    </div>`;
    })
    .join("");

  c.querySelectorAll(".history-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".btn-delete-order")) return;
      const id = parseInt(el.dataset.viewOrder, 10);
      const order = state.orders.find((o) => o.id === id);
      if (order) showReceipt(order, true);
    });
  });

  c.querySelectorAll(".btn-delete-order").forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(b.dataset.orderId, 10);
      if (confirm(`注文 #${id.toString().padStart(4, "0")} を削除しますか？`)) {
        state.orders = state.orders.filter((o) => o.id !== id);
        saveOrders();
        renderHistory();
      }
    });
  });
}

// ============================
// Summary
// ============================
function parseShotCountName(name) {
  const m = String(name).match(/キャストショット(?:＋)?（カウント）【(.+?)】/);
  return m ? m[1] : null;
}

function renderSummary() {
  const orders = state.orders;
  const todayOrders = orders.filter((o) => getBusinessDate(o.timestamp) === getBusinessDate());
  const monthOrders = orders.filter((o) => getBusinessMonth(o.timestamp) === getBusinessMonth());
  const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
  const monthSales = monthOrders.reduce((s, o) => s + o.total, 0);
  const avgOrder = monthOrders.length > 0 ? Math.round(monthSales / monthOrders.length) : 0;
  const todayGuests = todayOrders.reduce((s, o) => s + (o.guestCount || 0), 0);

  document.getElementById("summary-cards").innerHTML = `
    <div class="summary-card primary"><div class="card-label">本日の売上（20時〜）</div><div class="card-value">${fmt(todaySales)}</div><div class="card-sub">${todayOrders.length}件 / ${todayGuests}名</div></div>
    <div class="summary-card"><div class="card-label">今月の売上</div><div class="card-value">${fmt(monthSales)}</div><div class="card-sub">${monthOrders.length}件</div></div>
    <div class="summary-card"><div class="card-label">平均注文額（今月）</div><div class="card-value">${fmt(avgOrder)}</div></div>
    <div class="summary-card"><div class="card-label">本日の来店数</div><div class="card-value">${todayGuests}名</div><div class="card-sub">${todayOrders.length}組</div></div>`;

  const catSales = {};
  MENU_DATA.categories.filter((c) => c.id !== "all" && c.id !== "table").forEach((c) => {
    catSales[c.id] = { name: c.name, emoji: c.emoji, total: 0 };
  });
  todayOrders.forEach((o) =>
    o.items.forEach((i) => {
      const cat = i.category || "other";
      if (catSales[cat]) catSales[cat].total += i.price * i.qty;
    })
  );
  const maxCat = Math.max(...Object.values(catSales).map((x) => x.total), 1);
  document.getElementById("category-sales").innerHTML = Object.values(catSales)
    .sort((a, b) => b.total - a.total)
    .map(
      (c) =>
        `<div class="category-sale-row"><span class="sale-label">${c.emoji} ${c.name}</span><div class="sale-bar-container"><div class="sale-bar" style="width:${(c.total / maxCat) * 100}%"></div></div><span class="sale-amount">${fmt(c.total)}</span></div>`
    )
    .join("");

  const ic = {};
  todayOrders.forEach((o) =>
    o.items.forEach((i) => {
      if (i.price <= 0) return;
      if (String(i.name).includes("キャストショット（カウント）")) return;
      const k = i.name;
      if (!ic[k]) ic[k] = { name: i.name, emoji: i.emoji || "📦", count: 0, total: 0 };
      ic[k].count += i.qty;
      ic[k].total += i.price * i.qty;
    })
  );
  const top5 = Object.values(ic).sort((a, b) => b.count - a.count).slice(0, 5);
  const pc = document.getElementById("popular-items");
  if (top5.length === 0) pc.innerHTML = '<div class="empty-state">まだデータがありません</div>';
  else {
    const rc = ["gold", "silver", "bronze", "", ""];
    pc.innerHTML = top5
      .map(
        (i, n) =>
          `<div class="popular-item-row"><span class="popular-rank ${rc[n]}">${n + 1}</span><span class="popular-name">${i.emoji} ${escapeHtml(i.name)}</span><span class="popular-count">${i.count}個</span><span class="popular-total">${fmt(i.total)}</span></div>`
      )
      .join("");
  }

  const cs = {};
  todayOrders.forEach((o) => {
    if (o.cast) {
      if (!cs[o.cast]) cs[o.cast] = { name: o.cast, subtotal: 0, count: 0 };
      cs[o.cast].subtotal += o.subtotal || 0;
      cs[o.cast].count++;
    }
  });
  const cl = Object.values(cs).sort((a, b) => b.subtotal - a.subtotal);
  const cc = document.getElementById("cast-sales");
  if (cl.length === 0) cc.innerHTML = '<div class="empty-state">まだデータがありません</div>';
  else {
    const mx = cl[0].subtotal || 1;
    cc.innerHTML = cl
      .map(
        (c) =>
          `<div class="category-sale-row"><span class="sale-label">👑 ${escapeHtml(c.name)}</span><div class="sale-bar-container"><div class="sale-bar" style="width:${(c.subtotal / mx) * 100}%"></div></div><span class="sale-amount">${fmt(c.subtotal)} (${c.count}件)</span></div>`
      )
      .join("");
  }

  const ss = {};
  todayOrders.forEach((o) => {
    if (o.source) ss[o.source] = (ss[o.source] || 0) + 1;
    if (o.customerType === "repeat") ss["リピーター"] = (ss["リピーター"] || 0) + 1;
  });
  const sl = Object.entries(ss).sort((a, b) => b[1] - a[1]);
  const scEl = document.getElementById("source-stats");
  if (sl.length === 0) scEl.innerHTML = '<div class="empty-state">まだデータがありません</div>';
  else {
    const mx = sl[0][1] || 1;
    scEl.innerHTML = sl
      .map(
        ([n, c]) =>
          `<div class="category-sale-row"><span class="sale-label">${escapeHtml(n)}</span><div class="sale-bar-container"><div class="sale-bar" style="width:${(c / mx) * 100}%"></div></div><span class="sale-amount">${c}組</span></div>`
      )
      .join("");
  }

  const remarksAgg = {};
  todayOrders.forEach((o) => {
    o.items.forEach((i) => {
      const name = String(i.name);
      const m = name.match(/キャストショット＋（カウント）【(.+?)】/);
      if (m) {
        remarksAgg[m[1]] = (remarksAgg[m[1]] || 0) + i.qty;
      }
    });
  });
  const remarksList = Object.entries(remarksAgg).sort((a, b) => b[1] - a[1]);
  const remarksEl = document.getElementById("remarks-stats");
  if (remarksList.length === 0) {
    remarksEl.innerHTML = '<div class="empty-state">備考なし</div>';
  } else {
    remarksEl.innerHTML = '<table class="remarks-table">' +
      remarksList.map(([n, cnt]) =>
        `<div class="category-sale-row"><span class="sale-label">🥃 ${escapeHtml(n)}</span><span class="sale-amount">${cnt}杯</span></div>`
      ).join("") + '</table>';
  }
}

// ============================
// Summary Sub-tabs
// ============================
document.querySelectorAll(".summary-sub-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".summary-sub-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const v = tab.dataset.subtab;
    document.getElementById("subtab-summary").classList.toggle("hidden", v !== "summary");
    document.getElementById("subtab-daily-report").classList.toggle("hidden", v !== "daily-report");
    if (v === "daily-report") renderDailyReport();
  });
});

// ============================
// Daily Report
// ============================
const EXPENSE_KEY = "gift_daily_expenses";
const DAILY_PAY_KEY = "gift_daily_pay";

let reportDate = getBusinessDateObj();

function getBusinessDateObj(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (d.getHours() < 20) d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function reportDateKey() {
  return reportDate.toDateString();
}

function fmtReportDate(d) {
  return `R${d.getFullYear() - 2018}年 ${d.getMonth() + 1}月 ${d.getDate()}日`;
}

function loadExpenses() {
  try { return JSON.parse(localStorage.getItem(EXPENSE_KEY) || "{}"); } catch { return {}; }
}
function saveExpenses(obj) { localStorage.setItem(EXPENSE_KEY, JSON.stringify(obj)); }
function getExpensesForDate(dateKey) {
  const all = loadExpenses();
  return all[dateKey] || [];
}
function setExpensesForDate(dateKey, arr) {
  const all = loadExpenses();
  all[dateKey] = arr;
  saveExpenses(all);
}

function loadDailyPay() {
  try { return JSON.parse(localStorage.getItem(DAILY_PAY_KEY) || "{}"); } catch { return {}; }
}
function saveDailyPay(obj) { localStorage.setItem(DAILY_PAY_KEY, JSON.stringify(obj)); }
function getDailyPayForDate(dateKey) {
  const all = loadDailyPay();
  return all[dateKey] || { dailyPay: 0, tainyuSalary: 0 };
}
function setDailyPayForDate(dateKey, data) {
  const all = loadDailyPay();
  all[dateKey] = data;
  saveDailyPay(all);
}

document.getElementById("report-prev-day").addEventListener("click", () => {
  reportDate.setDate(reportDate.getDate() - 1);
  renderDailyReport();
});
document.getElementById("report-next-day").addEventListener("click", () => {
  reportDate.setDate(reportDate.getDate() + 1);
  renderDailyReport();
});

function getOrdersForReportDate() {
  const key = reportDate.toDateString();
  return state.orders.filter((o) => getBusinessDate(o.timestamp) === key);
}

function renderDailyReport() {
  const dateKey = reportDateKey();
  document.getElementById("report-date-label").textContent = fmtReportDate(reportDate);
  const orders = getOrdersForReportDate();
  const expenses = getExpensesForDate(dateKey);
  const payData = getDailyPayForDate(dateKey);
  const el = document.getElementById("daily-report-content");

  const cashOrders = orders.filter((o) => o.method === "cash");
  const cardOrders = orders.filter((o) => o.method === "card");
  const qrOrders = orders.filter((o) => o.method === "qr");
  const cashTotal = cashOrders.reduce((s, o) => s + o.total, 0);
  const cardTotal = cardOrders.reduce((s, o) => s + o.total, 0);
  const qrTotal = qrOrders.reduce((s, o) => s + o.total, 0);
  const grandTotal = orders.reduce((s, o) => s + o.total, 0);
  const expenseTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const dailyPay = payData.dailyPay || 0;
  const tainyuSalary = payData.tainyuSalary || 0;
  const cashNet = cashTotal - expenseTotal - dailyPay - tainyuSalary;

  // Customer rows (max 15)
  let custRows = "";
  for (let i = 0; i < 15; i++) {
    const o = orders[i];
    if (o) {
      const cin = o.checkinTime ? fmtTime(new Date(o.checkinTime)) : "";
      const cout = o.checkoutTime ? fmtTime(new Date(o.checkoutTime)) : "";
      const guests = o.guestCount || "";
      const orderNum = `#${o.id.toString().padStart(4, "0")}`;
      const isNew = o.customerType === "new";
      const newBadge = isNew ? `<span class="new-badge">${o.source || "新規"}</span>` : "";
      const catches = o.catchNames || (o.catchName ? [o.catchName] : []);
      const catchBadge = catches.length ? `<span class="catch-badge">🤝${catches.map(n => escapeHtml(n)).join("・")}</span>` : "";
      custRows += `<tr>
        <td class="num-cell">${i + 1}</td>
        <td class="num-cell">${guests}</td>
        <td>${cin}</td>
        <td>${cout}</td>
        <td class="name-cell">${orderNum}${newBadge}${catchBadge}</td>
        <td class="amount-cell">${fmt(o.total)}</td>
      </tr>`;
    } else {
      custRows += `<tr><td class="num-cell">${i + 1}</td><td></td><td></td><td></td><td></td><td></td></tr>`;
    }
  }

  // Card detail rows
  let cardRows = "";
  cardOrders.forEach((o) => {
    const orderNum = `#${o.id.toString().padStart(4, "0")}`;
    cardRows += `<tr><td class="name-cell">${orderNum}</td><td class="amount-cell">${fmt(o.total)}</td></tr>`;
  });
  if (cardRows === "") cardRows = `<tr><td colspan="2" style="color:var(--text-muted);font-size:11px;">なし</td></tr>`;

  // QR detail rows
  let qrRows = "";
  qrOrders.forEach((o) => {
    const orderNum = `#${o.id.toString().padStart(4, "0")}`;
    qrRows += `<tr><td class="name-cell">${orderNum}</td><td class="amount-cell">${fmt(o.total)}</td></tr>`;
  });

  // Expense rows
  let expenseRows = "";
  expenses.forEach((e, i) => {
    expenseRows += `<div class="expense-input-row" data-eidx="${i}">
      <input type="text" value="${escapeAttr(e.name || "")}" data-field="name" placeholder="項目名">
      <input type="number" value="${e.amount || ""}" data-field="amount" placeholder="金額" min="0">
      <button class="btn-expense-del" data-eidx="${i}">×</button>
    </div>`;
  });

  // Cast drink & shot aggregation
  const castDrinkAgg = {};
  const castShotAgg = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      const name = String(item.name);
      const shotCast = parseShotCountName(name);
      if (shotCast) {
        castShotAgg[shotCast] = (castShotAgg[shotCast] || 0) + item.qty;
        return;
      }
      const drinkMatch = name.match(/^(?:キャストドリンク|キャストショット)（(.+?)）$/);
      if (drinkMatch) {
        const castName = drinkMatch[1];
        const key = name.startsWith("キャストショット") ? "shot" : "drink";
        if (!castDrinkAgg[castName]) castDrinkAgg[castName] = { drink: 0, shot: 0 };
        castDrinkAgg[castName][key] += item.qty;
      }
    });
  });

  let castDrinkRows = "";
  const cdNames = Object.keys(castDrinkAgg).sort();
  if (cdNames.length === 0) {
    castDrinkRows = `<tr><td colspan="3" style="color:var(--text-muted);font-size:11px;">なし</td></tr>`;
  } else {
    cdNames.forEach((n) => {
      const d = castDrinkAgg[n];
      castDrinkRows += `<tr><td class="name-cell">${escapeHtml(n)}</td><td class="num-cell">${d.drink}杯</td><td class="num-cell">${d.shot}杯</td></tr>`;
    });
  }

  // Remarks: キャストショット＋（カウント）
  const remarksPlus = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      const m = String(item.name).match(/キャストショット＋（カウント）【(.+?)】/);
      if (m) remarksPlus[m[1]] = (remarksPlus[m[1]] || 0) + item.qty;
    });
  });
  const remarksPlusList = Object.entries(remarksPlus).sort((a, b) => b[1] - a[1]);
  let remarksHtml = "";
  if (remarksPlusList.length === 0) {
    remarksHtml = `<p style="color:var(--text-muted);font-size:12px;">なし</p>`;
  } else {
    remarksHtml = `<table class="report-table"><thead><tr><th>キャスト名</th><th>杯数</th></tr></thead><tbody>` +
      remarksPlusList.map(([n, cnt]) => `<tr><td class="name-cell">🥃 ${escapeHtml(n)}</td><td class="num-cell">${cnt}杯</td></tr>`).join("") +
      `</tbody></table>`;
  }

  // New customer source
  const newOrders = orders.filter((o) => o.customerType === "new");
  let sourceRows = "";
  if (newOrders.length === 0) {
    sourceRows = `<tr><td colspan="4" style="color:var(--text-muted);font-size:11px;">なし</td></tr>`;
  } else {
    newOrders.forEach((o) => {
      const orderNum = `#${o.id.toString().padStart(4, "0")}`;
      const catchArr = o.catchNames || (o.catchName ? [o.catchName] : []);
      const catchInfo = catchArr.length ? catchArr.map(n => escapeHtml(n)).join("・") : "";
      sourceRows += `<tr><td class="name-cell">${orderNum}</td><td>${escapeHtml(o.source || "不明")}</td><td class="name-cell">${catchInfo}</td><td class="num-cell">${o.guestCount || ""}名</td></tr>`;
    });
  }

  // Monthly total
  const monthKey = `${reportDate.getFullYear()}-${pz(reportDate.getMonth() + 1)}`;
  const monthOrders = state.orders.filter((o) => getBusinessMonth(o.timestamp) === monthKey);
  const monthTotal = monthOrders.reduce((s, o) => s + o.total, 0);

  el.innerHTML = `
    <div class="report-grid">
      <div>
        <!-- Customer table -->
        <div class="report-section">
          <h3>来店一覧</h3>
          <table class="report-table">
            <thead><tr><th></th><th>客数</th><th>来店時間</th><th>退店時間</th><th>お客様名</th><th>会計金</th></tr></thead>
            <tbody>${custRows}</tbody>
            <tfoot>
              <tr class="row-total"><td colspan="5">計</td><td class="amount-cell">${fmt(grandTotal)}</td></tr>
              <tr class="row-total"><td colspan="5">月間売上金</td><td class="amount-cell">${fmt(monthTotal)}</td></tr>
            </tfoot>
          </table>
        </div>

        <!-- Cast drink/shot summary -->
        <div class="report-cast-grid">
          <div class="report-section">
            <h3>🍹 キャストドリンク/ショット</h3>
            <table class="report-table">
              <thead><tr><th>キャスト名</th><th>ドリンク</th><th>ショット</th></tr></thead>
              <tbody>${castDrinkRows}</tbody>
            </table>
          </div>
          <div class="report-section">
            <h3>📝 備考</h3>
            ${remarksHtml}
          </div>
        </div>

        <!-- New customer sources -->
        <div class="report-section">
          <h3>🆕 新規流入経路</h3>
          <table class="report-table">
            <thead><tr><th>伝票</th><th>流入経路</th><th>キャッチ</th><th>人数</th></tr></thead>
            <tbody>${sourceRows}</tbody>
          </table>
        </div>
      </div>

      <div>
        <!-- Credit card -->
        <div class="report-section">
          <h3>💳 クレジットカード</h3>
          <table class="report-table">
            <thead><tr><th>伝票</th><th>金額</th></tr></thead>
            <tbody>${cardRows}</tbody>
            <tfoot><tr class="row-total"><td>クレジットカード計</td><td class="amount-cell">${fmt(cardTotal)}</td></tr></tfoot>
          </table>
        </div>

        ${qrOrders.length > 0 ? `
        <div class="report-section">
          <h3>📱 QR決済</h3>
          <table class="report-table">
            <thead><tr><th>伝票</th><th>金額</th></tr></thead>
            <tbody>${qrRows}</tbody>
            <tfoot><tr class="row-total"><td>QR決済計</td><td class="amount-cell">${fmt(qrTotal)}</td></tr></tfoot>
          </table>
        </div>` : ""}

        <!-- Expenses -->
        <div class="report-section">
          <h3>💰 経費内訳</h3>
          <div class="expense-list" id="expense-list">${expenseRows}</div>
          <div class="expense-input-row">
            <input type="text" id="new-expense-name" placeholder="項目名（例: アイスマート）">
            <input type="number" id="new-expense-amount" placeholder="金額" min="0">
            <button class="btn-expense-add" id="btn-add-expense">＋</button>
          </div>
          <div class="expense-total-row"><span>経費計</span><span id="expense-total-display">${fmt(expenseTotal)}</span></div>
        </div>

        <!-- Daily pay -->
        <div class="report-section">
          <h3>📤 日払い・体入</h3>
          <div class="daily-pay-row">
            <label>日払い</label>
            <input type="number" id="report-daily-pay" value="${dailyPay || ""}" placeholder="0" min="0">
          </div>
          <div class="daily-pay-row">
            <label>体入給与</label>
            <input type="number" id="report-tainyu-salary" value="${tainyuSalary || ""}" placeholder="0" min="0">
          </div>
        </div>

        <!-- Cash summary -->
        <div class="report-section">
          <h3>💴 現金内訳</h3>
          <table class="report-table">
            <tbody>
              <tr><td class="row-label">現金売上</td><td class="amount-cell">${fmt(cashTotal)}</td></tr>
              <tr><td class="row-label">経費</td><td class="amount-cell">${fmt(expenseTotal)}</td></tr>
              <tr><td class="row-label">日払い</td><td class="amount-cell">${fmt(dailyPay)}</td></tr>
              <tr><td class="row-label">体入給与</td><td class="amount-cell">${fmt(tainyuSalary)}</td></tr>
              <tr class="row-total"><td>現金計</td><td class="amount-cell">${fmt(cashNet)}</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Grand summary -->
        <div class="report-section">
          <h3>📊 売上集計概要</h3>
          <table class="report-table">
            <tbody>
              <tr><td class="row-label">現金</td><td class="amount-cell">${fmt(cashTotal)}</td></tr>
              <tr><td class="row-label">クレジットカード</td><td class="amount-cell">${fmt(cardTotal)}</td></tr>
              ${qrTotal > 0 ? `<tr><td class="row-label">QR決済</td><td class="amount-cell">${fmt(qrTotal)}</td></tr>` : ""}
              <tr class="row-total"><td>総売上</td><td class="amount-cell">${fmt(grandTotal)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  bindExpenseEvents();
  bindDailyPayEvents();
}

function bindExpenseEvents() {
  const dateKey = reportDateKey();
  document.getElementById("btn-add-expense")?.addEventListener("click", () => {
    const name = document.getElementById("new-expense-name").value.trim();
    const amount = parseInt(document.getElementById("new-expense-amount").value, 10) || 0;
    if (!name && amount <= 0) return;
    const expenses = getExpensesForDate(dateKey);
    expenses.push({ name: name || "経費", amount });
    setExpensesForDate(dateKey, expenses);
    renderDailyReport();
  });

  document.querySelectorAll("#expense-list .btn-expense-del").forEach((b) => {
    b.addEventListener("click", () => {
      const idx = parseInt(b.dataset.eidx, 10);
      const expenses = getExpensesForDate(dateKey);
      expenses.splice(idx, 1);
      setExpensesForDate(dateKey, expenses);
      renderDailyReport();
    });
  });

  document.querySelectorAll("#expense-list .expense-input-row input").forEach((inp) => {
    inp.addEventListener("change", () => {
      const row = inp.closest(".expense-input-row");
      const idx = parseInt(row.dataset.eidx, 10);
      const expenses = getExpensesForDate(dateKey);
      if (expenses[idx]) {
        if (inp.dataset.field === "name") expenses[idx].name = inp.value.trim();
        if (inp.dataset.field === "amount") expenses[idx].amount = parseInt(inp.value, 10) || 0;
        setExpensesForDate(dateKey, expenses);
        const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        document.getElementById("expense-total-display").textContent = fmt(total);
      }
    });
  });
}

function bindDailyPayEvents() {
  const dateKey = reportDateKey();
  const dpEl = document.getElementById("report-daily-pay");
  const tsEl = document.getElementById("report-tainyu-salary");

  const save = () => {
    setDailyPayForDate(dateKey, {
      dailyPay: parseInt(dpEl?.value, 10) || 0,
      tainyuSalary: parseInt(tsEl?.value, 10) || 0,
    });
  };

  dpEl?.addEventListener("change", save);
  tsEl?.addEventListener("change", save);
}

// ============================
// PDF Download
// ============================
document.getElementById("btn-pdf-download").addEventListener("click", () => {
  const content = document.getElementById("daily-report-content");
  const dateLabel = document.getElementById("report-date-label").textContent;

  const printWin = window.open("", "_blank");
  if (!printWin) {
    alert("ポップアップがブロックされました。許可してください。");
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="ja"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>日報 - ${escapeHtml(dateLabel)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: "Noto Sans JP", sans-serif; background: #fff; color: #000; padding: 20px; overflow: auto; height: auto; }
.hidden { display: none !important; }
.report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.report-cast-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.report-section { background: #fff; border: 1px solid #999; border-radius: 8px; padding: 14px; margin-bottom: 14px; break-inside: avoid; }
.report-section h3 { font-size: 14px; font-weight: 700; color: #333; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #ccc; }
.report-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.report-table th, .report-table td { padding: 5px 8px; border: 1px solid #bbb; text-align: center; white-space: nowrap; }
.report-table th { background: #eee; color: #000; font-weight: 700; font-size: 11px; }
.report-table td { color: #000; }
.report-table .row-label { text-align: left; font-weight: 600; color: #333; background: #f5f5f5; }
.report-table .row-total { font-weight: 800; color: #8b6914; background: #fff8e7; }
.report-table .row-total td { border-color: #999; }
.report-table .amount-cell { text-align: right; font-variant-numeric: tabular-nums; }
.report-table .num-cell { text-align: center; }
.report-table .name-cell { text-align: left; }
.new-badge { display: inline-block; font-size: 9px; font-weight: 700; color: #16a34a; background: #dcfce7; padding: 1px 5px; border-radius: 50px; margin-left: 4px; }
.catch-badge { display: inline-block; font-size: 9px; font-weight: 700; color: #2563eb; background: #dbeafe; padding: 1px 5px; border-radius: 50px; margin-left: 4px; }
.expense-total-row { display: flex; justify-content: space-between; padding: 6px 8px; background: #f5f5f5; border-radius: 6px; font-size: 13px; font-weight: 700; color: #333; }
.expense-input-row { display: flex; gap: 6px; margin-bottom: 6px; align-items: center; }
.expense-input-row input { padding: 4px 6px; border: 1px solid #bbb; border-radius: 4px; background: #fff; color: #000; font-size: 12px; }
.expense-input-row input[type="text"] { flex: 1; }
.expense-input-row input[type="number"] { width: 100px; text-align: right; }
.btn-expense-del, .btn-expense-add { display: none !important; }
.expense-input-row:not([data-eidx]) { display: none !important; }
.daily-pay-row { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
.daily-pay-row label { font-size: 12px; font-weight: 600; color: #333; min-width: 60px; }
.daily-pay-row input { width: 120px; padding: 4px 6px; border: 1px solid #bbb; border-radius: 4px; background: #fff; color: #000; font-size: 12px; text-align: right; }
.report-print-header { text-align: center; margin-bottom: 20px; }
.report-print-header h1 { font-family: "Cormorant Garamond", serif; font-size: 28px; letter-spacing: 4px; margin-bottom: 4px; color: #000; }
.report-print-header p { font-size: 16px; color: #555; }
@media print { body { padding: 0; margin: 10px; } }
</style>
</head><body>
<div class="report-print-header"><h1>Gift</h1><p>日報 ─ ${escapeHtml(dateLabel)}</p></div>
${content.innerHTML}
<script>document.fonts.ready.then(function(){ setTimeout(function(){ window.print(); }, 200); });</script>
</body></html>`;
  printWin.document.write(html);
  printWin.document.close();
});

// ============================
// Mobile Cart
// ============================
const mobileCartBtn = document.getElementById("mobile-cart-btn");
const mobileCartOverlay = document.getElementById("mobile-cart-overlay");
const cartPanel = document.querySelector(".cart-panel");
function openMobileCart() {
  cartPanel.classList.add("open");
  mobileCartOverlay.classList.remove("hidden");
  mobileCartBtn.classList.add("hidden");
}
function closeMobileCart() {
  cartPanel.classList.remove("open");
  mobileCartOverlay.classList.add("hidden");
  mobileCartBtn.classList.remove("hidden");
}
mobileCartBtn.addEventListener("click", openMobileCart);
mobileCartOverlay.addEventListener("click", closeMobileCart);
function updateMobileBadge() {
  const b = document.getElementById("mobile-cart-badge");
  const n = state.cart.reduce((s, i) => s + i.qty, 0);
  b.textContent = n;
  b.classList.toggle("hidden-badge", n === 0);
}

// ============================
// Init
// ============================
renderCategories();
renderMenu();
renderCart();
updateTableBadge();
