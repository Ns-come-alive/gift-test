// ============================
// 月シート書き出しモジュール
// 1シート内に3エリア + 流入経路を配置
// ============================

/**
 * 月シート全体を書き出し
 */
function writeMonthlySheet(sheet, data, year, month) {
  sheet.clear();

  writeDailyDashboard_(sheet, data, year, month);
  writeSourceDashboard_(sheet, data, year, month);
  writeCastSummary_(sheet, data.castSales);
  var lastDetailRow = writeDetailSections_(sheet, data);
  applyFormatting_(sheet, data, lastDetailRow);
}

// ============================
// エリア1: 日別売上ダッシュボード (A1:L33)
// ============================

function writeDailyDashboard_(sheet, data, year, month) {
  var rows = [];
  rows.push(DAILY_HEADERS);

  for (var day = 1; day <= 31; day++) {
    if (day > data.daysInMonth) {
      rows.push(emptyRow_(DAILY_COL_COUNT));
      continue;
    }
    var dow = new Date(year, month - 1, day).getDay();
    var ds = data.dailySummaries[day];
    if (ds) {
      rows.push([
        day, DOW_NAMES[dow], ds.groups, ds.guests,
        ds.cash, ds.card, ds.grandTotal,
        ds.expense, ds.dailyPay, ds.transport, ds.tainyu, ""
      ]);
    } else {
      var r = emptyRow_(DAILY_COL_COUNT);
      r[0] = day;
      r[1] = DOW_NAMES[dow];
      rows.push(r);
    }
  }

  var totalRow = emptyRow_(DAILY_COL_COUNT);
  totalRow[0] = "合計";
  rows.push(totalRow);

  sheet.getRange(1, 1, rows.length, DAILY_COL_COUNT).setValues(rows);

  for (var col = 3; col <= 11; col++) {
    var letter = colLetter_(col);
    sheet.getRange(DAILY_TOTAL_ROW, col)
      .setFormula("=SUM(" + letter + DAILY_DATA_START + ":" + letter + (DAILY_DATA_START + 30) + ")");
  }
}

// ============================
// 流入経路 日別 (N1:U33)
// ============================

function writeSourceDashboard_(sheet, data, year, month) {
  var rows = [];
  rows.push(SOURCE_DAILY_HEADERS);

  for (var day = 1; day <= 31; day++) {
    if (day > data.daysInMonth) {
      rows.push(emptyRow_(SOURCE_COL_COUNT));
      continue;
    }
    var ds = data.dailySummaries[day];
    if (ds && ds.sources) {
      var srcRow = [];
      SOURCE_DAILY_HEADERS.forEach(function(h) {
        srcRow.push(ds.sources[h] || "");
      });
      rows.push(srcRow);
    } else {
      rows.push(emptyRow_(SOURCE_COL_COUNT));
    }
  }

  var totalRow = emptyRow_(SOURCE_COL_COUNT);
  rows.push(totalRow);

  sheet.getRange(1, SOURCE_START_COL, rows.length, SOURCE_COL_COUNT).setValues(rows);

  for (var i = 0; i < SOURCE_COL_COUNT; i++) {
    var col = SOURCE_START_COL + i;
    var letter = colLetter_(col);
    sheet.getRange(DAILY_TOTAL_ROW, col)
      .setFormula("=SUM(" + letter + DAILY_DATA_START + ":" + letter + (DAILY_DATA_START + 30) + ")");
  }
}

// ============================
// エリア2: キャスト別 月間集計 (W1:AF)
// ============================

function writeCastSummary_(sheet, castSales) {
  var rows = [];
  rows.push(CAST_HEADERS);

  castSales.forEach(function(c) {
    rows.push([
      c.castName, c.subtotal, c.honshimei, c.bannai,
      c.drink, c.shot, c.catchCnt, c.douhan,
      c.dailyPay, c.transport
    ]);
  });

  if (rows.length > 0) {
    sheet.getRange(CAST_HEADER_ROW, CAST_START_COL, rows.length, CAST_HEADERS.length)
      .setValues(rows);
  }
}

