/* 老師後台：學生名單、題庫、設定、資料管理。所有資料都存在 Cloudflare D1，這裡只是管理介面。 */
(function(){
"use strict";
var M=NB.member,h=NB.h;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function errs(e){return e&&e.code?"失敗（"+e.code+"）":"連線失敗"}
function csvEsc(v){v=String(v==null?"":v);return/[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function parseCSV(t){var rows=[],r=[],f="",q=false,i,c;t=t.replace(/^﻿/,"");
 for(i=0;i<t.length;i++){c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
  else if(c==='"')q=true;else if(c===","||c==="\t"){r.push(f);f=""}else if(c==="\n"||c==="\r"){if(c==="\r"&&t[i+1]==="\n")i++;r.push(f);f="";if(r.some(function(x){return x.trim()}))rows.push(r);r=[]}else f+=c}
 r.push(f);if(r.some(function(x){return x.trim()}))rows.push(r);return rows}
function toObjs(rows,cols){var head=rows[0].map(function(x){return x.trim().toLowerCase()}),has=cols.some(function(c){return head.indexOf(c)>=0}),hd=has?head:cols,body=has?rows.slice(1):rows;
 return body.map(function(r){var o={};hd.forEach(function(k,i){if(r[i]!==undefined)o[k]=r[i].trim()});return o})}
function download(name,text){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+text],{type:"text/csv"}));a.download=name;a.click()}
function msg(box,t,ok){box.className="fb "+(ok?"ok":"no");box.innerHTML=t}
function field(label,el){var d=h('<label class="fld"><span>'+label+"</span></label>");d.appendChild(el);return d}
function inp(v,ph,type){var i=document.createElement("input");i.type=type||"text";i.value=v==null?"":v;if(ph)i.placeholder=ph;return i}
function sel(opts,v){var s=document.createElement("select");opts.forEach(function(o){var e=document.createElement("option");e.value=o[0];e.textContent=o[1];if(String(o[0])===String(v))e.selected=true;s.appendChild(e)});return s}
function area(v,rows){var a=document.createElement("textarea");a.rows=rows||3;a.value=v||"";a.style.width="100%";return a}
function migrateBanner(ctx,legacy){if(!legacy)return;var b=h('<div class="fb no">偵測到你還在使用舊的「試算表同步」資料，尚未搬進資料庫。搬完後就能在這裡直接新增、修改、刪除。<div class="ctl"><button class="pen go">一鍵搬移舊資料</button></div></div>');
 b.querySelector("button").onclick=function(){this.disabled=true;M.api("POST","/api/admin/migrate").then(function(r){alert("搬移完成：名單 "+r.roster+" 筆、題目 "+r.bank+" 題");ctx.go()},function(e){alert(errs(e))})};ctx.box.appendChild(b)}

/* ---------- 學生名單 ---------- */
function roster(ctx){
 var s=ctx.sheet("學生名單","新增、修改、停用、刪除；改完立即生效"),fb=h('<div class="fb"></div>');
 M.api("GET","/api/admin/roster").then(function(r){
  ctx.box=s;migrateBanner(ctx,r.legacy);
  var today=M.today(),rows=r.rows,form=h('<div class="ctl wrapctl"></div>'),f={email:inp("","Google 帳號 Email","email"),cls:inp("","班級 例 601"),no:inp("","座號","number"),name:inp("","姓名"),grade:sel([[3,"三年級"],[4,"四年級"],[5,"五年級"],[6,"六年級"]],6),role:sel([["student","學生"],["teacher","老師"]],"student"),act:sel([["1","啟用"],["0","停用"]],"1"),exp:inp("","授權到期日","date")};f.exp.title="授權到期日（含當天）；留空＝不限期";
  Object.keys(f).forEach(function(k){form.appendChild(k==="exp"?field("授權到期日（空白＝不限期）",f[k]):f[k])});
  var save=h('<button class="pen go">儲存這位</button>');form.appendChild(save);s.appendChild(form);
  function send(list,done){M.api("POST","/api/admin/roster",{rows:list}).then(function(x){if(!x.ok)return msg(fb,"<b>有地方要修正，完全沒有儲存：</b><br>"+x.errs.map(esc).join("<br>"),0);msg(fb,"已儲存 "+x.n+" 筆",1);if(done)done()},function(e){msg(fb,errs(e),0)})}
  save.onclick=function(){send([{email:f.email.value,class:f.cls.value,no:f.no.value,name:f.name.value,role:f.role.value,grade:f.grade.value,active:f.act.value,expires:f.exp.value}],ctx.go)};
  s.appendChild(fb);
  var t='<table class="tb"><tr><th>班</th><th>號</th><th>姓名</th><th>Email</th><th>身分</th><th>年級</th><th>狀態</th><th>授權到期</th><th></th></tr>';
  rows.forEach(function(x,i){t+='<tr class="'+(x.active==="0"||x.active===0?"low":"")+'"><td>'+esc(x.class)+"</td><td>"+x.no+"</td><td>"+esc(x.name)+"</td><td>"+esc(x.email)+"</td><td>"+(x.role==="student"?"學生":"老師")+"</td><td>"+x.grade+"</td><td>"+(x.active==="0"||x.active===0?"停用":"啟用")+"</td><td>"+(x.role==="student"?(x.expires?(x.expires<today?"<b class=\"flag\">已到期 "+x.expires+"</b>":x.expires):"不限期"):"—")+'</td><td><button class="pen" data-e="'+i+'">編輯</button> <button class="pen" data-d="'+i+'">刪除</button></td></tr>'});
  var tb=h(t+"</table>");s.appendChild(tb);
  tb.onclick=function(e){var b=e.target.closest("button");if(!b)return;
   if(b.dataset.e!==undefined){var x=rows[+b.dataset.e];f.email.value=x.email;f.cls.value=x.class;f.no.value=x.no;f.name.value=x.name;f.grade.value=x.grade;f.role.value=x.role;f.act.value=x.active==="0"?"0":"1";f.exp.value=x.expires||"";scrollTo(0,0)}
   else{var y=rows[+b.dataset.d];if(!confirm("從名單刪除 "+y.name+"（"+y.email+"）？他就無法登入。成績資料另外在「資料管理」處理。"))return;M.api("POST","/api/admin/roster/delete",{email:y.email}).then(ctx.go,function(er){msg(fb,errs(er),0)})}};
  var cls=[];rows.forEach(function(x){if(x.role==="student"&&cls.indexOf(String(x.class))<0)cls.push(String(x.class))});
  var ex=ctx.sheet("授權期限","到期後，學生只能看自己的資料，不能練習、考試、列印；老師帳號不受影響");
  var cs=sel(cls.map(function(c){return[c,c+" 班"]}),cls[0]),ed=inp("","","date"),exf=h('<div class="fb"></div>'),eb=h('<div class="ctl"></div>');
  var b1=h('<button class="pen go">整班設定到期日</button>'),b2=h('<button class="pen">整班改為不限期</button>'),b3=h('<button class="pen">整班延長 1 學期（+6 個月）</button>');
  eb.appendChild(cs);eb.appendChild(ed);eb.appendChild(b1);eb.appendChild(b2);eb.appendChild(b3);ex.appendChild(eb);ex.appendChild(exf);
  function setExp(d){M.api("POST","/api/admin/roster/expire",{cls:cs.value,date:d}).then(function(){msg(exf,"已更新 "+cs.value+" 班："+(d||"不限期"),1);setTimeout(ctx.go,700)},function(e){msg(exf,errs(e),0)})}
  b1.onclick=function(){if(!ed.value)return msg(exf,"請先選日期",0);setExp(ed.value)};b2.onclick=function(){setExp("")};
  b3.onclick=function(){var d=new Date(Math.max(Date.now(),0));d.setMonth(d.getMonth()+6);setExp(M.today(d))};
  var bulk=ctx.sheet("批次匯入／匯出","從 Excel、Google 試算表複製貼上；欄位：email, 班級, 座號, 姓名, 身分, 年級, 啟用(1/0), 到期日(2027-01-31，可省略)");
  var ta=area("",5);ta.placeholder="a@gmail.com,601,1,王小明,student,6";bulk.appendChild(ta);
  var bt=h('<div class="ctl"><button class="pen go">匯入（相同 Email 會更新）</button><button class="pen">匯出名單 CSV</button></div>'),bf=h('<div class="fb"></div>');bulk.appendChild(bt);bulk.appendChild(bf);
  bt.children[0].onclick=function(){var p=parseCSV(ta.value);if(!p.length)return;var list=toObjs(p,["email","class","no","name","role","grade","active","expires"]);
   M.api("POST","/api/admin/roster",{rows:list}).then(function(x){if(!x.ok)return msg(bf,"<b>有地方要修正，完全沒有匯入：</b><br>"+x.errs.map(esc).join("<br>"),0);msg(bf,"已匯入 "+x.n+" 筆",1);setTimeout(ctx.go,600)},function(e){msg(bf,errs(e),0)})};
  bt.children[1].onclick=function(){download("名單.csv","email,class,no,name,role,grade,active,expires\n"+rows.map(function(x){return[x.email,x.class,x.no,x.name,x.role,x.grade,x.active==="0"?0:1,x.expires||""].map(csvEsc).join(",")}).join("\n"))};
 },function(e){s.appendChild(h('<div class="fb no">'+errs(e)+"</div>"))})}

/* ---------- 題庫 ---------- */
var COLS=["id","unit","type","lv","q","options","answer","hint","diag","img","himg","print","daily","mock","active"];
function resize(file,cb){var img=new Image(),u=URL.createObjectURL(file);img.onload=function(){var m=1000,k=Math.min(1,m/Math.max(img.width,img.height)),q=.88,c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);var g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);
  var d;do{d=c.toDataURL("image/jpeg",q).split(",")[1];q-=.12}while(d.length>540000&&q>.3);URL.revokeObjectURL(u);cb(d)};img.onerror=function(){cb(null)};img.src=u}
