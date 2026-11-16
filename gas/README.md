# gas：成績試算表程式

老師請看網站的設定說明頁：https://ntccar01.github.io/auto-electrical-open/setup.html

## 開發者
- 原始碼：`gas/src/`（Server.gs 伺服器邏輯、Menu.gs 試算表選單、*.html 對話框；vendor/qrcode.js 為 MIT 授權）
- 打包：`node tools/build-gas.cjs` → `dist/Code.gs`、`dist/appsscript.json`、`dist/version.json`
- 改版：修改 `gas/src/Menu.gs` 的 `APP_VERSION_`，在 `gas/CHANGELOG.json` 寫更新說明，再打包；範本試算表也要貼上新版。
- 測試：`node --test tests/gas.test.cjs tests/csv.test.cjs`（直接測打包後的 dist/Code.gs）
- 權限：試算表、連線至外部服務（檢查更新）、顯示對話框。網頁部署（任何人）只收學生上傳與證書查驗，不提供管理頁。
