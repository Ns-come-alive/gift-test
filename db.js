// ============================
// Firebase 初期化
// ============================
// ★★★ 以下の値をFirebase Consoleのプロジェクト設定から取得して差し替えてください ★★★
// Firebase Console → プロジェクト設定（⚙️）→ 全般 → 「マイアプリ」→ ウェブアプリ追加（</>）
// → アプリ名を入力して登録 → 表示される firebaseConfig をコピー
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================
// Firestore ヘルパー関数
// ============================
const DB = {
  // --- 注文 (orders) ---
  async loadOrders() {
    const snap = await db.collection("orders").orderBy("id", "asc").get();
    return snap.docs.map((d) => d.data());
  },

  async saveOrder(order) {
    await db.collection("orders").doc(String(order.id)).set(order);
  },

  async deleteOrder(orderId) {
    await db.collection("orders").doc(String(orderId)).delete();
  },

  async loadOrderCounter() {
    const doc = await db.collection("meta").doc("orderCounter").get();
    return doc.exists ? doc.data().value : 0;
  },

  async saveOrderCounter(val) {
    await db.collection("meta").doc("orderCounter").set({ value: val });
  },

  // --- キャスト名簿 ---
  async loadCastList() {
    const doc = await db.collection("meta").doc("castList").get();
    return doc.exists ? doc.data().list : [];
  },

  async saveCastList(arr) {
    await db.collection("meta").doc("castList").set({ list: arr });
  },

  // --- 卓セッション ---
  async loadSessions() {
    const doc = await db.collection("meta").doc("sessions").get();
    return doc.exists ? doc.data() : {};
  },

  async saveSessions(obj) {
    await db.collection("meta").doc("sessions").set(obj);
  },

  // --- 経費 ---
  async loadExpenses() {
    const doc = await db.collection("meta").doc("expenses").get();
    return doc.exists ? doc.data() : {};
  },

  async saveExpenses(obj) {
    await db.collection("meta").doc("expenses").set(obj);
  },

  // --- 日払い ---
  async loadDailyPay() {
    const doc = await db.collection("meta").doc("dailyPay").get();
    return doc.exists ? doc.data() : {};
  },

  async saveDailyPay(obj) {
    await db.collection("meta").doc("dailyPay").set(obj);
  },

  // --- リアルタイムリスナー ---
  onOrdersChange(callback) {
    return db.collection("orders").orderBy("id", "asc").onSnapshot((snap) => {
      callback(snap.docs.map((d) => d.data()));
    });
  },

  onSessionsChange(callback) {
    return db.collection("meta").doc("sessions").onSnapshot((doc) => {
      callback(doc.exists ? doc.data() : {});
    });
  },

  onCastListChange(callback) {
    return db.collection("meta").doc("castList").onSnapshot((doc) => {
      callback(doc.exists ? doc.data().list : []);
    });
  },
};