// ============================
// エリア3: 明細データ (A36~)
// ============================

function writeDetailSections_(sheet, data) {
  var row = DETAIL_START_ROW;

  row = writeDetailBlock_(sheet, row, "■ ボトルバック明細", BOTTLE_HEADERS,
    data.bottleDetails.map(function(b) {
      return [b.date, b.cast, b.orderNum, b.itemName, b.amount, b.note];
    })
  );

  row = writeDetailBlock_(sheet, row, "■ 売掛明細", URIKAKE_HEADERS,
    data.urikake.map(function(u) {
      return [u.date, u.orderNum, u.customerName, u.total, u.type, u.deposit, u.remain];
    })
  );

  row = writeDetailBlock_(sheet, row, "■ 新規流入明細", SOURCE_DETAIL_HEADERS,
    data.newSource.map(function(s) {
      return [s.date, s.orderNum, s.source, s.catchInfo, s.guests];
    })
  );

  row = writeDetailBlock_(sheet, row, "■ 経費・日払い明細", EXPENSE_HEADERS,
    data.expenses.map(function(e) {
      return [e.date, e.type, e.name, e.amount];
    })
  );

  return row;
}

function writeDetailBlock_(sheet, startRow, title, headers, dataRows) {
  sheet.getRange(startRow, 1).setValue(title);
  startRow++;

  sheet.getRange(startRow, 1, 1, headers.length).setValues([headers]);
  startRow++;

  if (dataRows.length > 0) {
    sheet.getRange(startRow, 1, dataRows.length, dataRows[0].length).setValues(dataRows);
    startRow += dataRows.length;
  }

  return startRow + 1;
}

// ============================
// セル書式・見た目
// ============================

