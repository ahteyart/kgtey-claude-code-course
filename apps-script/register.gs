/**
 * Shine On Digital 课程报名 — 接收 /register/ 页面提交的资料
 *
 * Google Drive：Company / Shine on Digital / 课程报名 Registration /
 *   - 资料写进 Sheet「课程报名 Registration 2026」
 *   - 银行转账单存进文件夹「Bank Slips 银行转账单」
 *
 * 部署步骤见 apps-script/README.md
 */

const SHEET_ID = '1pPwhuKpCNG1wmw9vk_pIYFk21Q_kPKlxXjLCk-FJVjk';   // 课程报名 Registration 2026
const FOLDER_ID = '1ErgYyjw08BTia7DecjBr94jzlwvcF5vo';             // Bank Slips 银行转账单
const SHEET_NAME = '课程报名 Registration';
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
const HEADERS = ['提交时间', '报名编号', '姓名', '公司名称', '联系号码', '行业', '电邮',
  '课程', '上课日期', 'Vibe Coding 人数', '第二位学员姓名', '应付金额 (RM)', '银行转账单', '备注', '处理状态'];

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
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.appendRow(HEADERS);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }

    const tz = Session.getScriptTimeZone() || 'Asia/Kuala_Lumpur';
    const now = new Date();
    const id = 'REG-' + Utilities.formatDate(now, tz, 'yyMMdd') + '-' + String(sh.getLastRow()).padStart(3, '0');

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const ext = (String(d.file.name || '').match(/\.[a-z0-9]{2,5}$/i) || [''])[0];
    const safeName = clean(d.name).replace(/[\\\/:*?"<>|]/g, '').slice(0, 40);
    const blob = Utilities.newBlob(bytes, mime, id + ' ' + safeName + ext);
    const file = folder.createFile(blob);

    sh.appendRow([
      now, id, clean(d.name), clean(d.company), "'" + clean(d.phone), clean(d.industry), clean(d.email),
      clean(d.courseText), clean(d.dateText), clean(d.pax), clean(d.name2), Number(d.amount) || '',
      file.getUrl(), clean(d.note), '待核对'
    ]);

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

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
