// ============================
// 集計ロジック（月全体 + 日別）
// ============================

var BOTTLE_BACK_EXCLUDES_ = { 42: true, 43: true, 44: true };
var BOTTLE_BACK_SHOT_IDS_ = { 14: true, 16: true };

function isBottleBackItem_(item) {
  if (item.category === "bottle" && !BOTTLE_BACK_EXCLUDES_[item.id]) return true;
  if (item.category === "champagne" || item.category === "original" || item.category === "wine") return true;
  if (item.category === "shot" && BOTTLE_BACK_SHOT_IDS_[item.id]) return true;
  if (item.isOrigBottle) return true;
  return false;
}

function getOrderCasts_(o) {
  if (!o.cast) return [];
  return String(o.cast).split("・").filter(function(s) { return s.length > 0; });
}

var METHOD_LABELS_ = {
  cash: "現金", card: "カード", card_nofee: "カード(手数料なし)",
  split: "カード&現金", qr: "QR", urikake: "売掛",
};

/**
 * 月全体の集計
 */
function aggregateMonth(monthOrders, meta, year, month) {
  var daysInMonth = new Date(year, month, 0).getDate();

  var ordersByDay = {};
  monthOrders.forEach(function(o) {
    var d = new Date(o.timestamp);
    if (d.getHours() < 20) d.setDate(d.getDate() - 1);
    var day = d.getDate();
    if (!ordersByDay[day]) ordersByDay[day] = [];
    ordersByDay[day].push(o);
  });

  var dailySummaries = {};
  var allBottleDetails = [];
  var allUrikake = [];
  var allNewSource = [];
  var allExpenses = [];

  for (var day = 1; day <= daysInMonth; day++) {
    var dateObj = new Date(year, month - 1, day);
    var dateKey = dateObj.toDateString();
    var dayOrders = ordersByDay[day] || [];
    var dateLabel = month + "/" + day;

    var dateExpenses = (meta.expenses || {})[dateKey] || [];
    var datePay = (meta.dailyPay || {})[dateKey] || {};
    var dailyPayEntries = datePay.entries || [];
    var dateTransport = (meta.transport || {})[dateKey] || [];
    var tainyuSalary = datePay.tainyuSalary || 0;

    var expTotal = 0, dpTotal = 0, trTotal = 0;
    dateExpenses.forEach(function(e) {
      expTotal += (e.amount || 0);
      allExpenses.push({ date: dateLabel, type: "経費", name: e.name || "", amount: e.amount || 0 });
    });
    dailyPayEntries.forEach(function(e) {
      dpTotal += (e.amount || 0);
      allExpenses.push({ date: dateLabel, type: "日払い", name: e.castName || "", amount: e.amount || 0 });
    });
    dateTransport.forEach(function(e) {
      trTotal += (e.amount || 0);
      allExpenses.push({ date: dateLabel, type: "送迎", name: e.castName || "", amount: e.amount || 0 });
    });

    var sources = aggregateSourcesForDay_(dayOrders);

    if (dayOrders.length > 0) {
      var pay = aggregatePayments_(dayOrders);
      var guests = dayOrders.reduce(function(s, o) { return s + (o.guestCount || 0); }, 0);

      dailySummaries[day] = {
        groups: dayOrders.length,
        guests: guests,
        cash: pay.cash, card: pay.card, grandTotal: pay.grandTotal,
        expense: expTotal, dailyPay: dpTotal, transport: trTotal, tainyu: tainyuSalary,
        sources: sources,
      };

      collectDayDetails_(dayOrders, dateLabel, allBottleDetails, allUrikake, allNewSource);
    } else if (expTotal > 0 || dpTotal > 0 || trTotal > 0 || tainyuSalary > 0) {
      dailySummaries[day] = {
        groups: 0, guests: 0,
        cash: 0, card: 0, grandTotal: 0,
        expense: expTotal, dailyPay: dpTotal, transport: trTotal, tainyu: tainyuSalary,
        sources: sources,
      };
    }
  }

  var castSales = aggregateMonthCasts_(monthOrders, meta, year, month, daysInMonth);

  return {
    daysInMonth: daysInMonth,
    dailySummaries: dailySummaries,
    castSales: castSales,
    bottleDetails: allBottleDetails,
    urikake: allUrikake,
    newSource: allNewSource,
    expenses: allExpenses,
  };
}

// ============================
// Internal helpers
// ============================

function aggregatePayments_(orders) {
  var cash = 0, card = 0, qr = 0, urikake = 0, grand = 0;
  orders.forEach(function(o) {
    grand += (o.total || 0);
    if (o.method === "cash") cash += (o.total || 0);
    else if (o.method === "card" || o.method === "card_nofee") card += (o.total || 0);
    else if (o.method === "qr") qr += (o.total || 0);
    else if (o.method === "urikake") urikake += (o.total || 0);
    else if (o.method === "split" && o.splitPayment) {
      cash += (o.splitPayment.cashPart || 0);
      card += (o.splitPayment.cardWithFee || 0);
    }
  });
  return { cash: cash, card: card, qr: qr, urikake: urikake, grandTotal: grand };
}

/**
 * 日別の流入経路別人数を集計
 */