function bank(ctx){
 var s=ctx.sheet("題庫","固定題；沒有的單元會自動用「隨機產生器」出題");
 M.api("GET","/api/admin/bank").then(function(r){
  ctx.box=s;migrateBanner(ctx,r.legacy);var rows=r.rows,fb=h('<div class="fb"></div>'),list=h("<div></div>");
  var bar=h('<div class="ctl"></div>'),fu=document.createElement("select"),fq=inp("","搜尋題目文字"),nw=h('<button class="pen go">＋ 新增題目</button>');
  var units={};rows.forEach(function(x){units[x.unit]=1});fu.innerHTML='<option value="">全部單元（'+rows.length+"）</option>"+Object.keys(units).sort().map(function(u){return'<option value="'+u+'">'+esc(u)+"</option>"}).join("");
  bar.appendChild(fu);bar.appendChild(fq);bar.appendChild(nw);s.appendChild(bar);s.appendChild(fb);s.appendChild(list);
  function draw(){var k=fq.value.trim(),a=rows.filter(function(x){return(!fu.value||x.unit===fu.value)&&(!k||(x.q+x.id).indexOf(k)>=0)}),t='<p class="meta">共 '+a.length+" 題"+(a.length>100?"（只顯示前 100，請用篩選）":"")+'</p><table class="tb"><tr><th>單元</th><th>題目</th><th>難度</th><th>用途</th><th></th></tr>';
   a.slice(0,100).forEach(function(x){var u=[];if(x.print==="1")u.push("出卷");if(x.daily==="1")u.push("每日");if(x.mock!=="0")u.push("模擬");if(x.active==="0")u.push("停用");t+="<tr><td>"+esc(x.unit)+"</td><td>"+esc(String(x.q).slice(0,46))+"</td><td>"+x.lv+"</td><td>"+u.join("・")+'</td><td><button class="pen" data-e="'+esc(x.id)+'">編輯</button> <button class="pen" data-d="'+esc(x.id)+'">刪除</button></td></tr>'});
   var el=h("<div>"+t+"</table></div>");list.innerHTML="";list.appendChild(el);
   el.onclick=function(e){var b=e.target.closest("button");if(!b)return;if(b.dataset.e!==undefined)edit(rows.filter(function(x){return x.id===b.dataset.e})[0]);else if(confirm("刪除題目 "+b.dataset.d+"？"))M.api("POST","/api/admin/bank/delete",{ids:[b.dataset.d]}).then(ctx.go,function(er){msg(fb,errs(er),0)})}}
  fu.onchange=fq.oninput=draw;draw();nw.onclick=function(){edit(null)};
  function edit(x){x=x||{id:"",unit:fu.value||"6d-5.3",type:"num",lv:2,q:"",options:"",answer:"",hint:"",diag:"",img:"",himg:"",print:"",daily:"",mock:"1",active:"1"};
   var ed=ctx.sheet(x.id?"編輯題目":"新增題目",x.id?esc(x.id):"儲存後立刻出現在小測驗、出卷、每日一題、模擬卷"),F={};
   var dl=document.createElement("datalist");dl.id="ul";NB.flat.forEach(function(o){var e=document.createElement("option");e.value=o.id;e.label=o.sem+" "+o.num+" "+o.title;dl.appendChild(e)});ed.appendChild(dl);
   F.unit=inp(x.unit);F.unit.setAttribute("list","ul");F.type=sel([["num","數值題（填數字）"],["choice","選擇題"],["text","文字題（輸入文字）"]],x.type);F.lv=sel([[1,"1 基礎"],[2,"2 應用"],[3,"3 挑戰"]],x.lv);F.q=area(x.q,3);F.options=area(String(x.options||"").split("|").join("\n"),4);F.answer=inp(x.answer);F.hint=area(x.hint,2);F.diag=area(String(x.diag||"").split(";;").join("\n"),2);F.img=inp(x.img);F.himg=inp(x.himg);
   F.print=sel([["","不放進出卷"],["1","可放進出卷"]],x.print);F.daily=sel([["","不當每日一題"],["1","可當每日一題"]],x.daily);F.mock=sel([["1","可放進模擬卷"],["0","不放模擬卷"]],x.mock);F.active=sel([["1","啟用"],["0","停用"]],x.active);
   var pv=h('<div class="q" style="min-height:3em"></div>');
   function prev(){var t=F.q.value;pv.innerHTML=NB.tx?NB.tx(t):esc(t)}F.q.oninput=prev;prev();
   ed.appendChild(field("單元代號",F.unit));ed.appendChild(field("題型",F.type));ed.appendChild(field("難度",F.lv));
   ed.appendChild(field("題目（可用 $\\frac{1}{2}$ 這種 LaTeX）",F.q));ed.appendChild(h('<p class="meta">預覽</p>'));ed.appendChild(pv);
   var ow=field("選項（選擇題用，一行一個）",F.options);ed.appendChild(ow);ed.appendChild(field("正確答案（選擇題要和某個選項完全相同；文字題可用 | 放多個可接受的答案，例如：假設法|假設）",F.answer));ed.appendChild(field("提示／詳解",F.hint));
   ed.appendChild(field("常見錯誤提示（每行：錯誤答案=>提示）",F.diag));
   [["img","題目附圖"],["himg","詳解附圖"]].forEach(function(p){var w=h('<div class="ctl"></div>'),up=h('<button class="pen">上傳圖片</button>'),fl=document.createElement("input");fl.type="file";fl.accept="image/*";fl.hidden=true;
    up.onclick=function(){fl.click()};fl.onchange=function(){var f0=fl.files[0];if(!f0)return;up.textContent="上傳中…";resize(f0,function(b64){if(!b64){up.textContent="上傳圖片";return alert("讀不到這張圖片")}M.api("POST","/api/admin/image",{mime:"image/jpeg",b64:b64}).then(function(r){F[p[0]].value=r.ref;up.textContent="已上傳，換一張"},function(e){up.textContent="上傳圖片";alert(errs(e))})}) };
    w.appendChild(F[p[0]]);w.appendChild(up);w.appendChild(fl);ed.appendChild(field(p[1]+"（可貼 https 網址、assets/q/ 檔名，或按上傳）",w))});
   ["print","daily","mock","active"].forEach(function(k){ed.appendChild(field("",F[k]))});
   var ef=h('<div class="fb"></div>'),bt=h('<div class="ctl"><button class="pen go">儲存題目</button><button class="pen">取消</button></div>');ed.appendChild(bt);ed.appendChild(ef);
   bt.children[1].onclick=ctx.go;
   bt.children[0].onclick=function(){var o={id:x.id};COLS.forEach(function(k){if(F[k])o[k]=F[k].value});o.options=F.options.value.split("\n").map(function(v){return v.trim()}).filter(Boolean).join("|");o.diag=F.diag.value.split("\n").map(function(v){return v.trim()}).filter(Boolean).join(";;");
    M.api("POST","/api/admin/bank",{rows:[o],mode:"merge"}).then(function(r){if(!r.ok)return msg(ef,r.errs.map(esc).join("<br>"),0);msg(ef,"已儲存",1);setTimeout(ctx.go,500)},function(e){msg(ef,errs(e),0)})};
   ed.scrollIntoView()}
  var bk=ctx.sheet("批次匯入／匯出","用試算表整理大量題目，再貼進來（欄位同範例 bank.csv）");
  var ta=area("",5);bk.appendChild(ta);var mode=sel([["merge","合併（id 相同就更新，其他保留）"],["replace","全部取代（整個題庫會被換掉）"]],"merge"),bt=h('<div class="ctl"></div>'),bf=h('<div class="fb"></div>');
  var b1=h('<button class="pen go">匯入</button>'),b2=h('<button class="pen">匯出題庫 CSV</button>');bt.appendChild(mode);bt.appendChild(b1);bt.appendChild(b2);bk.appendChild(bt);bk.appendChild(bf);
  b1.onclick=function(){var p=parseCSV(ta.value);if(!p.length)return;if(mode.value==="replace"&&!confirm("這會刪除現有全部題目，改成貼上的內容。確定？"))return;
   M.api("POST","/api/admin/bank",{rows:toObjs(p,COLS),mode:mode.value}).then(function(x){if(!x.ok)return msg(bf,"<b>有地方要修正，完全沒有匯入：</b><br>"+x.errs.slice(0,30).map(esc).join("<br>"),0);msg(bf,"已匯入 "+x.n+" 題",1);setTimeout(ctx.go,600)},function(e){msg(bf,errs(e),0)})};
  b2.onclick=function(){download("題庫.csv",COLS.join(",")+"\n"+rows.map(function(x){return COLS.map(function(k){return csvEsc(x[k])}).join(",")}).join("\n"))};
 },function(e){s.appendChild(h('<div class="fb no">'+errs(e)+"</div>"))})}

