# Shine On Digital — Claude Code 企业应用基础课程

新山 AI 课程的招生网站（纯静态 HTML，无需构建）。网址：https://shineondigital.com.my

## 目录
- `index.html` — 首页（样式和脚本都在这个文件里）
- `assets/photos/` — 压缩后的课堂照片；`assets/og-image.jpg` — 分享图
- `robots.txt`、`sitemap.xml`、`llms.txt` — 搜索引擎与 AI 爬虫用
- `vercel.json` — 缓存与旧网址 301 跳转；`.vercelignore` — 部署时排除原始照片

## 部署（Vercel）
```bash
npx vercel deploy --prod --yes
```

## 修改前请注意
- WhatsApp 号码在 `index.html` 里的 `WA_NUMBER`。
- 课程资料（时间、人数、学费说法）同时写在页面、FAQ、英文简介、`llms.txt` 和结构化资料（JSON-LD）里，改一处要同步改其他几处。
- 原始照片（`photos/`）不在仓库里；照片里有学员正脸，公开使用前需征得同意。