function aggregateSourcesForDay_(orders) {
  var src = {};
  SOURCE_DAILY_HEADERS.forEach(function(h) { src[h] = 0; });

  orders.forEach(function(o) {
    var guests = o.guestCount || 0;
    if (o.customerType === "repeat") {
      src["リピート"] += guests;
    } else if (o.customerType === "new") {
      var s = o.source || "その他";
      if (src.hasOwnProperty(s)) {
        src[s] += guests;
      } else {
        src["その他"] += guests;
      }
    }
  });
  return src;
}

function collectDayDetails_(orders, dateLabel, bottles, urikake, sources) {
  orders.forEach(function(o) {
    var orderNum = "#" + padNum_(o.id || 0);
    var orderCasts = getOrderCasts_(o);
    var isFreeTable = orderCasts.length === 0;

    (o.items || []).forEach(function(item) {
      if (isBottleBackItem_(item)) {
        var amt = (item.price || 0) * (item.qty || 0);
        if (item.isOrigBottle && item.origCastName) {
          var bbAmt = isFreeTable ? Math.floor(amt / 2) : amt;
          bottles.push({ date: dateLabel, cast: item.origCastName, orderNum: orderNum, itemName: item.name, amount: bbAmt, note: isFreeTable ? "フリー卓(半額)" : "" });
        } else if (!isFreeTable) {
          orderCasts.forEach(function(cn) {
            bottles.push({ date: dateLabel, cast: cn, orderNum: orderNum, itemName: item.name, amount: amt, note: "" });
          });
        }
      }
    });

    if (o.method === "urikake" && o.urikake) {
      var u = o.urikake;
      urikake.push({ date: dateLabel, orderNum: orderNum, customerName: u.customerName || "", total: o.total || 0, type: u.type === "partial" ? "分割" : "全額", deposit: u.deposit || 0, remain: u.remain || 0 });
    }

    if (o.customerType === "new") {
      var catches = o.catchNames || (o.catchName ? [o.catchName] : []);
      sources.push({ date: dateLabel, orderNum: orderNum, source: o.source || "不明", catchInfo: catches.join("・"), guests: o.guestCount || 0 });
    }
  });
}

/**
 * 月全体のキャスト別集計（ボトルバック列は除外）
 */
function aggregateMonthCasts_(orders, meta, year, month, daysInMonth) {
  var castAgg = {};
  var allCasts = {};

  function ensure(cn) {
    allCasts[cn] = true;
    if (!castAgg[cn]) castAgg[cn] = { subtotal:0, honshimei:0, bannai:0, drink:0, shot:0, catchCnt:0, douhan:0 };
  }

  orders.forEach(function(o) {
    var oc = getOrderCasts_(o);
    var isFree = oc.length === 0;
    var items = o.items || [];

    if (!isFree) {
      var sub = 0;
      items.forEach(function(i) { if (!i.isGacha) sub += (i.price || 0) * (i.qty || 0); });
      oc.forEach(function(cn) { ensure(cn); castAgg[cn].subtotal += sub; });
    }

    var catches = o.catchNames || (o.catchName ? [o.catchName] : []);
    catches.forEach(function(cn) { ensure(cn); castAgg[cn].catchCnt += (o.guestCount || 1); });

    items.forEach(function(item) {
      var name = String(item.name || "");
      var m;

      m = name.match(/^推し指名（(.+?)）$/);
      if (m) { ensure(m[1]); castAgg[m[1]].honshimei += (item.qty || 0); return; }

      m = name.match(/^場内指名（(.+?)）$/);
      if (m) { ensure(m[1]); castAgg[m[1]].bannai += (item.qty || 0); return; }

      m = name.match(/^(キャストドリンク|キャストショット＋|キャストショット)（(.+?)）$/);
      if (m) {
        ensure(m[2]);
        if (m[1] === "キャストドリンク") castAgg[m[2]].drink += (item.qty || 0);
        else castAgg[m[2]].shot += (item.qty || 0);
        return;
      }

      m = name.match(/^同伴（(.+?)）$/);
      if (m) { ensure(m[1]); castAgg[m[1]].douhan += (item.qty || 0); return; }
    });
  });

  var dpByCast = {};
  var trByCast = {};
  for (var day = 1; day <= daysInMonth; day++) {
    var dk = new Date(year, month - 1, day).toDateString();
    var dp = (meta.dailyPay || {})[dk] || {};
    (dp.entries || []).forEach(function(e) {
      if (e.castName) { dpByCast[e.castName] = (dpByCast[e.castName] || 0) + (e.amount || 0); allCasts[e.castName] = true; }
    });
    var tr = (meta.transport || {})[dk] || [];
    tr.forEach(function(e) {
      if (e.castName) { trByCast[e.castName] = (trByCast[e.castName] || 0) + (e.amount || 0); allCasts[e.castName] = true; }
    });
  }

  var castNames = Object.keys(allCasts).sort();
  return castNames.map(function(cn) {
    var d = castAgg[cn] || { subtotal:0, honshimei:0, bannai:0, drink:0, shot:0, catchCnt:0, douhan:0 };
    return {
      castName: cn, subtotal: d.subtotal, honshimei: d.honshimei, bannai: d.bannai,
      drink: d.drink, shot: d.shot, catchCnt: d.catchCnt, douhan: d.douhan,
      dailyPay: dpByCast[cn] || 0, transport: trByCast[cn] || 0,
    };
  });
}