/* ---------- 設定 ---------- */
function settings(ctx){
 var s=ctx.sheet("遊戲設定","改完按儲存，全班立刻套用；空白＝用預設值");
 M.api("GET","/api/admin/settings").then(function(r){var e=r.effective,F={
  POINTS_BY_LEVEL:inp(e.pts.join(",")),LEVEL_STEP:inp(e.step,"","number"),DAILY_Q_CAP:inp(e.capQ,"","number"),DAILY_MOCK_CAP:inp(e.capMock,"","number"),REVIEW_DAYS:inp(e.review.join(",")),HINT_COST:inp(e.hint,"","number")};
  s.appendChild(field("答對一題的積分（基礎,應用,挑戰）",F.POINTS_BY_LEVEL));s.appendChild(field("每幾分升一級",F.LEVEL_STEP));s.appendChild(field("每天最多計分的題數（防刷）",F.DAILY_Q_CAP));s.appendChild(field("每天可領獎勵的模擬卷份數",F.DAILY_MOCK_CAP));s.appendChild(field("看一次提示扣幾分（0＝不扣；看過提示的題目答對只拿一半積分）",F.HINT_COST));s.appendChild(field("錯題複習間隔（幾天後，用逗號分隔）",F.REVIEW_DAYS));
  var fb=h('<div class="fb"></div>'),b=h('<div class="ctl"><button class="pen go">儲存設定</button></div>');s.appendChild(b);s.appendChild(fb);
  b.firstChild.onclick=function(){var o={};Object.keys(F).forEach(function(k){o[k]=F[k].value});M.api("POST","/api/admin/settings",o).then(function(){msg(fb,"已儲存",1)},function(er){msg(fb,"數值不合理："+errs(er),0)})}},function(e){s.appendChild(h('<div class="fb no">'+errs(e)+"</div>"))})}

/* ---------- 資料管理 ---------- */
function data(ctx){
 var s=ctx.sheet("資料管理","重設、刪除學生或整班的成績資料");
 s.appendChild(h("<p>學生個別的「重設／刪除」按鈕在「全班進度」表格最右側；整班刪除在該表格下方。</p><p>學期結束建議流程：① 下載成績 CSV → ② 刪除整班資料 → ③ 在「學生名單」把學生刪除或停用。</p>"));
 var b=h('<div class="ctl"><a class="pen go" href="#progress">前往全班進度</a></div>');b.firstChild.onclick=function(e){e.preventDefault();ctx.tab("progress")};s.appendChild(b);
 var m=h('<div class="ctl"><button class="pen">檢查是否有舊資料可搬移</button></div>'),mf=h('<div class="fb"></div>');s.appendChild(m);s.appendChild(mf);
 m.firstChild.onclick=function(){M.api("GET","/api/admin/roster").then(function(r){if(!r.legacy)return msg(mf,"沒有需要搬移的舊資料。",1);ctx.box=s;ctx.go2=ctx.go;migrateBanner(ctx,true)},function(e){msg(mf,errs(e),0)})}}

NB.tadmin={roster:roster,bank:bank,settings:settings,data:data};
})();