function applyFormatting_(sheet, data, lastDetailRow) {
  var blue     = "#4472C4";
  var orange   = "#ED7D31";
  var green    = "#70AD47";
  var white    = "#FFFFFF";
  var grayBg   = "#D9E2F3";
  var detailTitleBg  = "#FFF2CC";
  var detailHeaderBg = "#E2EFDA";

  var border = SpreadsheetApp.BorderStyle.SOLID;
  var numEnd = Math.min(data.daysInMonth, 31);

  // --- エリア1: 日別ダッシュボード ---
  sheet.getRange(DAILY_HEADER_ROW, 1, 1, DAILY_COL_COUNT)
    .setFontWeight("bold").setBackground(blue).setFontColor(white)
    .setHorizontalAlignment("center");

  sheet.getRange(DAILY_TOTAL_ROW, 1, 1, DAILY_COL_COUNT)
    .setFontWeight("bold").setBackground(grayBg);

  if (numEnd > 0) {
    sheet.getRange(DAILY_DATA_START, 5, numEnd, 7).setNumberFormat("#,##0");
    sheet.getRange(DAILY_DATA_START, 1, numEnd, 2).setHorizontalAlignment("center");
  }
  sheet.getRange(DAILY_TOTAL_ROW, 3, 1, 9).setNumberFormat("#,##0");

  sheet.getRange(DAILY_HEADER_ROW, 1, DAILY_TOTAL_ROW, DAILY_COL_COUNT)
    .setBorder(true, true, true, true, true, true, "#B4B4B4", border);

  // --- 流入経路 ---
  sheet.getRange(DAILY_HEADER_ROW, SOURCE_START_COL, 1, SOURCE_COL_COUNT)
    .setFontWeight("bold").setBackground(orange).setFontColor(white)
    .setHorizontalAlignment("center");

  sheet.getRange(DAILY_TOTAL_ROW, SOURCE_START_COL, 1, SOURCE_COL_COUNT)
    .setFontWeight("bold").setBackground(grayBg);

  if (numEnd > 0) {
    sheet.getRange(DAILY_DATA_START, SOURCE_START_COL, numEnd, SOURCE_COL_COUNT)
      .setHorizontalAlignment("center");
  }
  sheet.getRange(DAILY_TOTAL_ROW, SOURCE_START_COL, 1, SOURCE_COL_COUNT)
    .setNumberFormat("#,##0");

  sheet.getRange(DAILY_HEADER_ROW, SOURCE_START_COL, DAILY_TOTAL_ROW, SOURCE_COL_COUNT)
    .setBorder(true, true, true, true, true, true, "#B4B4B4", border);

  // --- エリア2: キャスト集計 ---
  if (data.castSales.length > 0) {
    sheet.getRange(CAST_HEADER_ROW, CAST_START_COL, 1, CAST_HEADERS.length)
      .setFontWeight("bold").setBackground(green).setFontColor(white)
      .setHorizontalAlignment("center");

    var castDataCount = data.castSales.length;
    sheet.getRange(CAST_DATA_START, CAST_START_COL + 1, castDataCount, CAST_HEADERS.length - 1)
      .setNumberFormat("#,##0");

    sheet.getRange(CAST_HEADER_ROW, CAST_START_COL, castDataCount + 1, CAST_HEADERS.length)
      .setBorder(true, true, true, true, true, true, "#B4B4B4", border);
  }

  // --- エリア3: 明細セクション ---
  var detailRow = DETAIL_START_ROW;
  var sections = [
    { headers: BOTTLE_HEADERS, count: data.bottleDetails.length },
    { headers: URIKAKE_HEADERS, count: data.urikake.length },
    { headers: SOURCE_DETAIL_HEADERS, count: data.newSource.length },
    { headers: EXPENSE_HEADERS, count: data.expenses.length },
  ];

  sections.forEach(function(sec) {
    sheet.getRange(detailRow, 1).setFontWeight("bold").setFontSize(11)
      .setBackground(detailTitleBg);
    sheet.getRange(detailRow, 1, 1, sec.headers.length).setBackground(detailTitleBg);
    detailRow++;

    sheet.getRange(detailRow, 1, 1, sec.headers.length)
      .setFontWeight("bold").setBackground(detailHeaderBg).setHorizontalAlignment("center");
    detailRow++;

    if (sec.count > 0) {
      var amtCol = sec.headers.indexOf("金額") + 1;
      if (amtCol > 0) sheet.getRange(detailRow, amtCol, sec.count, 1).setNumberFormat("#,##0");
      var depositCol = sec.headers.indexOf("入金") + 1;
      if (depositCol > 0) sheet.getRange(detailRow, depositCol, sec.count, 1).setNumberFormat("#,##0");
      var remainCol = sec.headers.indexOf("残高") + 1;
      if (remainCol > 0) sheet.getRange(detailRow, remainCol, sec.count, 1).setNumberFormat("#,##0");
      detailRow += sec.count;
    }

    detailRow++;
  });

  // --- 列幅 ---
  sheet.setColumnWidth(1, 40);
  sheet.setColumnWidth(2, 30);
  sheet.setColumnWidth(3, 45);
  sheet.setColumnWidth(4, 45);
  for (var c = 5; c <= 11; c++) { sheet.setColumnWidth(c, 80); }
  sheet.setColumnWidth(12, 100);

  for (var s = SOURCE_START_COL; s < SOURCE_START_COL + SOURCE_COL_COUNT; s++) {
    sheet.setColumnWidth(s, 65);
  }

  sheet.setColumnWidth(CAST_START_COL, 90);
  for (var c2 = CAST_START_COL + 1; c2 < CAST_START_COL + CAST_HEADERS.length; c2++) {
    sheet.setColumnWidth(c2, 80);
  }

  sheet.setFrozenRows(1);
}

// ============================
// Utility
// ============================

function emptyRow_(len) {
  var r = [];
  for (var i = 0; i < len; i++) r.push("");
  return r;
}

function colLetter_(colNum) {
  if (colNum <= 26) return String.fromCharCode(64 + colNum);
  return String.fromCharCode(64 + Math.floor((colNum - 1) / 26))
       + String.fromCharCode(65 + ((colNum - 1) % 26));
}
