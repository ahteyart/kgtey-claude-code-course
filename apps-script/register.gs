/**
 * Shine On Digital 课程报名 — 接收 /register/ 页面提交的资料
 *
 * Google Drive：Company / Shine on Digital / 课程报名 Registration /
 *   - 资料写进 Sheet「课程报名 Registration 2026」
 *       分页「课程报名 Registration」：一次报名一行（核对付款用）
 *       分页「学员名单 Attendees」：一位学员一行（开 invoice / 点名用）
 *   - 银行转账单存进文件夹「Bank Slips 银行转账单」
 *
 * 部署步骤见 apps-script/README.md
 */

const SHEET_ID = '1pPwhuKpCNG1wmw9vk_pIYFk21Q_kPKlxXjLCk-FJVjk';   // 课程报名 Registration 2026
const FOLDER_ID = '1ErgYyjw08BTia7DecjBr94jzlwvcF5vo';             // Bank Slips 银行转账单
const SHEET_NAME = '课程报名 Registration';
const PEOPLE_SHEET = '学员名单 Attendees';
const MAX_PEOPLE = 50;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
const HEADERS = ['提交时间', '报名编号', '姓名', '公司名称', '联系号码', '行业', '电邮',
  '课程', '上课日期', '人数', '学员总数', '其他学员', '应付金额 (RM)', '银行转账单', '备注', '处理状态'];
const PEOPLE_HEADERS = ['报名编号', '第几位', '姓名', '联系号码', '公司名称', '课程', '上课日期', '提交时间'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const d = JSON.parse(e.postData.contents);

    // 防垃圾：隐藏栏位被填了就当机器人
    if (d.website) return json({ ok: true, id: 'SKIP' });

    const required = ['name', 'company', 'phone', 'industry'];
    for (const k of required) {
      if (!d[k] || String(d[k]).trim().length < 2) return json({ ok: false, error: 'missing_' + k });
    }
    if (!d.courses || !d.courses.length) return json({ ok: false, error: 'missing_course' });
    if (!d.file || !d.file.data) return json({ ok: false, error: 'missing_file' });

    const mime = String(d.file.type || '').toLowerCase();
    if (ALLOWED.indexOf(mime) === -1) return json({ ok: false, error: 'bad_file_type' });
    const bytes = Utilities.base64Decode(d.file.data);
    if (bytes.length > MAX_BYTES) return json({ ok: false, error: 'file_too_large' });

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = tab(ss, SHEET_NAME, HEADERS);
    const ps = tab(ss, PEOPLE_SHEET, PEOPLE_HEADERS);

    const tz = Session.getScriptTimeZone() || 'Asia/Kuala_Lumpur';
    const now = new Date();
    const id = 'REG-' + Utilities.formatDate(now, tz, 'yyMMdd') + '-' + String(sh.getLastRow()).padStart(3, '0');

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const ext = (String(d.file.name || '').match(/\.[a-z0-9]{2,5}$/i) || [''])[0];
    const safeName = clean(d.name).replace(/[\\\/:*?"<>|]/g, '').slice(0, 40);
    const blob = Utilities.newBlob(bytes, mime, id + ' ' + safeName + ext);
    const file = folder.createFile(blob);

    // 第 1 位是联系人，后面是其他学员
    const others = (Array.isArray(d.others) ? d.others : []).slice(0, MAX_PEOPLE - 1);
    const everyone = [{ name: d.name, phone: d.phone, company: d.company }].concat(others);
    const summary = others.map(p => clean(p.name) + ' / ' + String(p.phone || '').trim() + ' / ' + clean(p.company)).join('\n');

    sh.appendRow([
      now, id, clean(d.name), clean(d.company), asText(d.phone), clean(d.industry), clean(d.email),
      clean(d.courseText), clean(d.dateText), clean(d.pax), everyone.length, summary, Number(d.amount) || '',
      file.getUrl(), clean(d.note), '待核对'
    ]);
    ps.getRange(ps.getLastRow() + 1, 1, everyone.length, PEOPLE_HEADERS.length).setValues(
      everyone.map((p, i) => [id, i + 1, clean(p.name), asText(p.phone), clean(p.company),
        clean(d.courseText), clean(d.dateText), now])
    );

    return json({ ok: true, id: id });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'server' });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() {
  return json({ ok: true, service: 'shineondigital-register' });
}

// 防止公式注入（以 = + - @ 开头的内容在 Sheet 里会被当公式）
function clean(v) {
  let s = String(v == null ? '' : v).trim().slice(0, 300);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

// 找分页，没有就建立（含标题行）
function tab(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sh;
}

// 电话号码保持文字格式（开头的 0 / + 不会被 Sheet 吃掉）
function asText(v) {
  const s = String(v == null ? '' : v).trim().slice(0, 40);
  return s ? "'" + s : '';
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
