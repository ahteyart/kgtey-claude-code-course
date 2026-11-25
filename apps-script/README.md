# 报名表格后台（Google Apps Script）

`/register/` 报名页会把资料和银行转账单发到这个脚本。脚本把资料写进 Google Sheet，转账单存进 Google Drive。

## 一次性设置（约 5 分钟）

1. 打开 Google Sheet「Invoice Form Responses 发票表单回复」（分页「课程报名 Registration」已经建好）。
2. 点菜单 **扩展程序 (Extensions) → Apps Script**。
3. 删掉编辑器里原有的代码，把 `register.gs` 的全部内容贴进去，按 **保存**。
4. 点右上角 **部署 (Deploy) → 新部署 (New deployment)**：
   - 类型选 **网页应用 (Web app)**
   - 执行身份 (Execute as)：**我 (Me)**
   - 谁可以访问 (Who has access)：**任何人 (Anyone)**
5. 点 **部署**，Google 会要求授权（会出现「Google 尚未验证此应用」，点 **高级 → 前往（不安全）→ 允许**，这是你自己的脚本）。
6. 复制得到的 **网页应用网址**（`https://script.google.com/macros/s/.../exec`）。
7. 打开 `register/index.html`，找到 `const SCRIPT_URL = "";`，把网址贴进引号里，然后重新部署网站。

## 资料存在哪里
- 资料：同一份 Sheet 的新分页 **「课程报名 Registration」**（第一次有人提交时自动建立）。不会动到「Form Responses 1」。
- 转账单：你的 Google Drive 里的 **「课程报名 Bank Slips」** 文件夹。
- 「处理状态」栏默认是「待核对」，核对付款后可以自己改。

## 以后改了脚本
改完要 **部署 → 管理部署 → 编辑（铅笔）→ 版本选「新版本」→ 部署**，网址不会变。
