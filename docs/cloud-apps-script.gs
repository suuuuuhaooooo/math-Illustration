/* 全班排行榜雲端同步（Google Apps Script，免費）
   1. 建一份新的 Google 試算表 → 擴充功能 → Apps Script → 貼上這份程式碼
   2. 部署 → 新增部署作業 → 類型「網頁應用程式」→ 執行身分「我」、存取權「所有人」
   3. 把產生的 /exec 網址貼到 assets/data/config.js 的 NB_CONFIG.cloud
   試算表的 scores 工作表就是全班成績，老師可以直接看、直接匯出。
   提醒：成績由學生的瀏覽器送出，適合班級同樂，不適合拿來當正式成績。 */
var SHEET = 'scores';
function sh_() { var ss = SpreadsheetApp.getActiveSpreadsheet(); return ss.getSheetByName(SHEET) || ss.insertSheet(SHEET); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  if (d.act !== 'put') return out_({ ok: false });
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sh = sh_();
    if (sh.getLastRow() === 0) sh.appendRow(['key', 'class', 'no', 'name', 'pts', 'lv', 'stk', 'ok', 'tot', 'updated']);
    var key = d.c + '|' + d.no, rows = sh.getDataRange().getValues(), r = -1, i;
    for (i = 1; i < rows.length; i++) if (rows[i][0] === key) { r = i; break; }
    var row = [key, d.c, d.no, d.n, d.pts, d.lv, d.stk, d.ok, d.tot, new Date()];
    if (r < 0) sh.appendRow(row); else sh.getRange(r + 1, 1, 1, row.length).setValues([row]);
  } finally { lock.releaseLock(); }
  return out_({ ok: true });
}
function doGet(e) {
  var c = String(e.parameter.c || '');
  var rows = sh_().getDataRange().getValues().slice(1).filter(function (x) { return String(x[1]) === c; })
    .map(function (x) { return { no: x[2], n: x[3], pts: x[4], lv: x[5], stk: x[6], ok: x[7], tot: x[8] }; });
  return out_(rows);
}
