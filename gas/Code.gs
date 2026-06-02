// ============================
// Gift POS - メインエントリ + 月シート管理
// ============================

/**
 * 毎日12:00のトリガーを作成（GASエディタで手動実行）
 */
function createDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "exportDailyReport") {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger("exportDailyReport")
    .timeBased()
    .atHour(12)
    .everyDays(1)
    .inTimezone("Asia/Tokyo")
    .create();
  Logger.log("トリガー設定完了: 毎日12:00 (JST) に exportDailyReport を実行します");
}

/**
 * メイン: 本日の営業日報をエクスポート（トリガーから呼ばれる）
 */
function exportDailyReport() {
  var dateObj = getBusinessDateObj_();
  exportForDate(dateObj);
}

/**
 * テスト用: 任意の日付でエクスポート
 * GASエディタで手動実行する場合に使用
 */
function exportToday() {
  exportDailyReport();
}

/**
 * 指定日の月シートを丸ごと書き出し
 */
function exportForDate(dateObj) {
  var year = dateObj.getFullYear();
  var month = dateObj.getMonth() + 1;
  Logger.log("Export: " + year + "/" + month + "/" + dateObj.getDate());

  var allOrders = loadAllOrders();
  var meta = loadMetaDocs();
  var monthOrders = filterOrdersByMonth_(allOrders, year, month);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = getMonthSheetName_(year, month);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  var monthData = aggregateMonth(monthOrders, meta, year, month);
  writeMonthlySheet(sheet, monthData, year, month);

  SpreadsheetApp.flush();
  Logger.log("Export complete: " + sheetName + " (" + monthOrders.length + " orders)");
}

/**
 * GAS Web App エンドポイント（POSからの手動エクスポート用）
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var dateKey = body.dateKey;
    if (!dateKey) {
      return ContentService.createTextOutput(JSON.stringify({ error: "dateKey required" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var dateObj = new Date(dateKey);
    if (isNaN(dateObj.getTime())) {
      return ContentService.createTextOutput(JSON.stringify({ error: "invalid date" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    exportForDate(dateObj);
    return ContentService.createTextOutput(JSON.stringify({ success: true, dateKey: dateKey }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("Gift POS Monthly Report Exporter is running.");
}

// ============================
// Month / Date helpers
// ============================

function getMonthSheetName_(year, month) {
  var reiwa = year - 2018;
  return "R" + reiwa + "年" + month + "月";
}

function filterOrdersByMonth_(orders, year, month) {
  return orders.filter(function(o) {
    if (!o.timestamp) return false;
    var d = new Date(o.timestamp);
    if (isNaN(d.getTime())) return false;
    if (d.getHours() < 20) d.setDate(d.getDate() - 1);
    return d.getFullYear() === year && (d.getMonth() + 1) === month;
  });
}

function getBusinessDateObj_() {
  var now = new Date();
  if (now.getHours() < 20) {
    now.setDate(now.getDate() - 1);
  }
  now.setHours(0, 0, 0, 0);
  return now;
}

function getBusinessDateForTs_(ts) {
  if (!ts) return "";
  var d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  if (d.getHours() < 20) d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d.toDateString();
}

function fmtTime_(ts) {
  if (!ts) return "";
  var d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2);
}

function padNum_(n) {
  return ("0000" + n).slice(-4);
}
