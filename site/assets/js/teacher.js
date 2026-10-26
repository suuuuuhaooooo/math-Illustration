/* 老師後台：班級分析、學生名單、題庫、設定、資料管理。資料由伺服器彙整，只有名單裡的 teacher 看得到。 */
(function(){
"use strict";
var M=NB.member,app=document.getElementById("app"),h=NB.h,TAB="overview",CLS=null;document.body.classList.add("tpage");
var READY=false;TAB=decodeURIComponent(location.hash.slice(1))||TAB; /* 頁籤記在網址的 # 後面，例如 teacher.html#assign，上一頁與分享網址都能用 */
var TABS_ALL=[["overview","班級分析"],["roster","學生名單"],["assign","派卷"],["bank","題庫"],["settings","設定"],["data","資料管理"],["prints","列印紀錄"],["mocks","模擬考紀錄"],["reports","問題回報"]],TABS=TABS_ALL;/* 老師看不到題庫／設定／資料管理，這三項只有管理員能改 */
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function title(id){var o=NB.flat.filter(function(x){return x.id===id})[0];return o?o.sem+" "+o.num+" "+o.title:id}
function pct(c,n){return n?Math.round(c/n*100):null}
function shell(notabs){app.innerHTML="";var bar=h('<nav class="bar"><a class="back" href="member.html'+(M.subj!=="math"?"?s="+M.subj:"")+'">← 回到學員專區</a></nav>');bar.appendChild(NB.themeBar());app.appendChild(bar);app.appendChild(h('<div class="ruler"></div>'));app.appendChild(h('<h1 class="title"><mark>老師後台</mark>'+(M.U?'<small class="subj-now">'+(M.SUBJ[M.subj]||M.subj)+"</small>":"")+'</h1>'));
 /* 科目切換：帳號開通兩科（老師、管理員預設都有）才顯示；切換後整頁重新載入，名單、題庫、派卷、紀錄都只看那一科 */
 var ss=M.U&&M.U.subjects||[];if(ss.length>1){var sw=h('<div class="ctl subj-sw noprint"><span class="meta">目前科目：</span></div>');ss.forEach(function(k){if(!M.SUBJ[k])return;var b=h('<button class="pen'+(k===M.subj?" go":"")+'"></button>');b.textContent=M.SUBJ[k];b.onclick=function(){if(k===M.subj)return;M.setSubj(k);location.reload()};sw.appendChild(b)});app.appendChild(sw)}
 var tabs=h('<div class="tabs"></div>');TABS.forEach(function(t){var b=h('<button class="pen'+(t[0]===TAB?" go":"")+'">'+t[1]+"</button>");b.onclick=function(){tab(t[0])};tabs.appendChild(b)});if(!notabs)app.appendChild(tabs);
 if(M.catErr)app.appendChild(h('<div class="fb no">讀不到見微理畫（國中理化網站）的單元目錄，所以這裡看不到理化的冊、章、節。請確認 science-illustration 已經推上 GitHub 並完成部署，再重新整理。</div>'))}
function sheet(tag,sub){var s=h('<section class="sheet"><h2><span class="tag">'+tag+'</span>'+(sub||"")+'</h2></section>');app.appendChild(s);return s}
function msg(t,btn){shell(1);var s=sheet("提示","");s.appendChild(h("<p>"+t+'</p>'+(btn||'<a class="pen go" href="member.html">前往登入</a>')))}
/* 老師帳號過期：說明到期日、要找管理員延長；延長後重新整理就能用（/api/me 的過期狀態在 acct 裡） */
function expiredMsg(){var a=M.acct||{};msg("你的老師帳號使用期限"+(a.expires?"已於 <b>"+esc(a.expires)+"</b> 到期":"已到期")+"，老師後台暫時無法使用。<br>請聯絡管理員延長使用期限；延長後重新整理這一頁就能繼續使用。",'<div class="ctl"><button class="pen go" onclick="location.reload()">已延長，重新整理</button><a class="pen" href="member.html">回到學員專區</a></div>')}
function tab(t){if(location.hash==="#"+t){TAB=t;go();return}location.hash=t}
window.addEventListener("hashchange",function(){if(!READY)return;TAB=decodeURIComponent(location.hash.slice(1))||"overview";go()});
/* 鎂光燈導覽：第一次進後台自動帶一遍，之後按右下角的 i 可以再看 */
function tb(t){return function(){return[].filter.call(document.querySelectorAll(".tabs .pen"),function(b){return b.textContent===t})[0]||null}}
function teacherTour(){if(!NB.tour)return;
 NB.tour.setup("teacher",[{title:"歡迎來到老師後台",text:"花一分鐘看看各個分頁在做什麼。想再看一次，隨時按右下角的 i 圓形按鈕。"},
  {sel:".tabs",title:"分頁列",text:"所有功能都從這一排進去，點一下就切換。"},
  {sel:tb("班級分析"),title:"班級分析",text:"看班級的作答狀況與學習概況，找出需要加強的地方。"},
  {sel:tb("學生名單"),title:"學生名單",text:"查看你班上的學生。新增學生與授權期限由管理員處理。"},
  {sel:tb("派卷"),title:"派卷",text:"指定單元與題數派給學生，學生會在「待測清單」看到，並在時限內作答一次。"},
  {sel:tb("題庫"),title:"題庫",text:"匯入與編輯題目、題目屬性（學習表現、學習內容、難易度、認知層次、知識類型）。這一頁只有管理員看得到。"},
  {sel:tb("設定"),title:"設定",text:"系統參數與用量提醒。這一頁只有管理員看得到。"},
  {sel:tb("列印紀錄"),title:"列印紀錄",text:"查看出過的練習卷與列印次數。"},
  {sel:tb("模擬考紀錄"),title:"模擬考紀錄",text:"查看學生的模擬考成績與作答紀錄。"}])}
function go(){try{return go0()}finally{teacherTour()}}function go0(){if(!TABS.some(function(t){return t[0]===TAB})){TAB="overview";try{history.replaceState(null,"","#overview")}catch(e){}}document.title="老師後台・"+(TABS.filter(function(t){return t[0]===TAB})[0]||[0,""])[1]+"｜數光島筆記本"; /* 記在瀏覽器裡的分頁已不存在、或老師沒有權限時，回到班級分析 */
 shell();var ctx={sheet:sheet,go:go,tab:tab};
 if(TAB==="overview")return load(CLS);
 if(TAB==="data")return NB.tadmin.data(ctx);
 NB.tadmin[TAB](ctx)}

/* ---- 小圖表（純 SVG，沒有外部套件） ---- */
function bars(vals,labels,opt){opt=opt||{};var bw=Math.min(44,Math.max(12,560/vals.length)),w=Math.max(320,vals.length*bw),H=opt.h||90,mx=Math.max.apply(null,vals.concat([1])),i,out='<svg viewBox="0 0 '+w+" "+(H+18)+'" class="chart" width="'+w+'" height="'+(H+18)+'" style="width:'+w+'px;max-width:none" role="img" aria-label="'+esc(opt.label||"")+'" preserveAspectRatio="xMinYMid meet"><line x1="0" y1="'+H+'" x2="'+w+'" y2="'+H+'" stroke="var(--line)"/>';
 vals.forEach(function(v,i){var bh=v/mx*(H-4);out+='<rect x="'+(i*bw+1.5)+'" y="'+(H-bh)+'" width="'+(bw-3)+'" height="'+bh+'" rx="2" fill="'+(opt.color||"var(--p2)")+'"><title>'+esc(labels[i])+" → "+v+(opt.unit||"")+"</title></rect>"});
 var ml=0;labels.forEach(function(l){ml=Math.max(ml,String(l).split("・")[0].length)});var step=Math.max(1,Math.ceil((ml*6+8)/bw));labels.forEach(function(l,i){if(i%step===0)out+='<text x="'+(i*bw+bw/2)+'" y="'+(H+13)+'" font-size="10" text-anchor="middle" fill="var(--soft)">'+esc(String(l).split("・")[0])+"</text>"});return '<div class="chartw">'+out+"</svg></div>"}
function meterRow(label,p,right){return'<div class="urow"><span>'+label+'</span><div class="meter"><i style="width:'+(p||0)+'%"></i></div><span>'+right+"</span></div>"}

function load(cls){
 M.api("GET","/api/admin/overview"+(cls?"?cls="+encodeURIComponent(cls):"")).then(render,function(e){if(e.code==="expired")return expiredMsg();msg(e.code==="forbidden"?"只有名單裡設定為 teacher 的帳號可以使用老師後台。":"載入失敗（"+esc(e.code||"未知")+"），請稍後再試。")})}
/* 各班比較（目前這一科）：老師只看自己的班；管理員看全校，另加這一科的帳號概況 */
function compare(after){
 var cs=h('<section class="sheet cmp"><h2><span class="tag">各班比較</span>'+esc(M.SUBJ[M.subj]||"")+(M.U.admin?"・全校":"・你任教的班")+'</h2><p class="meta">讀取中…</p></section>');
 if(after&&after.nextSibling)app.insertBefore(cs,after.nextSibling);else app.appendChild(cs);
 M.api("GET","/api/admin/compare").then(function(r){cs.querySelector(".meta").remove();
  if(r.acct){var a=r.acct,tl=h('<div class="tiles"></div>');tl.innerHTML=[["本科學生帳號",a.students],["本科老師",a.teachers],["授權已到期",a.expired],["30 天內到期",a.soon],["不限期",a.unlimited],["本科題庫（啟用）",a.bank+" 題"]].map(function(x){return'<div class="tile"><small>'+x[0]+"</small><strong>"+x[1]+"</strong></div>"}).join("");cs.appendChild(tl)}
  if(!r.rows.length){cs.appendChild(h('<p class="meta">這一科還沒有班級。</p>'));return}
  if(r.rows.length<2&&!r.admin){cs.remove();return} /* 只有一個班的老師，上面的班級分析就夠了 */
  var t='<table class="tb"><tr><th>班級</th><th>學生</th><th>已登入</th><th>近 7 天活躍</th><th>近 30 天作答</th><th>答對率</th><th>模擬卷平均</th></tr>';
  r.rows.forEach(function(x){t+='<tr><td><a href="#" data-c="'+esc(x.cls)+'">'+esc(x.cls)+" 班</a></td><td>"+x.total+"</td><td>"+x.joined+"</td><td>"+x.active7+"</td><td>"+x.n+"</td><td>"+(x.acc===null?"—":x.acc+"%")+"</td><td>"+(x.mockAvg===null?"—":x.mockAvg+"（"+x.mockN+" 份）")+"</td></tr>"});
  var tb=h(t+"</table>");tb.onclick=function(e){var a=e.target.closest("a[data-c]");if(!a)return;e.preventDefault();CLS=a.dataset.c;load(CLS)};cs.appendChild(tb);
  cs.appendChild(h('<p class="meta">點班級可以切換到那一班的詳細分析。'+(r.admin?"帳號概況只有管理員看得到。":"")+"</p>"))},function(e){cs.querySelector(".meta").textContent="載入失敗（"+(e.code||"未知")+"）"})}
function render(r){
 if(r.empty){shell();var s0=sheet("班級","");s0.appendChild(h("<p>「"+(M.SUBJ[M.subj]||"")+"」目前還沒有你班上的學生。學生開通這一科後，這裡就會出現班級分析。</p>"));if(M.U.admin)compare(s0);return}
 CLS=r.cls;shell();var S=r.summary,rows=r.students,today=M.today(),limit=M.today(new Date(Date.now()-7*864e5));
 var s=sheet("班級",""),sel=h("<select></select>");r.classes.forEach(function(c){var o=h("<option></option>");o.value=c;o.textContent=c+" 班";if(c===r.cls)o.selected=true;sel.appendChild(o)});sel.onchange=function(){CLS=sel.value;load(CLS)};s.appendChild(sel);
 var tl=h('<div class="tiles"></div>');tl.innerHTML=[["已登入／全班",S.joined+" / "+S.total],["近 7 天有練習",S.active7+" 人"],["全班答對率",S.acc===null?"—":S.acc+"%"],["模擬卷平均",S.mockAvg===null?"—":S.mockAvg],["需要關心",S.atRisk+" 人"],["看提示次數",S.hints]].map(function(x){return'<div class="tile"><small>'+x[0]+"</small><strong>"+x[1]+"</strong></div>"}).join("");s.appendChild(tl);compare(s);

 /* 需要關心的學生 */
 var risk=rows.filter(function(x){return x.flags.length}).concat(r.never.map(function(x){return{no:x.no,name:x.name,flags:["還沒登入過"]}}));
 var k=sheet("需要關心的同學","系統依規則自動標記：7 天沒練習、答對率低、近期退步、很依賴提示、錯題堆積、授權將到期");
 if(!risk.length)k.appendChild(h("<p>目前沒有需要特別關心的同學 👍</p>"));
 else k.appendChild(h('<table class="tb"><tr><th>座號</th><th>姓名</th><th>原因</th></tr>'+risk.map(function(x){return"<tr><td>"+x.no+"</td><td>"+esc(x.name)+"</td><td>"+x.flags.map(function(f){return'<span class="flag">'+esc(f)+"</span>"}).join(" ")+"</td></tr>"}).join("")+"</table>"));

 /* 趨勢 */
 var d=sheet("練習趨勢","近 30 天（以台灣時間計）");
 if(!r.daily.length)d.appendChild(h("<p>還沒有作答紀錄。</p>"));
 else{d.appendChild(h('<p class="meta">每天作答題數（滑過長條看當天答題人數與答對率）</p>'));var el=h("<div>"+bars(r.daily.map(function(x){return x.n}),r.daily.map(function(x){return x.d.slice(5)+"・"+x.s+" 人・答對率 "+pct(x.c,x.n)+"%"}),{label:"每日作答題數",unit:" 題"})+"</div>");d.appendChild(el);
  d.appendChild(h('<p class="meta">每天答對率</p>'));d.appendChild(h("<div>"+bars(r.daily.map(function(x){return pct(x.c,x.n)}),r.daily.map(function(x){return x.d.slice(5)}),{label:"每日答對率",color:"var(--p3)",unit:"%"})+"</div>"));
  var hrs=[],hv=[],i;for(i=0;i<24;i++){hrs.push(i+" 點");hv.push(0)}r.hours.forEach(function(x){hv[x.h]=x.n});
  d.appendChild(h('<p class="meta">一天中哪些時段在練習（0–23 點）</p>'));d.appendChild(h("<div>"+bars(hv,hrs,{label:"時段",color:"var(--p4b)",unit:" 題"})+"</div>"))}

 /* 全班進度 */
 var t=sheet("全班進度","點姓名看個人檔案；紅底＝需要關心");
 var tb='<table class="tb"><tr><th>座號</th><th>姓名</th><th class="pc">積分</th><th class="pc">答題</th><th class="pc">答對率</th><th class="pc">近 7 天</th><th class="pc">連續</th><th>最近練習</th><th class="pc">模擬卷</th><th class="pc">錯題</th><th class="pc">提示</th><th class="pc">勳章</th><th>授權到期</th>'+(M.U.admin?"<th>管理</th>":"")+'</tr>';
 rows.forEach(function(x){var p=pct(x.c,x.n),p7=pct(x.c7,x.n7);tb+='<tr class="'+(x.flags.length?"low":"")+'"><td>'+x.no+'</td><td><a href="#" class="nm" data-no="'+x.no+'">'+esc(x.name)+'</a></td><td class="pc">'+x.pts+'</td><td class="pc">'+x.n+'</td><td class="pc">'+(p===null?"—":p+"%")+'</td><td class="pc">'+(p7===null?"—":p7+"%（"+x.n7+"）")+'</td><td class="pc">'+x.streak+"</td><td>"+(x.last||"—")+'</td><td class="pc">'+(x.mock===null?"—":x.mock)+'</td><td class="pc">'+x.wrong+'</td><td class="pc">'+x.hints+'</td><td class="pc">'+x.badges+"</td><td>"+(x.expires||"不限期")+'</td>'+(M.U.admin?'<td><button class="pen" data-m="reset" data-no="'+x.no+'">重設</button> <button class="pen" data-m="delete" data-no="'+x.no+'">刪除</button></td>':"")+'</tr>'});
 var tbl=h('<div style="overflow-x:auto">'+tb+"</table></div>");t.appendChild(tbl);
 tbl.onclick=function(e){var a=e.target.closest("a.nm");if(a){e.preventDefault();return detail(r.cls,+a.dataset.no)}
  var b=e.target.closest("button[data-m]");if(!b)return;var no=b.dataset.no,m=b.dataset.m,row=rows.filter(function(x){return String(x.no)===no})[0];
  var tip=m==="reset"?"重設 "+no+" 號"+row.name+"：積分、勳章、錯題、作答紀錄全部歸零（帳號保留）。確定嗎？":"刪除 "+no+" 號"+row.name+" 的所有成績與作答紀錄，無法復原。\n提醒：也要到「學生名單」把這位同學刪除或停用，否則他下次登入會重新建立空白資料。確定嗎？";
  if(!confirm(tip))return;b.disabled=true;M.api("POST","/api/admin/delete",{cls:r.cls,no:+no,mode:m}).then(function(){load(r.cls)},function(er){alert("失敗："+(er.code||"未知"));b.disabled=false})};
 var ex=h('<div class="ctl"><button class="pen">下載成績 CSV</button></div>');ex.firstChild.onclick=function(){
  var csv="座號,姓名,積分,答題,答對,近7天答題,近7天答對,連續天數,練習天數,最近練習,模擬卷平均,模擬卷次數,錯題數,看提示次數,勳章數,授權到期,關心標記\n"+rows.map(function(x){return[x.no,'"'+x.name.replace(/"/g,'""')+'"',x.pts,x.n,x.c,x.n7,x.c7,x.streak,x.days,x.last||"",x.mock===null?"":x.mock,x.mockN,x.wrong,x.hints,x.badges,x.expires||"",'"'+x.flags.join("、")+'"'].join(",")}).join("\n");
  var a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv"}));a.download="班級成績-"+r.cls+"-"+today+".csv";a.click()};t.appendChild(ex);
 if(M.U.admin){var cl=h('<div class="ctl"><button class="pen">刪除整班資料（學期結束）</button></div>');cl.firstChild.onclick=function(){if(!confirm("刪除 "+r.cls+" 班所有學生的成績與作答紀錄，無法復原。確定嗎？"))return;var v=prompt("請輸入班級代碼 "+r.cls+" 確認：");if(v!==r.cls)return;M.api("POST","/api/admin/delete",{cls:r.cls,mode:"class"}).then(function(x){alert("已刪除 "+x.deleted+" 位同學的資料");load(r.cls)},function(er){alert("失敗："+(er.code||"未知"))})};t.appendChild(cl)}

 var u=sheet("各單元表現","近 30 天，答對率低的排前面（括號是有練習的人數）");
 if(!r.units.length)u.appendChild(h("<p>還沒有作答紀錄。</p>"));
 r.units.slice().sort(function(a,b){return a.c/a.n-b.c/b.n}).forEach(function(x){var p=pct(x.c,x.n);u.appendChild(h(meterRow(esc(title(x.unit)),p,x.c+"/"+x.n+"（"+p+"%）・"+x.s+" 人")))});

 var m=sheet("最常見的迷思","學生選了「看起來合理的錯誤答案」的次數（近 30 天），附上發生的單元");
 if(!r.misconceptions.length)m.appendChild(h("<p>還沒有足夠的資料。</p>"));
 else m.appendChild(h('<ol class="steps">'+r.misconceptions.map(function(x){return"<li>"+esc(x.dg)+"　<small>"+esc(title(x.unit))+"・"+x.n+" 次</small></li>"}).join("")+"</ol>"));

 var q=sheet("最常錯的題目","近 30 天；「產生器」代表該單元的隨機題，固定題顯示題庫編號");
 if(!r.missed.length)q.appendChild(h("<p>還沒有錯題紀錄。</p>"));
 else q.appendChild(h('<table class="tb"><tr><th>單元</th><th>題目</th><th class="pc">答錯</th><th class="pc">作答</th><th class="pc">錯誤率</th></tr>'+r.missed.map(function(x){return"<tr><td>"+esc(title(x.unit))+"</td><td>"+(x.qid.indexOf("gen:")===0?"產生器":esc(x.qid))+'</td><td class="pc">'+x.w+'</td><td class="pc">'+x.n+'</td><td class="pc">'+pct(x.w,x.n)+"%</td></tr>"}).join("")+"</table>"))}

/* ---- 個人檔案 ---- */
function detail(cls,no){
 M.api("GET","/api/admin/student?cls="+encodeURIComponent(cls)+"&no="+no).then(function(d){
  var s=h('<section class="sheet"><h2><span class="tag">個人檔案</span>'+d.no+" 號 "+esc(d.name)+'</h2></section>'),close=h('<div class="ctl"><button class="pen">關閉</button></div>');
  s.appendChild(h('<div class="tiles"><div class="tile"><small>積分／等級</small><strong>'+d.pts+" ・Lv."+d.lv+'</strong></div><div class="tile"><small>答對率</small><strong>'+(pct(d.c,d.n)===null?"—":pct(d.c,d.n)+"%")+'</strong></div><div class="tile"><small>練習天數／連續</small><strong>'+d.days+" / "+d.streak+'</strong></div><div class="tile"><small>看提示</small><strong>'+d.hints+'</strong></div><div class="tile"><small>每日一題</small><strong>'+d.dqOk+" / "+d.dq+"</strong></div><div class=\"tile\"><small>勳章</small><strong>"+d.badges.length+"</strong></div></div>"));
  if(d.log.length){s.appendChild(h('<p class="meta">最近每天答題數（有看提示的天數會在標籤標示）</p>'));s.appendChild(h("<div>"+bars(d.log.map(function(x){return x.n}),d.log.map(function(x){return x.d.slice(5)+"・答對率 "+pct(x.c,x.n)+"%"+(x.h?"・提示 "+x.h:"")}),{label:"個人每日答題",unit:" 題"})+"</div>"))}
  if(d.mocks.length){s.appendChild(h('<p class="meta">模擬卷成績走勢</p>'));s.appendChild(h("<div>"+bars(d.mocks.map(function(x){return x.sc}),d.mocks.map(function(x){return x.d.slice(5)}),{label:"模擬卷",color:"var(--p1)",unit:" 分"})+"</div>"))}
  s.appendChild(h('<p class="meta">各單元（近 30 天，弱的在前）</p>'));
  var us=d.units.slice().sort(function(a,b){return a.c/a.n-b.c/b.n});if(!us.length)s.appendChild(h("<p>近 30 天沒有作答紀錄。</p>"));us.forEach(function(x){var p=pct(x.c,x.n);s.appendChild(h(meterRow(esc(title(x.unit)),p,x.c+"/"+x.n+"（"+p+"%）")))});
  if(d.misconceptions.length)s.appendChild(h('<div><p class="meta">這位同學常犯的迷思</p><ol class="steps">'+d.misconceptions.map(function(x){return"<li>"+esc(x.dg)+"　<small>"+esc(title(x.unit))+"・"+x.n+" 次</small></li>"}).join("")+"</ol></div>"));
  if(d.wrong.length)s.appendChild(h('<div><p class="meta">錯題本（最近 '+d.wrong.length+' 題）</p><table class="tb"><tr><th>單元</th><th>題目ID</th><th>題型／難度</th><th>題目</th><th>正確答案</th><th class="pc">錯幾次</th><th>下次複習</th></tr>'+d.wrong.map(function(x){return"<tr><td>"+esc(title(x.unit))+"</td><td>"+(x.qid?(String(x.qid).indexOf("gen:")===0?"產生器":esc(x.qid)):"—")+"</td><td>"+esc(({num:"填數字",choice:"選擇",text:"填文字",tf:"是非",multi:"勾選",match:"連連看"}[x.ty]||"")+(x.kd?"・"+x.kd:"")+(x.lv?" Lv."+x.lv:""))+(x.gid?" 題組":"")+"</td><td>"+esc(String(x.q).slice(0,40))+"</td><td>"+esc(x.ans||"—")+'</td><td class="pc">'+x.n+"</td><td>"+(x.due||"—")+"</td></tr>"}).join("")+"</table></div>"));
  s.appendChild(close);close.firstChild.onclick=function(){s.remove()};var old=app.querySelector(".sheet.prof");if(old)old.remove();s.classList.add("prof");app.insertBefore(s,app.querySelector(".sheet:nth-of-type(1)"));s.scrollIntoView()},function(e){alert("載入失敗："+(e.code||"未知"))})}

var swapped=false;
function after(){if(!M.U&&M.err==="no_subject"&&!swapped){var ok=(M.errX&&M.errX.subjects||[]).filter(function(k){return M.SUBJ[k]&&k!==M.subj});if(ok.length){swapped=true;M.setSubj(ok[0]);return M.boot().then(after)}}
 start()}
shell(1);app.appendChild(h('<p class="meta" style="text-align:center;margin-top:3em">載入中…</p>'));
function start(){if(M.U&&!M.U.admin){TABS=TABS_ALL.filter(function(t){return t[0]!=="bank"&&t[0]!=="settings"&&t[0]!=="data"&&t[0]!=="reports"});if(TAB==="bank"||TAB==="settings"||TAB==="data"||TAB==="reports")TAB="overview"}if(!M.U&&M.err==="no_subject")return msg("你的帳號沒有開通可以在這裡使用的科目，請聯絡管理員。");if(!M.U)return msg("請先用老師的 Google 帳號登入學員專區。");if(M.U.expired||(M.acct&&M.acct.expired))return expiredMsg();if(M.U.role!=="teacher")return msg("只有老師可以使用這個頁面。");READY=true;go()}
M.boot().then(after);
})();
