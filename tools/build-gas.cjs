#!/usr/bin/env node
/* 把 gas/src 打包成單一檔案 dist/Code.gs，老師更新時只要整份貼上。
 * 用法：node tools/build-gas.cjs
 * 版本號取自 gas/src/Menu.gs 的 APP_VERSION_；更新說明寫在 gas/CHANGELOG.json。 */
const fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..'), src = path.join(root, 'gas', 'src'), out = path.join(root, 'dist');
const read = f => fs.readFileSync(path.join(src, f), 'utf8');
const scripts = ['Server.gs', 'Menu.gs'];
const pages = ['Teacher', 'Links', 'StudentVerify', 'InterviewReport'];

function build() {
  const menu = read('Menu.gs');
  const version = (menu.match(/APP_VERSION_='([\d.]+)'/) || [])[1];
  if (!version) throw new Error('Menu.gs 找不到 APP_VERSION_');
  const html = {};
  for (const p of pages) {
    html[p] = read(p + '.html').replace(/<!--VENDOR:([\w.-]+)-->/g, (_, f) => read(path.join('vendor', f)));
  }
  let code = scripts.map(f => '/* ---------- ' + f + ' ---------- */\n' + read(f)).join('\n\n');
  code = code
    .replace(/HtmlService\.createHtmlOutputFromFile\('(\w+)'\)/g, (_, n) => { if (!html[n]) throw new Error('缺 ' + n + '.html'); return "HtmlService.createHtmlOutput(NTC_HTML_['" + n + "'])"; })
    .replace(/HtmlService\.createTemplateFromFile\('(\w+)'\)/g, (_, n) => { if (!html[n]) throw new Error('缺 ' + n + '.html'); return "HtmlService.createTemplate(NTC_HTML_['" + n + "'])"; });
  const date = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
  const head = '/* 汽車電系模擬教學平台｜成績試算表程式 v' + version + '（' + date + '）\n'
    + ' * 授權：CC BY-NC 4.0　作者：林慶泓 老師（國立臺東專科學校 汽車科）\n'
    + ' * 這是打包後的單一檔案，請勿手改；原始碼在 gas/src。更新方法見 setup.html。 */\n\n';
  const map = 'var NTC_HTML_ = ' + JSON.stringify(html, null, 0).replace(/<\/script/gi, '<\\/script') + ';\n';
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'Code.gs'), head + code + '\n\n/* ---------- 內嵌頁面 ---------- */\n' + map);
  fs.copyFileSync(path.join(root, 'gas', 'appsscript.json'), path.join(out, 'appsscript.json'));
  let notes = [];
  const logFile = path.join(root, 'gas', 'CHANGELOG.json');
  if (fs.existsSync(logFile)) notes = (JSON.parse(fs.readFileSync(logFile, 'utf8'))[version]) || [];
  fs.writeFileSync(path.join(out, 'version.json'), JSON.stringify({ version, date, notes }, null, 2) + '\n');
  return { version, bytes: fs.statSync(path.join(out, 'Code.gs')).size };
}
if (require.main === module) { const r = build(); console.log('dist/Code.gs v' + r.version + '，' + Math.round(r.bytes / 1024) + ' KB'); }
module.exports = { build };
