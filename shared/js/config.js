/* NTC 電系實習平台共用設定（V2-P0）
 * 老師只改這檔：GAS URL、學期、單元開關、配分。
 * 凍結 API：各單元不得自行新增全域 key，統一經 NTC_CONFIG 讀取。
 */
window.NTC_CONFIG = {
  version: '2.0-P0',
  // 學生線上上傳端點（同一 Apps Script 另建「任何人」存取的部署）；空白則只能下載成績檔交給老師
  uploadUrl: 'https://script.google.com/macros/s/AKfycbxSBB7j9D75LOgqQNx9smKyjKquYHKVfd_LdoZ0XVVFfFDZT6LNwm-GOEzhPOpbLldv/exec',
  semester: '115-1',
  // 單元註冊表：採計勾選與學習地圖由此驅動
  units: [
    { id: 'horn', name: '喇叭系統', enabled: true },
    { id: 'start', name: '起動系統', enabled: true }
  ],
  // 評分預設權重（查修 / 綜合，P2 評分引擎使用）
  scoring: {
    diagnose: { result: 40, process: 40, conduct: 20 },
    combo: { wiring: 30, diagnose: 70 },
    wiring: { correctness: 70, neatness: 10, time: 20 },
    teacherAdjustMax: 10
  },
  // 雷達圖預設：能力五軸（教師可勾選採計單元改變計入範圍）
  radarAxes: ['配線', '量測', '診斷', '儀器操作', '效率']
};

/* 老師連結參數（架構改造第 1 步）
 * 學生網址 ?u=<上傳部署ID>&c=<班級代號>&t=<老師稱呼>
 * 第一次從連結進入後存在瀏覽器，之後從首頁進其他單元也沿用。
 * 沒有 u：沿用上面的預設 uploadUrl（過渡期；外校版會留白）。 */
(function () {
  var KEY = 'ntc-teacher-v1';
  var cfg = window.NTC_CONFIG;
  function clean(s, re) { s = (s || '').trim(); return re.test(s) ? s : ''; }
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }
  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
  if (q && (q.has('u') || q.has('c') || q.has('t'))) {
    saved = {
      u: clean(q.get('u'), /^AKfycb[\w-]{20,200}$/),
      c: clean(q.get('c'), /^[\p{L}\p{N}][\p{L}\p{N}_-]{0,29}$/u),
      t: clean(q.get('t'), /^[^<>&"'`]{1,20}$/)
    };
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
  }
  cfg.teacher = { name: saved.t || '', cls: saved.c || '', linked: !!(saved.u || saved.c || saved.t) };
  if (saved.u) cfg.uploadUrl = 'https://script.google.com/macros/s/' + saved.u + '/exec';
  else if (cfg.teacher.linked) cfg.uploadUrl = ''; // 從老師連結進來但沒有 u：只能交 CSV

  function applyUi() {
    var cls = document.getElementById('inputClass');
    if (cls && cfg.teacher.cls && !cls.value) cls.value = cfg.teacher.cls;
    if (cls && cfg.teacher.name && !document.getElementById('teacherBadge')) {
      var p = document.createElement('p');
      p.id = 'teacherBadge';
      p.className = 'teacher-badge';
      p.textContent = cfg.uploadUrl ? '成績將上傳給：' + cfg.teacher.name : '成績檔請交給：' + cfg.teacher.name;
      var form = document.getElementById('loginForm');
      if (form) form.parentNode.insertBefore(p, form);
    }
    if (!cfg.uploadUrl) {
      var btns = document.querySelectorAll('.btn-cloud');
      for (var i = 0; i < btns.length; i++) btns[i].hidden = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyUi);
  else applyUi();
})();
