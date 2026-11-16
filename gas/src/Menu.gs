/* ===== 試算表選單版（架構改造第 2 步）=====
 * 老師在自己的成績試算表副本操作；管理功能不再經由網頁部署。
 */
var APP_VERSION_='1.0.0';
var SITE_URL_='https://ntccar01.github.io/auto-electrical-open/';
var UNITS_=[{id:'horn',name:'喇叭系統',path:'units/horn/'},{id:'start',name:'起動系統',path:'units/start/'}];

function onOpen() {
  var ui=SpreadsheetApp.getUi();
  ui.createMenu('汽車電系')
    .addItem('① 初始設定','menuSetup')
    .addItem('② 學生連結與 QR Code','menuLinks')
    .addSeparator()
    .addItem('名單與代碼','menuRoster')
    .addItem('開放上傳','menuUpload')
    .addItem('匯入成績檔','menuImport')
    .addItem('覆閱與核章','menuReview')
    .addSeparator()
    .addItem('檢查更新','menuUpdate')
    .addSubMenu(ui.createMenu('進階').addItem('證書與面試報告','menuAdvanced'))
    .addToUi();
}
function onInstall(){onOpen();}

function teacherPage_(section){
  return HtmlService.createHtmlOutput('<script>window.NTC_SECTION='+JSON.stringify(section)+';</script>'+HtmlService.createHtmlOutputFromFile('Teacher').getContent());
}
function sidebar_(section,title){SpreadsheetApp.getUi().showSidebar(teacherPage_(section).setTitle(title));}
function dialog_(section,title){SpreadsheetApp.getUi().showModalDialog(teacherPage_(section).setWidth(1200).setHeight(720),title);}
function needSetup_(){
  if(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'))return false;
  SpreadsheetApp.getUi().alert('請先執行選單「汽車電系 → ① 初始設定」。');return true;
}
function menuRoster(){if(!needSetup_())sidebar_('roster','名單與代碼');}
function menuUpload(){if(!needSetup_())sidebar_('upload','開放上傳');}
function menuImport(){if(!needSetup_())dialog_('import','匯入成績檔');}
function menuReview(){if(!needSetup_())dialog_('review','覆閱與核章');}
function menuAdvanced(){if(!needSetup_())dialog_('advanced','證書與面試報告');}

/* 初始設定：可重複執行，不會清除資料。 */
function setupInfo_(){
  var props=PropertiesService.getScriptProperties();
  return {email:String(Session.getActiveUser().getEmail()||Session.getEffectiveUser().getEmail()||''),
    semester:props.getProperty('SEMESTER')||defaultSemester_(),done:!!props.getProperty('SPREADSHEET_ID'),version:APP_VERSION_};
}
function defaultSemester_(){
  var d=new Date(new Date().getTime()+8*3600000),y=d.getUTCFullYear()-1911,m=d.getUTCMonth()+1;
  if(m>=8)return y+'-1';if(m===1)return (y-1)+'-1';return (y-1)+'-2';
}
function runSetup(semester){
  semester=code_(String(semester||'').trim(),'學期');
  var book=SpreadsheetApp.getActiveSpreadsheet(),props=PropertiesService.getScriptProperties();
  var email=String(Session.getActiveUser().getEmail()||Session.getEffectiveUser().getEmail()||'').toLowerCase();
  if(!email)throw new Error('讀不到你的 Google 帳號，請重新整理試算表後再試。');
  var old=String(props.getProperty('TEACHER_EMAILS')||'').toLowerCase().split(',').map(function(s){return s.trim();}).filter(Boolean);
  if(old.length&&old.indexOf(email)<0)throw new Error('這份試算表已由 '+old[0]+' 完成設定，只有原設定者可以再次執行。');
  props.setProperties({SPREADSHEET_ID:book.getId(),TEACHER_EMAILS:old.length?old.join(','):email,SEMESTER:semester});
  if(!props.getProperty('CERT_SIGNING_KEY'))props.setProperty('CERT_SIGNING_KEY',Utilities.getUuid()+Utilities.getUuid());
  ['NTC_Grades','NTC_Roster','NTC_Certificates'].forEach(function(n){sheet_(n);});
  var first=book.getSheetByName('工作表1')||book.getSheetByName('Sheet1');
  if(first&&first.getLastRow()===0&&book.getSheets().length>1)book.deleteSheet(first);
  return setupInfo_();
}
function menuSetup(){
  var info=setupInfo_();
  var html='<style>body{font:15px system-ui,sans-serif;color:#243746}input,button{font:inherit;padding:6px 10px}button{background:#1e8449;color:#fff;border:0;border-radius:6px;cursor:pointer}.ok{color:#1e8449}.bad{color:#c0392b}</style>'
    +'<p>教師帳號：<b>'+escape_(info.email)+'</b></p>'
    +'<p>學期：<input id="sem" value="'+escape_(info.semester)+'" size="8"> <small>例如 115-1</small></p>'
    +'<p><button id="go">'+(info.done?'重新套用設定':'開始設定')+'</button></p><p id="msg"></p>'
    +'<p style="color:#5d6d7e;font-size:13px">會建立成績、名單、證書三個工作表，並產生這份試算表專屬的簽章密鑰。重複執行不會清除資料。</p>'
    +'<script>document.getElementById("go").onclick=function(){var m=document.getElementById("msg");m.textContent="設定中…";this.disabled=true;var b=this;'
    +'google.script.run.withFailureHandler(function(e){b.disabled=false;m.className="bad";m.textContent=e.message;})'
    +'.withSuccessHandler(function(r){b.disabled=false;m.className="ok";m.textContent="✅ 設定完成（學期 "+r.semester+"）。下一步：選單「② 學生連結與 QR Code」。";})'
    +'.runSetup(document.getElementById("sem").value);};</script>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(460).setHeight(300),'初始設定');
}
function escape_(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* 學生連結：上傳部署 ID、老師稱呼存在指令碼屬性。 */
function deployId_(text){
  var s=String(text||'').trim();if(!s)return '';
  var m=s.match(/\/s\/(AKfycb[\w-]{20,200})\/exec/)||s.match(/^(AKfycb[\w-]{20,200})$/);
  if(!m)throw new Error('上傳網址格式不對：請貼上「網頁應用程式」部署的網址（…/macros/s/AKfycb…/exec）。');
  return m[1];
}
function linkInfo(){
  teacher_();var p=PropertiesService.getScriptProperties();
  return {deployId:p.getProperty('UPLOAD_DEPLOY_ID')||'',teacherName:p.getProperty('TEACHER_NAME')||'',site:SITE_URL_,units:UNITS_};
}
function saveLinkInfo(uploadUrl,teacherName){
  teacher_();
  var id=deployId_(uploadUrl);teacherName=String(teacherName||'').trim();
  if(teacherName&&!/^[^<>&"'`]{1,20}$/.test(teacherName))throw new Error('老師稱呼限 20 字，不能有 < > & 引號。');
  PropertiesService.getScriptProperties().setProperties({UPLOAD_DEPLOY_ID:id,TEACHER_NAME:teacherName});
  return linkInfo();
}
function menuLinks(){
  if(needSetup_())return;
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutputFromFile('Links').setWidth(1100).setHeight(720),'學生連結與 QR Code');
}

/* 檢查更新：讀網站上的 version.json，比對版本號。 */
function versionCompare_(a,b){
  var x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);
  for(var i=0;i<3;i++){var d=(x[i]||0)-(y[i]||0);if(d)return d>0?1:-1;}return 0;
}
function checkUpdate_(){
  var res=UrlFetchApp.fetch(SITE_URL_+'dist/version.json?t='+Date.now(),{muteHttpExceptions:true});
  if(res.getResponseCode()!==200)throw new Error('無法連到更新網站（'+res.getResponseCode()+'）。');
  var v=JSON.parse(res.getContentText());
  return {current:APP_VERSION_,latest:v.version,date:v.date,notes:v.notes||[],newer:versionCompare_(v.version,APP_VERSION_)>0,setup:SITE_URL_+'setup.html'};
}
function menuUpdate(){
  var ui=SpreadsheetApp.getUi(),r;
  try{r=checkUpdate_();}catch(e){ui.alert('檢查更新','目前版本 '+APP_VERSION_+'\n'+e.message,ui.ButtonSet.OK);return;}
  if(!r.newer){ui.alert('檢查更新','目前版本 '+r.current+'，已是最新版。',ui.ButtonSet.OK);return;}
  ui.alert('有新版本 '+r.latest,'目前版本 '+r.current+'；最新 '+r.latest+'（'+r.date+'）\n\n'+r.notes.map(function(n){return '・'+n;}).join('\n')+'\n\n更新方法請看：'+r.setup,ui.ButtonSet.OK);
}
