# 汽車電系模擬教學平台

高職汽車科「汽車電系」實習的模擬教學工具：學生在網頁上配線、使用三用電表量測、找出故障並維修；老師用 Google 試算表收成績、覆閱與核章。

- 目前單元：**喇叭電路**、**起動系統**（含元件台架）
- 學生端：純 HTML／CSS／JavaScript，免安裝，電腦、平板、手機皆可
- 老師端：Google Apps Script＋Google 試算表；學生用 6 碼代碼上傳成績或下載成績檔
- 安全程序：量電阻前須「拆下電瓶負極」斷電，帶電量電阻會被阻止

## 給老師

請看設定說明頁：https://ntccar01.github.io/auto-electrical-open/setup.html （約 10 分鐘，不需要寫程式）。

開發者：程式原始碼在 `gas/src`，`node tools/build-gas.cjs` 打包成 `dist/Code.gs`。

## 授權

[CC BY-NC 4.0](LICENSE.md)：可自由分享、改作，需標示原作者，不可商業使用。
資料與隱私說明見 [PRIVACY.md](PRIVACY.md)。

原作者：林慶泓 老師（國立臺東專科學校 汽車科）
