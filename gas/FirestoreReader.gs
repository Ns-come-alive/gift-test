// ============================
// Firestore REST API Reader
// ============================

/**
 * Firestoreドキュメントの値をJS値に変換
 */
function parseValue_(val) {
  if (!val) return null;
  if (val.stringValue  !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue  !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.nullValue    !== undefined) return null;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.mapValue) {
    var obj = {};
    var fields = val.mapValue.fields || {};
    for (var key in fields) {
      obj[key] = parseValue_(fields[key]);
    }
    return obj;
  }
  if (val.arrayValue) {
    return (val.arrayValue.values || []).map(function(v) { return parseValue_(v); });
  }
  return null;
}

/**
 * Firestoreドキュメントをプレーンオブジェクトに変換
 */
function parseDoc_(doc) {
  var obj = {};
  var fields = doc.fields || {};
  for (var key in fields) {
    obj[key] = parseValue_(fields[key]);
  }
  return obj;
}

/**
 * Firestore REST APIを呼び出し
 */
function firestoreFetch_(path, method, payload) {
  var url = CONFIG.FIRESTORE_BASE + path;
  if (url.indexOf("?") === -1) {
    url += "?key=" + CONFIG.FIREBASE_API_KEY;
  } else {
    url += "&key=" + CONFIG.FIREBASE_API_KEY;
  }
  var options = {
    method: method || "get",
    muteHttpExceptions: true,
    headers: { "Content-Type": "application/json" },
  };
  if (payload) {
    options.payload = JSON.stringify(payload);
  }
  var resp = UrlFetchApp.fetch(url, options);
  if (resp.getResponseCode() !== 200) {
    Logger.log("Firestore error " + resp.getResponseCode() + ": " + resp.getContentText().substring(0, 500));
    return null;
  }
  return JSON.parse(resp.getContentText());
}

/**
 * 全注文をロード（ページネーション付き）
 */
function loadAllOrders() {
  var orders = [];
  var pageToken = null;
  do {
    var path = "/orders?pageSize=300&orderBy=id";
    if (pageToken) path += "&pageToken=" + encodeURIComponent(pageToken);
    var data = firestoreFetch_(path);
    if (!data) break;
    if (data.documents) {
      data.documents.forEach(function(doc) {
        orders.push(parseDoc_(doc));
      });
    }
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  Logger.log("Loaded " + orders.length + " orders from Firestore");
  return orders;
}

/**
 * metaドキュメントをまとめてロード
 */
function loadMetaDocs() {
  var meta = {};
  var docNames = ["dailyPay", "expenses", "transport", "castList", "originalBottles"];
  docNames.forEach(function(name) {
    var data = firestoreFetch_("/meta/" + name);
    meta[name] = data ? parseDoc_(data) : {};
  });
  return meta;
}
