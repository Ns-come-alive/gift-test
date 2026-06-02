// ============================
// Gift POS - 月シート自動出力 設定
// ============================
// ★ セットアップ手順 ★
// 1. Googleスプレッドシートを新規作成（または既存を使用）
// 2. 「拡張機能 > Apps Script」でGASエディタを開く
// 3. gas/ フォルダ内の全 .gs ファイルの内容をGASエディタにコピー
// 4. GASエディタ左の歯車 > プロジェクトの設定 > タイムゾーンを「(GMT+09:00) 東京」に設定
// 5. GASエディタで createDailyTrigger() を実行 → 毎日12時の自動実行が設定される
// 6. (任意) Web Appとしてデプロイし、app.js の GAS_WEB_APP_URL にURLを設定

var CONFIG = {
  FIREBASE_PROJECT_ID: "gift-pos-register",
  FIREBASE_API_KEY: "AIzaSyBkPCCk0pqw4fJ2g_MkjV34PT5JCtsIado",
  FIRESTORE_BASE: "https://firestore.googleapis.com/v1/projects/gift-pos-register/databases/(default)/documents",
};

// === エリア1: 日別売上ダッシュボード (A1:L33) ===
var DAILY_HEADERS = ["日","曜","組数","客数","現金","カード","総売上","経費","日払い","送迎","体入","メモ"];
var DAILY_COL_COUNT = 12;
var DAILY_HEADER_ROW = 1;
var DAILY_DATA_START = 2;
var DAILY_TOTAL_ROW = 33;

// === 流入経路 日別 (N1:U33) — ダッシュボードの右隣 ===
var SOURCE_START_COL = 14;
var SOURCE_DAILY_HEADERS = ["リピート","Google","ポケパラ","看板","インスタ","Tiktok","キャッチ","その他"];
var SOURCE_COL_COUNT = 8;

// === エリア2: キャスト別 月間集計 (W1:AF) ===
var CAST_START_COL = 23;
var CAST_HEADERS = ["キャスト","小計売上","本指名","場内","ドリンク","ショット","キャッチ","同伴","日払い","送迎"];
var CAST_HEADER_ROW = 1;
var CAST_DATA_START = 2;
var CAST_MAX_ROWS = 30;

// === エリア3: 明細データ (A36~) ===
var DETAIL_START_ROW = 36;
var BOTTLE_HEADERS  = ["日付","キャスト","伝票","商品名","金額","備考"];
var URIKAKE_HEADERS = ["日付","伝票","顧客名","金額","タイプ","入金","残高"];
var SOURCE_DETAIL_HEADERS = ["日付","伝票","流入経路","キャッチ","人数"];
var EXPENSE_HEADERS = ["日付","種別","名前","金額"];

// === 表示用 ===
var DOW_NAMES = ["日","月","火","水","木","金","土"];
