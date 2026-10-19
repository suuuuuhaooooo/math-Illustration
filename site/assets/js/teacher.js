/* 老師後台：全班進度、各單元答對率、最常錯的題、最常見的迷思。資料由伺服器彙整，只有名單裡的 teacher 看得到。 */ 
(function(){
"use strict";
var M=NB.member,app=document.getElementById("app"),h=NB.h;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function title(id){var o=NB.flat.filter(function(x){return x.id===id})[0];return o?o.sem+" "+o.num+" "+o.title:id}
function shell(){app.innerHTML="";var bar=h('<nav class="bar"><a class="back" href="member.html">← 回到學員專區</a></nav>');bar.appendChild(NB.themeBar());app.appendChild(bar);app.appendChild(h('<div class="ruler"></div>'));app.appendChild(h('<h1 class="title"><mark>老師後台</mark></h1>'))}
function sheet(tag,sub){var s=h('<section class="sheet"><h2><span class="tag">'+tag+'</span>'+(sub||"")+'</h2></section>');app.appendChild(s);return s}
function msg(t){shell();var s=sheet("提示","");s.appendChild(h("<p>"+t+'</p><a class="pen go" href="member.html">前往登入</a>'))}
function load(cls){
 M.api("GET","/api/admin/overview"+(cls?"?cls="+encodeURIComponent(cls):"")).then(render,function(e){msg(e.code==="forbidden"?"只有名單裡設定為 teacher 的帳號可以使用老師後台。":"載入失敗（"+esc(e.code||"未知")+"），請稍後再試。")})}
function render(r){
 shell();var s=sheet("班級",""),sel=h("<select></select>");r.classes.forEach(function(c){var o=h("<option></option>");o.value=c;o.textContent=c+" 班";if(c===r.cls)o.selected=true;sel.appendChild(o)});sel.onchange=function(){load(sel.value)};s.appendChild(sel);
 var today=M.today(),limit=M.today(new Date(Date.now()-7*864e5)),rows=r.students;
 var act=rows.filter(function(x){return x.last>=limit}).length,n=rows.reduce(function(a,x){return a+x.n},0),c=rows.reduce(function(a,x){return a+x.c},0);
 var tl=h('<div class="tiles"></div>');tl.innerHTML='<div class="tile"><small>已登入同學</small><strong>'+rows.length+'</strong></div><div class="tile"><small>近 7 天有練習</small><strong>'+act+'</strong></div><div class="tile"><small>全班答對率</small><strong>'+(n?Math.round(c/n*100):0)+'%</strong></div><div class="tile"><small>還沒登入過</small><strong>'+r.never.length+"</strong></div>";s.appendChild(tl);

 var t=sheet("全班進度","紅底＝答對率偏低或超過 7 天沒練習");
 var tb='<table class="tb"><tr><th>座號</th><th>姓名</th><th class="pc">積分</th><th class="pc">答題</th><th class="pc">答對率</th><th class="pc">連續天</th><th>最近練習</th><th class="pc">模擬卷平均</th><th class="pc">錯題</th><th>管理</th></tr>';
 rows.forEach(function(x){var p=x.n?Math.round(x.c/x.n*100):null,low=(p!==null&&x.n>=10&&p<60)||!x.last||x.last<limit;tb+='<tr class="'+(low?"low":"")+'"><td>'+x.no+"</td><td>"+esc(x.name)+'</td><td class="pc">'+x.pts+'</td><td class="pc">'+x.n+'</td><td class="pc">'+(p===null?"—":p+"%")+'</td><td class="pc">'+x.streak+"</td><td>"+(x.last||"—")+'</td><td class="pc">'+(x.mock===null?"—":x.mock)+'</td><td class="pc">'+x.wrong+'</td><td><button class="pen" data-m="reset" data-no="'+x.no+'">重設</button> <button class="pen" data-m="delete" data-no="'+x.no+'">刪除</button></td></tr>'});
 var tbl=h(tb+"</table>");t.appendChild(tbl);
 tbl.onclick=function(e){var b=e.target.closest("button[data-m]");if(!b)return;var no=b.dataset.no,m=b.dataset.m,row=rows.filter(function(x){return String(x.no)===no})[0];
  var tip=m==="reset"?"重設 "+no+" 號"+row.name+"：積分、貼紙、錯題、作答紀錄全部歸零（帳號保留）。確定嗎？":"刪除 "+no+" 號"+row.name+" 的所有資料（成績、作答紀錄），無法復原。\n提醒：也要到試算表把這位同學刪除或 active 改成 0，否則下次登入會重新建立空白資料。確定嗎？";
  if(!confirm(tip))return;b.disabled=true;M.api("POST","/api/admin/delete",{cls:r.cls,no:+no,mode:m}).then(function(){load(r.cls)},function(er){alert("失敗："+(er.code||"未知"));b.disabled=false})};
 var ex=h('<div class="ctl"><button class="pen">下載成績 CSV</button></div>');ex.firstChild.onclick=function(){
  var csv="座號,姓名,積分,答題,答對,連續天數,最近練習,模擬卷平均,錯題數\n"+rows.map(function(x){return[x.no,'"'+x.name.replace(/"/g,'""')+'"',x.pts,x.n,x.c,x.streak,x.last||"",x.mock===null?"":x.mock,x.wrong].join(",")}).join("\n");
  var a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv"}));a.download="班級成績-"+r.cls+"-"+today+".csv";a.click()};t.appendChild(ex);
 var cl=h('<div class="ctl"><button class="pen">刪除整班資料（學期結束）</button></div>');cl.firstChild.onclick=function(){if(!confirm("刪除 "+r.cls+" 班所有學生的成績與作答紀錄，無法復原。確定嗎？"))return;var v=prompt("請輸入班級代碼 "+r.cls+" 確認：");if(v!==r.cls)return;M.api("POST","/api/admin/delete",{cls:r.cls,mode:"class"}).then(function(x){alert("已刪除 "+x.deleted+" 位同學的資料");load(r.cls)},function(er){alert("失敗："+(er.code||"未知"))})};t.appendChild(cl);
 if(r.never.length)t.appendChild(h('<p class="meta">還沒登入過：'+r.never.map(function(x){return x.no+" 號"+esc(x.name)}).join("、")+"</p>"));

 var u=sheet("各單元答對率","近 30 天，數字小的先複習");
 if(!r.units.length)u.appendChild(h("<p>還沒有作答紀錄。</p>"));
 r.units.slice().sort(function(a,b){return a.c/a.n-b.c/b.n}).forEach(function(x){var p=Math.round(x.c/x.n*100);u.appendChild(h('<div class="urow"><span>'+esc(title(x.unit))+'</span><div class="meter"><i style="width:'+p+'%"></i></div><span>'+x.c+"/"+x.n+"（"+p+"%）</span></div>"))});

 var m=sheet("最常見的迷思","學生選了「看起來合理的錯誤答案」的次數（近 30 天）");
 if(!r.misconceptions.length)m.appendChild(h("<p>還沒有足夠的資料。</p>"));
 else m.appendChild(h('<ol class="steps">'+r.misconceptions.map(function(x){return"<li>"+esc(x.dg)+"　<small>"+x.n+" 次</small></li>"}).join("")+"</ol>"));

 var q=sheet("最常錯的題目","近 30 天；「產生器」代表該單元的隨機題，固定題顯示題庫編號");
 if(!r.missed.length)q.appendChild(h("<p>還沒有錯題紀錄。</p>"));
 else q.appendChild(h('<table class="tb"><tr><th>單元</th><th>題目</th><th class="pc">答錯</th><th class="pc">作答</th></tr>'+r.missed.map(function(x){return"<tr><td>"+esc(title(x.unit))+"</td><td>"+(x.qid.indexOf("gen:")===0?"產生器":esc(x.qid))+'</td><td class="pc">'+x.w+'</td><td class="pc">'+x.n+"</td></tr>"}).join("")+"</table>"))}
shell();app.appendChild(h('<p class="meta" style="text-align:center;margin-top:3em">載入中…</p>'));
M.boot().then(function(){if(!M.U)return msg("請先用老師的 Google 帳號登入學員專區。");if(M.U.role!=="teacher")return msg("只有老師可以使用這個頁面。");load()});
})();
