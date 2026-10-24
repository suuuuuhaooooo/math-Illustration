/* 老師後台：學生名單、題庫、設定、資料管理。所有資料都存在 Cloudflare D1，這裡只是管理介面。 */
(function(){
"use strict";
var M=NB.member,h=NB.h;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var ERRMAP={bad_HINT_COST:"看一次提示扣的分數要是 0～10000 的整數",bad_LEVEL_STEP:"每幾分升一級要在 10～100000 之間",bad_DAILY_Q_CAP:"每天最多計分的題數要在 10～5000 之間",bad_DAILY_MOCK_CAP:"每天可領獎勵的模擬卷份數要在 0～50 之間",bad_POINTS_BY_LEVEL:"答對積分要填 3 個 1～1000 的數字，用逗號分開（例：10,15,20）",bad_REVIEW_DAYS:"錯題複習間隔要填 1～6 個 1～90 的整數，用逗號分開（例：1,3,7）",forbidden:"沒有這個權限（這項功能只有管理員能用）"};
function errs(e){return e&&e.code?(ERRMAP[e.code]||"失敗（"+e.code+"）"):"連線失敗"}
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
 var s=ctx.sheet("學生名單",M.U.admin?"新增、修改、停用、刪除；改完立即生效":"你班級的名單（唯讀）"),fb=h('<div class="fb"></div>');
 M.api("GET","/api/admin/roster").then(function(r){
  ctx.box=s;
  if(!M.U.admin){ /* 老師：只能看自己班的名單；新增、修改、刪除、授權期限、批次匯入都只有管理員能做 */
   s.appendChild(h('<p class="meta">這裡是你班級的名單（唯讀）。新增、修改、刪除學生與授權期限，只有管理員可以操作；需要異動請聯絡管理員。</p>'));
   var tr='<table class="tb"><tr><th>班</th><th>號</th><th>姓名</th><th>Email</th><th>年級</th><th>狀態</th></tr>';
   r.rows.forEach(function(x){tr+='<tr class="'+(x.active==="0"||x.active===0?"low":"")+'"><td>'+esc(x.class)+"</td><td>"+x.no+"</td><td>"+esc(x.name)+"</td><td>"+esc(x.email)+"</td><td>"+x.grade+"</td><td>"+(x.active==="0"||x.active===0?"停用":"啟用")+"</td></tr>"});
   s.appendChild(h(tr+"</table>"));
   var eb0=h('<div class="ctl"><button class="pen">匯出名單 CSV</button></div>');eb0.firstChild.onclick=function(){download("名單.csv","email,class,no,name,grade,active\n"+r.rows.map(function(x){return[x.email,x.class,x.no,x.name,x.grade,x.active==="0"?0:1].map(csvEsc).join(",")}).join("\n"))};s.appendChild(eb0);
   return}
  migrateBanner(ctx,r.legacy);
  var today=M.today(),rows=r.rows,form=h('<div class="ctl wrapctl"></div>'),f={email:inp("","Google 帳號 Email","email"),cls:inp("","班級 例 601"),no:inp("","座號","number"),name:inp("","姓名"),grade:sel([[1,"一年級"],[2,"二年級"],[3,"三年級"],[4,"四年級"],[5,"五年級"],[6,"六年級"]],6),role:sel(M.U.admin?[["student","學生"],["teacher","老師"],["admin","管理員"]]:[["student","學生"]],"student"),act:sel([["1","啟用"],["0","停用"]],"1"),exp:inp("","授權到期日","date")};f.exp.title="授權到期日（含當天）；留空＝不限期";
  Object.keys(f).forEach(function(k){form.appendChild(k==="exp"?field("授權到期日（空白＝不限期）",f[k]):f[k])});
  var save=h('<button class="pen go">儲存這位</button>');form.appendChild(save);s.appendChild(form);
  function send(list,done){M.api("POST","/api/admin/roster",{rows:list}).then(function(x){if(!x.ok)return msg(fb,"<b>有地方要修正，完全沒有儲存：</b><br>"+x.errs.map(esc).join("<br>"),0);msg(fb,"已儲存 "+x.n+" 筆",1);if(done)done()},function(e){msg(fb,errs(e),0)})}
  save.onclick=function(){send([{email:f.email.value,class:f.cls.value,no:f.no.value,name:f.name.value,role:f.role.value,grade:f.grade.value,active:f.act.value,expires:f.exp.value}],ctx.go)};
  s.appendChild(fb);
  var t='<table class="tb"><tr><th>班</th><th>號</th><th>姓名</th><th>Email</th><th>身分</th><th>年級</th><th>狀態</th><th>授權到期</th><th></th></tr>';
  rows.forEach(function(x,i){t+='<tr class="'+(x.active==="0"||x.active===0?"low":"")+'"><td>'+esc(x.class)+"</td><td>"+x.no+"</td><td>"+esc(x.name)+"</td><td>"+esc(x.email)+"</td><td>"+(x.role==="student"?"學生":x.role==="admin"?"管理員":"老師")+"</td><td>"+x.grade+"</td><td>"+(x.active==="0"||x.active===0?"停用":"啟用")+"</td><td>"+(x.role==="admin"?"—":(x.expires?(x.expires<today?"<b class=\"flag\">已到期 "+x.expires+"</b>":x.expires):"不限期"))+'</td><td><button class="pen" data-e="'+i+'">編輯</button> <button class="pen" data-d="'+i+'">刪除</button></td></tr>'});
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
  var ta=area("",5),rn=h('<p class="meta"></p>');ta.placeholder="a@gmail.com,601,1,王小明,student,6";bulk.appendChild(pickCsv(ta,rn));bulk.appendChild(rn);bulk.appendChild(ta);
  var bt=h('<div class="ctl"><button class="pen go">匯入（相同 Email 會更新）</button><button class="pen">匯出名單 CSV</button></div>'),bf=h('<div class="fb"></div>');bulk.appendChild(bt);bulk.appendChild(bf);
  bt.children[0].onclick=function(){var p=parseCSV(ta.value);if(!p.length)return;var list=toObjs(p,["email","class","no","name","role","grade","active","expires"]);
   M.api("POST","/api/admin/roster",{rows:list}).then(function(x){if(!x.ok)return msg(bf,"<b>有地方要修正，完全沒有匯入：</b><br>"+x.errs.map(esc).join("<br>"),0);msg(bf,"已匯入 "+x.n+" 筆",1);setTimeout(ctx.go,600)},function(e){msg(bf,errs(e),0)})};
  bt.children[1].onclick=function(){download("名單.csv","email,class,no,name,role,grade,active,expires\n"+rows.map(function(x){return[x.email,x.class,x.no,x.name,x.role,x.grade,x.active==="0"?0:1,x.expires||""].map(csvEsc).join(",")}).join("\n"))};
 },function(e){s.appendChild(h('<div class="fb no">'+errs(e)+"</div>"))})}

/* 選 CSV：可一次選很多個檔。keep=true（題庫）：檔案分開保存、逐檔檢查匯入；否則（名單）合併成一份文字貼進框裡 */
var HEADS="id,unit,type,lv,q,options,answer,hint,diag,img,himg,print,daily,mock,active,email,class,no,name,role,grade,expires,學習表現,學習內容,難易度,認知層次,知識類型,perf,content,diff,cog,know,題組id,題組題幹,題組附圖,小題序,gid,gstem,gimg,gord".split(",");
function isHead(line){var c=parseCSV(line)[0]||[];return c.filter(function(x){return HEADS.indexOf(x.trim().toLowerCase())>=0}).length>=2}
function pickCsv(ta,note,keep){var w=h('<div class="ctl"></div>'),b=h('<button class="pen">選擇 CSV 檔（可多選）</button>'),f=document.createElement("input");f.type="file";f.multiple=true;f.accept=".csv,.txt,text/csv,text/plain";f.hidden=true;
 ta.addEventListener("input",function(){ta.__files=null});
 b.onclick=function(){f.click()};f.onchange=function(){var list=Array.prototype.slice.call(f.files);f.value="";if(!list.length)return;
  Promise.all(list.map(function(x){return new Promise(function(ok){var r=new FileReader();r.onload=function(){ok({name:x.name,text:String(r.result||"").replace(/^\uFEFF/,"")})};r.onerror=function(){ok({name:x.name,text:""})};r.readAsText(x,"utf-8")})})).then(function(fs){
   fs=fs.filter(function(x){return x.text.trim()});if(!fs.length){note.textContent="讀不到內容。";return}
   var info=fs.map(function(x){var n=parseCSV(x.text).length-(isHead(x.text.split(/\r?\n/)[0]||"")?1:0);return x.name+"（"+n+" 列）"}).join("、");
   if(keep){ta.__files=fs;ta.value="";ta.placeholder="已選 "+fs.length+" 個檔案，按「匯入」會逐檔檢查；也可以改成直接貼內容";note.innerHTML="已讀入 "+fs.length+" 個檔案："+esc(info)+"。確認後按「匯入」，全部檢查過才會寫入。"}
   else{var out=[];fs.forEach(function(x,k){var lines=x.text.replace(/\s+$/,"").split(/\r?\n/);if(k>0&&isHead(lines[0]||""))lines.shift();out.push(lines.join("\n"))});ta.value=out.join("\n");ta.__files=null;note.textContent="已讀入 "+fs.length+" 個檔案："+info+"，確認內容後按「匯入」。"}})};
 w.appendChild(b);w.appendChild(f);return w}
/* ---------- 題庫 ---------- */
var COLS=["id","unit","type","lv","q","options","answer","hint","diag","img","himg","print","daily","mock","active"];
function resize(file,cb){var img=new Image(),u=URL.createObjectURL(file);img.onload=function(){var m=1000,k=Math.min(1,m/Math.max(img.width,img.height)),q=.88,c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);var g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);
  var d;do{d=c.toDataURL("image/jpeg",q).split(",")[1];q-=.12}while(d.length>540000&&q>.3);URL.revokeObjectURL(u);cb(d)};img.onerror=function(){cb(null)};img.src=u}
function bkCss(){if(document.getElementById("bkcss"))return;var st=document.createElement("style");st.id="bkcss";st.textContent=".bkwrap{max-height:68vh;overflow:auto;border:1.5px solid var(--line);border-radius:10px}.bkwrap .tb{margin:0}.bkwrap .tb th{position:sticky;top:0;z-index:2;background:var(--paper,#fff);box-shadow:0 1.5px 0 var(--line)}.bkbar{position:sticky;top:0;z-index:5;background:var(--paper,#fff);padding:8px 0;border-bottom:1.5px solid var(--line)}.bkkpi{display:flex;flex-wrap:wrap;gap:10px;margin:6px 0 10px}.bkkpi div{flex:1;min-width:92px;border:1.5px solid var(--line);border-radius:10px;padding:8px 10px;text-align:center}.bkkpi b{display:block;font-size:1.35rem;font-variant-numeric:tabular-nums}.bkkpi span{font-size:.82rem;color:var(--soft)}.bkun summary{cursor:pointer;font-weight:700;margin:8px 0}.bkun tr[data-u]{cursor:pointer}.bkun tr[data-u]:hover td{background:color-mix(in srgb,var(--p2,#888) 10%,transparent)}.tb td.n,.tb th.n{text-align:right;font-variant-numeric:tabular-nums}";st.textContent+='.bkdash{border:1.5px solid var(--line);border-radius:12px;padding:12px 14px;margin:8px 0 12px}.bkhead{display:flex;flex-wrap:wrap;gap:14px 24px;align-items:center}.bkbig{flex:1 1 220px;min-width:200px}.bkbig b{font-size:2.4rem;line-height:1;font-variant-numeric:tabular-nums;margin-right:6px}.bkbig>span{font-size:1rem;color:var(--soft)}.bktrack{height:8px;border-radius:4px;background:var(--line);margin:8px 0 4px;overflow:hidden}.bktrack i,.bkrow .bt i{display:block;height:100%;background:var(--p2,#6b8e5a);border-radius:4px;transition:width .25s}.bkbig small{color:var(--soft)}.bkmini{display:flex;flex-wrap:wrap;gap:8px;flex:2 1 320px}.bkmini div{flex:1;min-width:96px;border:1.5px solid var(--line);border-radius:10px;padding:6px 8px;text-align:center}.bkmini b{display:block;font-size:1.25rem;font-variant-numeric:tabular-nums}.bkmini span{display:block;font-size:.8rem;line-height:1.25;color:var(--soft)}.bkmini .warn{border-color:var(--p1,#b4452f)}.bkmini .warn b{color:var(--p1,#b4452f)}.bkcols{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px 22px;margin-top:12px}.bkcols h4{margin:0 0 6px;font-size:.92rem;color:var(--soft)}.bkrow{display:grid;grid-template-columns:5.2em 1fr 4.6em;gap:8px;align-items:center;padding:3px 4px;border-radius:8px;cursor:pointer}.bkrow:hover,.bkrow.on{background:color-mix(in srgb,var(--p2,#888) 14%,transparent)}.bkrow.on .bl{font-weight:700}.bkrow .bt{height:10px;border-radius:5px;background:var(--line);overflow:hidden}.bkrow .bn{text-align:right;font-variant-numeric:tabular-nums;font-weight:700}.bkrow small{font-weight:400;color:var(--soft)}.bkchips{display:flex;flex-wrap:wrap;gap:6px}.bkchip{font:inherit;border:1.5px solid var(--line);background:transparent;border-radius:999px;padding:3px 10px;cursor:pointer;color:inherit}.bkchip.on{background:var(--p2,#6b8e5a);color:#fff;border-color:transparent}.bkwrap.short{max-height:40vh}.bkun tr.sel td{background:color-mix(in srgb,var(--p2,#888) 18%,transparent);font-weight:700}';document.head.appendChild(st)}
function unitInfo(u){var o=NB.flat.filter(function(y){return y.id===u})[0];return o?{name:o.title,ch:o.ch.name,sem:o.sem,num:o.num}:{name:"（目錄找不到）",ch:"",sem:"",num:""}}
function bank(ctx){
 bkCss();var s=ctx.sheet("題庫","固定題；沒有的單元會自動用「隨機產生器」出題");
 M.api("GET","/api/admin/bank").then(function(r){
  ctx.box=s;migrateBanner(ctx,r.legacy);var rows=r.rows,fb=h('<div class="fb"></div>'),list=h("<div></div>");
  var bar=h('<div class="ctl wrapctl"></div>'),fc=document.createElement("select"),fu=document.createElement("select"),ft=sel([["","全部題型"],["num","數值題"],["choice","選擇題"],["text","文字題"],["tf","是非題"],["multi","勾選題"],["match","連連看"]],""),fl=sel([["","全部難度"],["1","難度 1 基礎"],["2","難度 2 應用"],["3","難度 3 挑戰"]],""),fk=sel([["","全部用途"],["print","可出卷"],["daily","可當每日一題"],["mock","可放模擬卷"],["off","已停用"],["img","有附圖"],["grp","題組"]],""),fd=sel([["","全部難易度"],["易","難易度：易"],["中","難易度：中"],["難","難易度：難"],["none","尚未標屬性"]],""),fg=sel([["","全部認知層次"],["知識","知識"],["理解","理解"],["應用","應用"],["分析","分析"],["評鑑","評鑑"],["創造","創造"]],""),fq=inp("","搜尋題目文字、id 或題組ID"),nw=h('<button class="pen go">＋ 新增題目</button>');
  var units={},chs={};rows.forEach(function(x){units[x.unit]=1;chs[String(x.unit).split(".")[0]]=1});NB.flat.forEach(function(o){units[o.id]=1;chs[o.id.split(".")[0]]=1});
  var chName=function(c){var o=NB.flat.filter(function(y){return y.id.split(".")[0]===c})[0];return o?c+" "+o.sem+"第"+o.ch.no+"章 "+o.ch.name:c};
  fc.innerHTML='<option value="">全部章（'+rows.length+"）</option>"+NB.sortIds(Object.keys(chs).map(function(c){return c+".1"})).map(function(c){return c.slice(0,-2)}).map(function(c){return'<option value="'+esc(c)+'">'+esc(chName(c))+"</option>"}).join("");
  function fillUnits(){var c=fc.value;fu.innerHTML='<option value="">'+(c?"此章全部細項":"全部單元")+"</option>"+NB.sortIds(Object.keys(units)).filter(function(u){return!c||String(u).split(".")[0]===c}).map(function(u){return'<option value="'+esc(u)+'">'+esc(u)+"</option>"}).join("")}
  fillUnits();
  [fc,fu,ft,fl,fk,fd,fg,fq,nw].forEach(function(e){bar.appendChild(e)});bar.className+=" bkbar";
  /* 統計面板：跟著下面的篩選即時變動（預設＝全部） */
  var USES={print:["可出卷",function(x){return x.print==="1"}],daily:["每日一題",function(x){return x.daily==="1"}],mock:["可放模擬卷",function(x){return x.mock!=="0"}],off:["已停用",function(x){return x.active==="0"}],img:["有附圖",function(x){return !!(x.img||x.himg)}],grp:["題組",function(x){return !!x.gid}]};
  var TYPES=[["num","數值題"],["choice","選擇題"],["text","文字題"],["tf","是非題"],["multi","勾選題"],["match","連連看"]],LVS=[["1","1 基礎"],["2","2 應用"],["3","3 挑戰"]];
  var chOf=function(u){return String(u).split(".")[0]};
  function match(x,skipUnit){var k=fq.value.trim();return(skipUnit||((!fc.value||chOf(x.unit)===fc.value)&&(!fu.value||x.unit===fu.value)))&&(!ft.value||x.type===ft.value)&&(!fl.value||String(x.lv)===fl.value)&&(!fk.value||USES[fk.value][1](x))&&(!fd.value||(fd.value==="none"?!(x.diff||x.cog||x.perf||x.content||x.know):x.diff===fd.value))&&(!fg.value||x.cog===fg.value)&&(!k||(x.q+x.id+(x.gid||"")).indexOf(k)>=0)}
  var dash=h('<div class="bkdash"></div>'),det=document.createElement("details");det.className="bkun";det.open=true;
  var filtered=function(){return fc.value||fu.value||ft.value||fl.value||fk.value||fd.value||fg.value||fq.value.trim()};
  function barRows(list,total,key,cur){return list.map(function(t){var n=t[2],pc=total?Math.round(100*n/total):0;return'<div class="bkrow'+(cur===t[0]?" on":"")+'" data-k="'+key+'" data-v="'+t[0]+'"><span class="bl">'+esc(t[1])+'</span><span class="bt"><i style="width:'+pc+'%"></i></span><span class="bn">'+n+'<small> '+pc+'%</small></span></div>'}).join("")}
  function renderDash(a){
    var n=a.length,on=a.filter(function(x){return x.active!=="0"}).length,secs=NB.flat.filter(function(o){return(!fc.value||chOf(o.id)===fc.value)&&(!fu.value||o.id===fu.value)}).length||(fu.value?1:0),seen={};a.forEach(function(x){if(x.active!=="0")seen[x.unit]=1});
    var cov=Object.keys(seen).length,pc=rows.length?Math.round(100*n/rows.length):0,by={};rows.filter(function(x){return match(x,0)&&x.active!=="0"}).forEach(function(x){by[x.unit]=(by[x.unit]||0)+1});
    var thin=NB.flat.filter(function(o){return(!fc.value||chOf(o.id)===fc.value)&&(!fu.value||o.id===fu.value)&&(by[o.id]||0)<5}).length;
    var tc=TYPES.map(function(t){return[t[0],t[1],a.filter(function(x){return x.type===t[0]}).length]}),lc=LVS.map(function(t){return[t[0],t[1],a.filter(function(x){return String(x.lv)===t[0]}).length]});
    var uc=Object.keys(USES).map(function(k){return'<button class="bkchip'+(fk.value===k?" on":"")+'" data-k="use" data-v="'+k+'">'+USES[k][0]+" <b>"+a.filter(function(x){return USES[k][1](x)}).length+"</b></button>"}).join("");
    dash.innerHTML='<div class="bkhead"><div class="bkbig"><b>'+n+'</b><span>題'+(filtered()?" ／ 全部 "+rows.length+" 題":"")+'</span><div class="bktrack"><i style="width:'+pc+'%"></i></div><small>'+(filtered()?"目前篩選中（佔全部 "+pc+"%）":"目前顯示：全部題庫")+'</small>'+(filtered()?' <button class="pen" data-k="clear">清除篩選</button>':"")+'</div>'+
     '<div class="bkmini"><div><b>'+on+'</b><span>啟用中</span></div><div><b>'+(n-on)+'</b><span>已停用</span></div><div><b>'+cov+" / "+secs+'</b><span>有題的節 / 範圍內節數</span></div><div class="'+(thin?"warn":"")+'"><b>'+thin+'</b><span>啟用題少於 5 題的節</span></div></div></div>'+
     '<div class="bkcols"><div><h4>題型</h4>'+barRows(tc,n,"type",ft.value)+'</div><div><h4>難度</h4>'+barRows(lc,n,"lv",fl.value)+'</div><div><h4>用途（點選可篩選）</h4><div class="bkchips">'+uc+"</div></div></div>"}
  function renderUnits(){
    var by={};rows.forEach(function(x){if(!match(x,1))return;var b=by[x.unit]=by[x.unit]||{n:0,a:0,l:[0,0,0,0]};b.n++;if(x.active!=="0")b.a++;b.l[+x.lv||0]++});
    var ul=NB.flat.map(function(o){return o.id});Object.keys(units).forEach(function(u){if(ul.indexOf(u)<0)ul.push(u)});ul=ul.filter(function(u){return!fc.value||chOf(u)===fc.value});
    var few=ul.filter(function(u){return !by[u]||by[u].a<5}).length;
    var dt='<summary>各單元題數（'+ul.length+' 節，'+few+' 節啟用題少於 5 題；數字跟著篩選變動；點一列篩選該節）</summary><div class="bkwrap short"><table class="tb"><tr><th>單元</th><th>名稱</th><th class="n">啟用</th><th class="n">全部</th><th class="n">難度1</th><th class="n">難度2</th><th class="n">難度3</th></tr>';
    ul.forEach(function(u){var b=by[u]||{n:0,a:0,l:[0,0,0,0]},i=unitInfo(u);dt+='<tr data-u="'+esc(u)+'" class="'+(b.a<5?"low ":"")+(fu.value===u?"sel":"")+'"><td>'+esc(u)+"</td><td>"+esc(i.sem+" "+i.num+" "+i.name)+'</td><td class="n">'+b.a+'</td><td class="n">'+b.n+'</td><td class="n">'+b.l[1]+'</td><td class="n">'+b.l[2]+'</td><td class="n">'+b.l[3]+"</td></tr>"});
    var op=det.open;det.innerHTML=dt+"</table></div>";det.open=op}
  s.appendChild(dash);s.appendChild(det);
  det.onclick=function(e){var r=e.target.closest("tr[data-u]");if(!r)return;var u=r.dataset.u;if(fu.value===u){fu.value=""}else{fc.value=chOf(u);fillUnits();fu.value=u}draw()};
  dash.onclick=function(e){var el=e.target.closest("[data-k]");if(!el)return;var k=el.dataset.k,v=el.dataset.v,tg=function(sl){sl.value=sl.value===v?"":v};
   if(k==="type")tg(ft);else if(k==="lv")tg(fl);else if(k==="use")tg(fk);else if(k==="clear"){[fc,fu,ft,fl,fk,fd,fg].forEach(function(x){x.value=""});fq.value="";fillUnits()}draw()};
  s.appendChild(bar);s.appendChild(fb);s.appendChild(list);
  function draw(){var a=rows.filter(function(x){return match(x,0)});renderDash(a);renderUnits();var t='<p class="meta">共 '+a.length+" 題"+(a.length>100?"（只顯示前 100，請用篩選）":"")+'</p><div class="bkwrap"><table class="tb"><tr><th>id</th><th>單元</th><th>題目</th><th>題型</th><th class="n">難度</th><th>屬性</th><th>用途</th><th></th></tr>';
   a.slice(0,100).forEach(function(x){var u=[];if(x.print==="1")u.push("出卷");if(x.daily==="1")u.push("每日");if(x.mock!=="0")u.push("模擬");if(x.gid)u.push("題組 "+x.gid+(x.gord?"#"+x.gord:""));if(x.active==="0")u.push("停用");t+="<tr><td class=\"sm\">"+esc(x.id)+"</td><td>"+esc(x.unit)+"<br><span class=\"meta\">"+esc(unitInfo(x.unit).name)+"</span></td><td>"+esc(String(x.q).slice(0,46))+"</td><td>"+({num:"數值",choice:"選擇",text:"文字"}[x.type]||esc(x.type))+"</td><td class=\"n\">"+x.lv+"</td><td class=\"sm\" title=\""+esc([x.perf,x.content,x.know].filter(Boolean).join(" / "))+"\">"+(x.diff||x.cog?esc([x.diff,x.cog].filter(Boolean).join("・")):"<span class=\"meta\">—</span>")+(x.know?"<br><span class=\"meta\">"+esc(String(x.know).slice(0,14))+"</span>":"")+"</td><td>"+u.join("・")+'</td><td><button class="pen" data-e="'+esc(x.id)+'">編輯</button> <button class="pen" data-d="'+esc(x.id)+'">刪除</button></td></tr>'});
   var el=h("<div>"+t+"</table></div></div>");list.innerHTML="";list.appendChild(el);
   el.onclick=function(e){var b=e.target.closest("button");if(!b)return;if(b.dataset.e!==undefined)edit(rows.filter(function(x){return x.id===b.dataset.e})[0]);else if(confirm("刪除題目 "+b.dataset.d+"？"))M.api("POST","/api/admin/bank/delete",{ids:[b.dataset.d]}).then(ctx.go,function(er){msg(fb,errs(er),0)})}}
  fc.onchange=function(){fillUnits();draw()};fu.onchange=ft.onchange=fl.onchange=fk.onchange=fd.onchange=fg.onchange=fq.oninput=draw;draw();nw.onclick=function(){edit(null)};
  function edit(x){x=x||{id:"",unit:fu.value||"6d-5.3",type:"num",lv:2,q:"",options:"",answer:"",hint:"",diag:"",img:"",himg:"",print:"",daily:"",mock:"1",active:"1",perf:"",content:"",diff:"",cog:"",know:"",gid:"",gstem:"",gimg:"",gord:""};
   var ed=ctx.sheet(x.id?"編輯題目":"新增題目",x.id?esc(x.id):"儲存後立刻出現在小測驗、出卷、每日一題、模擬卷"),F={};
   var dl=document.createElement("datalist");dl.id="ul";NB.flat.forEach(function(o){var e=document.createElement("option");e.value=o.id;e.label=o.sem+" "+o.num+" "+o.title;dl.appendChild(e)});ed.appendChild(dl);
   F.unit=inp(x.unit);F.unit.setAttribute("list","ul");F.type=sel([["num","數值題（填數字）"],["choice","選擇題"],["text","文字題（輸入文字）"],["tf","是非題（答案填 對 或 錯）"],["multi","勾選題（可複選，列印卷用）"],["match","連連看（列印卷用）"]],x.type);F.kind=sel([["","（未標示，列印時依題目長短推測）"],["計算題","計算題"],["應用題","應用題"],["情境題","情境題"],["圖表題","圖表題"],["概念題","概念題"]],x.kind||"");F.lv=sel([[1,"1 基礎"],[2,"2 應用"],[3,"3 挑戰"]],x.lv);F.q=area(x.q,3);F.options=area(String(x.options||"").split("|").join("\n"),4);F.answer=inp(x.answer);F.hint=area(x.hint,2);F.diag=area(String(x.diag||"").split(";;").join("\n"),2);F.img=inp(x.img);F.himg=inp(x.himg);
   F.perf=inp(x.perf||"","例如 n-III-3（多個用逗號）");F.content=inp(x.content||"","例如 N-5-3");F.diff=sel([["","（未標示）"],["易","易"],["中","中"],["難","難"]],x.diff||"");F.cog=sel([["","（未標示）"],["知識","知識"],["理解","理解"],["應用","應用"],["分析","分析"],["評鑑","評鑑"],["創造","創造"]],x.cog||"");F.know=inp(x.know||"","例如 公因數和最大公因數");
   F.gid=inp(x.gid||"","題組ID，例如 5u-9.2-A（沒有就留空）");F.gstem=area(x.gstem||"",3);F.gimg=inp(x.gimg||"","題組附圖（選填）");F.gord=inp(x.gord||"","小題序，例如 1（不填就排在最後）","number");
   F.print=sel([["","不放進出卷"],["1","可放進出卷"]],x.print);F.daily=sel([["","不當每日一題"],["1","可當每日一題"]],x.daily);F.mock=sel([["1","可放進模擬卷"],["0","不放模擬卷"]],x.mock);F.active=sel([["1","啟用"],["0","停用"]],x.active);
   var pv=h('<div class="q" style="min-height:3em"></div>');
   function prev(){var t=F.q.value;pv.innerHTML=NB.tx?NB.tx(t):esc(t)}F.q.oninput=prev;prev();
   ed.appendChild(field("單元代號",F.unit));ed.appendChild(field("題型（作答形式）",F.type));ed.appendChild(field("題目類別（列印出卷可依類別挑題）",F.kind));ed.appendChild(field("難度",F.lv));
   ed.appendChild(h('<p class="meta">題目屬性（列印練習卷可依這些篩選、顯示、做雙向細目表；可以留空）</p>'));ed.appendChild(field("學習表現",F.perf));ed.appendChild(field("學習內容",F.content));ed.appendChild(field("難易度（易／中／難）",F.diff));ed.appendChild(field("認知層次",F.cog));ed.appendChild(field("知識類型",F.know));
   ed.appendChild(h('<p class="meta">題組（幾個小題共用一段題幹；留空＝一般單題。<b>同一個題組ID 的題幹是共用的</b>，改這裡的題幹會改到整組；題組ID 清空＝把這題移出題組。每日一題不使用題組。同一組的小題單元要相同、最多 10 題。）</p>'));ed.appendChild(field("題組ID",F.gid));ed.appendChild(field("題組題幹（可用 LaTeX；整組共用）",F.gstem));ed.appendChild(field("題組附圖",F.gimg));ed.appendChild(field("小題序",F.gord));
   ed.appendChild(field("題目（可用 $\\frac{1}{2}$ 這種 LaTeX）",F.q));ed.appendChild(h('<p class="meta">預覽</p>'));ed.appendChild(pv);
   var ow=field("選項（選擇題、勾選題：一行一個選項；連連看：一行一組，寫成「左邊=右邊」；是非題不用填）",F.options);ed.appendChild(ow);ed.appendChild(field("正確答案（選擇題要和某個選項完全相同；文字題可用 | 放多個可接受的答案，例如：假設法|假設；是非題填 對 或 錯；勾選題填所有正確選項，用 | 分隔；連連看可留空）",F.answer));ed.appendChild(field("提示／詳解",F.hint));
   ed.appendChild(field("常見錯誤提示（每行：錯誤答案=>提示）",F.diag));
   [["img","題目附圖"],["himg","詳解附圖"]].forEach(function(p){var w=h('<div class="ctl"></div>'),up=h('<button class="pen">上傳圖片</button>'),fl=document.createElement("input");fl.type="file";fl.accept="image/*";fl.hidden=true;
    up.onclick=function(){fl.click()};fl.onchange=function(){var f0=fl.files[0];if(!f0)return;up.textContent="上傳中…";resize(f0,function(b64){if(!b64){up.textContent="上傳圖片";return alert("讀不到這張圖片")}M.api("POST","/api/admin/image",{mime:"image/jpeg",b64:b64}).then(function(r){F[p[0]].value=r.ref;up.textContent="已上傳，換一張"},function(e){up.textContent="上傳圖片";alert(errs(e))})}) };
    w.appendChild(F[p[0]]);w.appendChild(up);w.appendChild(fl);ed.appendChild(field(p[1]+"（可貼 https 網址、assets/q/ 檔名，或按上傳）",w))});
   ["print","daily","mock","active"].forEach(function(k){ed.appendChild(field("",F[k]))});
   var ef=h('<div class="fb"></div>'),bt=h('<div class="ctl"><button class="pen go">儲存題目</button><button class="pen">取消</button></div>');ed.appendChild(bt);ed.appendChild(ef);
   bt.children[1].onclick=ctx.go;
   bt.children[0].onclick=function(){var o={id:x.id};COLS.forEach(function(k){if(F[k])o[k]=F[k].value});o.kind=F.kind.value;var gid0=F.gid.value.trim();if(gid0){o["題組ID"]=gid0;o["題組題幹"]=F.gstem.value.trim();o["題組附圖"]=F.gimg.value.trim();o["小題序"]=F.gord.value.trim()}else if(x.gid)o["題組ID"]="-";
    o.options=F.options.value.split("\n").map(function(v){return v.trim()}).filter(Boolean).join("|");o.diag=F.diag.value.split("\n").map(function(v){return v.trim()}).filter(Boolean).join(";;");
    var at={perf:F.perf.value.trim(),content:F.content.value.trim(),diff:F.diff.value,cog:F.cog.value,know:F.know.value.trim()},had=!!(x.perf||x.content||x.diff||x.cog||x.know),has=!!(at.perf||at.content||at.diff||at.cog||at.know);
    M.api("POST","/api/admin/bank",{rows:[o],mode:"merge"}).then(function(r){if(!r.ok)return msg(ef,r.errs.map(esc).join("<br>"),0);
     if(!has&&!had){msg(ef,"已儲存",1);return setTimeout(ctx.go,500)}
     at.id=(r.ids&&r.ids[0])||o.id;return M.api("POST","/api/admin/meta",{rows:[at],mode:"merge"}).then(function(m){if(!m.ok)return msg(ef,"題目已儲存，但屬性有問題："+m.errs.map(esc).join("<br>"),0);msg(ef,"已儲存",1);setTimeout(ctx.go,500)})},function(e){msg(ef,errs(e),0)})};
   ed.scrollIntoView()}
  /* ---- 匯入／匯出（題庫與題目屬性共用同一個區塊）：先選資料類型，欄名不符就整份不匯入 ---- */
  var bk=ctx.sheet("匯入／匯出","題庫與題目屬性都在這裡匯入。先選資料類型；第一列必須是欄名，欄名不符就整份都不會匯入"),mi=h('<p class="meta">讀取中…</p>');
  bk.appendChild(mi);M.api("GET","/api/admin/meta").then(function(r){mi.innerHTML="目前題庫 <b>"+r.bank+"</b> 題，其中 <b>"+r.covered+"</b> 題已有屬性"+(r.bank-r.covered?"，還有 <b>"+(r.bank-r.covered)+"</b> 題沒有（這些題在列印篩選時不會被選到）":"，全部都有了")+(r.orphans?"；屬性表裡有 "+r.orphans+" 列的 id 在題庫找不到（不影響使用）":"")+"。"},function(){mi.textContent=""});
  var KH=["kind","題目類別","類別"];
  var GRPH=["題組id","題組題幹","題組附圖","小題序","gid","gstem","gimg","gord"],GRPN=["題組ID","題組題幹","題組附圖","小題序"];
  var AK=["perf","content","diff","cog","know"],AH=["學習表現","學習內容","難易度","認知層次","知識類型"],ATTR=AH.concat(AK);
  var KINDS={bank:{label:"題庫（題目；後面可以多帶屬性欄與題組欄）",api:"/api/admin/bank",req:["unit","type","q","answer"],allow:COLS.concat(ATTR,GRPH,KH),
    guide:"必要欄位：<b>unit、type、q、answer</b>（id 可以空白，系統會自動編）。其他欄位：lv、options、hint、diag、img、himg、print、daily、mock、active、<b>題目類別</b>（計算題／應用題／情境題／圖表題／概念題；列印出卷可依類別挑題）。<br><b>type</b> 可填：num（填數字）、choice（選擇）、text（填文字）、<b>tf</b>（是非，answer 填 對 或 錯，也可以寫 ○／✕）、<b>multi</b>（勾選，options 用 | 分隔，answer 填所有正確選項、用 | 分隔）、<b>match</b>（連連看，options 寫成「左=右|左=右」，answer 可留空）。勾選題與連連看只用在列印練習卷，不會出現在小測驗、模擬卷和每日一題。後面可以多加 <b>學習表現、學習內容、難易度、認知層次、知識類型</b>，題目和屬性會一起存。<br><b>題組</b>（幾個小題共用一段題幹或情境）：再加 <b>題組ID、題組題幹、小題序</b>（還可以有 題組附圖）。同一個題組ID的列會合成一組，<b>題幹只要寫在其中一列</b>，小題序決定順序（不填就照列的先後）；同一組的小題要<b>放在一起</b>、單元要相同、最多 10 題。題組會整組一起出題，不會拆開；<b>每日一題</b>不使用題組。沒有帶題組欄位的列，不會動到原本的題組；題組ID 填「-」＝把這題移出題組。",
    sample:COLS.concat(AH,GRPN,["題目類別"]).join(",")+"\n"+["","6d-5.3","num","2","範例題目：2+3=?","","5","先算 2+3","","","","1","","1","1","","","易","理解","加法","","","","","計算題"].join(",")+"\n"+["","6d-5.3","num","2","（題組第 1 小題）小明有 5 顆糖，吃掉 2 顆，還剩幾顆？","","3","5-2","","","","1","","1","1","","","易","理解","減法","範例組A","小明有 5 顆糖，媽媽又給他 4 顆。請回答下列問題。","","1","應用題"].join(",")+"\n"+["","6d-5.3","num","2","（題組第 2 小題）現在共有幾顆糖？","","9","5+4","","","","1","","1","1","","","易","理解","加法","範例組A","","","2","應用題"].join(",")+"\n"+["","6d-5.3","tf","1","三角形的內角和是 180 度。","","對","","","","","1","","0","1","","","易","知識","三角形","","","","","概念題"].join(",")},
   meta:{label:"題目屬性表（只有屬性，用 id 對應已有的題目）",api:"/api/admin/meta",req:["id"],need:ATTR,allow:["id"].concat(ATTR),
    guide:"必要欄位：<b>id</b>，加上至少一個屬性欄：<b>學習表現、學習內容、難易度、認知層次、知識類型</b>（中英文欄名皆可）。id 要和題庫的 id 一樣；難易度只能填 易／中／難。",
    sample:"id,學習表現,學習內容,難易度,認知層次,知識類型\n範例id,n-III-3,N-5-3,中,應用,公因數"}};
  var kind=sel([["bank",KINDS.bank.label],["meta",KINDS.meta.label]],"bank"),gd=h('<p class="meta"></p>');
  bk.appendChild(field("資料類型",kind));bk.appendChild(gd);
  var ta=area("",5),bn=h('<p class="meta"></p>');bk.appendChild(pickCsv(ta,bn,true));bk.appendChild(bn);bk.appendChild(ta);
  var mode=sel([["merge","合併（id 相同就更新，其他保留）"],["replace","全部取代（原有的會被清掉）"]],"merge"),bt=h('<div class="ctl"></div>'),bf=h('<div class="fb"></div>');
  var b1=h('<button class="pen go">匯入</button>'),bx=h('<button class="pen">下載範本</button>'),b2=h('<button class="pen">匯出題庫 CSV（含屬性）</button>'),c2=h('<button class="pen">匯出屬性表 CSV</button>');
  [mode,b1,bx,b2,c2].forEach(function(e){bt.appendChild(e)});bk.appendChild(bt);bk.appendChild(bf);
  function drawGuide(){gd.innerHTML=KINDS[kind.value].guide;mode.options[1].textContent=kind.value==="bank"?"全部取代（整個題庫會被換掉）":"全部取代（原有的屬性會被清掉）"}kind.onchange=drawGuide;drawGuide();
  /* 檢查一份檔案的格式；回傳 {err} 或 {rows, ignored} */
  function parseSrc(x,K){
   var p=parseCSV(x.text).filter(function(r){return r.some(function(c){return String(c).trim()})});
   if(!p.length)return{err:"沒有內容"};
   var head=p[0].map(function(c){return String(c).trim().toLowerCase()}),miss=K.req.filter(function(c){return head.indexOf(c)<0});
   if(miss.length)return{err:"第一列要是欄名，而且必須有："+K.req.join("、")+"（缺少："+miss.join("、")+"）。如果只是欄名不一樣，請改成上面的欄名"};
   if(K.need&&!K.need.some(function(c){return head.indexOf(c)>=0}))return{err:"至少要有一個屬性欄："+AH.join("、")};
   if(K.need&&["unit","type","q","answer"].some(function(c){return head.indexOf(c)>=0}))return{err:"這看起來是題庫檔（有 unit、type、q、answer 欄）。請把上面的「資料類型」改成「題庫」再匯入"};
   var ign=head.filter(function(c){return c&&K.allow.indexOf(c)<0});
   var rows=[];for(var i=1;i<p.length;i++){var r=p[i];
    if(r.length>head.length&&r.slice(head.length).some(function(c){return String(c).trim()}))return{err:"第 "+i+" 列的欄位比欄名還多（可能是文字裡有逗號，沒有用引號包起來）"};
    var o={};head.forEach(function(k,j){if(k&&r[j]!==undefined)o[k]=String(r[j]).trim()});rows.push(o)}
   if(!rows.length)return{err:"只有欄名，沒有資料"};
   return{rows:rows,ignored:ign}}
  b1.onclick=function(){
   var K=KINDS[kind.value],src=ta.__files&&!ta.value.trim()?ta.__files:[{name:"貼上的內容",text:ta.value}],jobs=[],bad=[],ign={};
   if(src.length===1&&!src[0].text.trim())return msg(bf,"還沒有內容：請選檔案，或把 CSV 內容貼上來。",0);
   src.forEach(function(x){var r=parseSrc(x,K);if(r.err){bad.push("【"+x.name+"】"+r.err);return}
    r.ignored.forEach(function(c){ign[c]=1});var base=1,cur=[],sz=0;
    r.rows.forEach(function(o){var z=JSON.stringify(o).length,g0=o["題組id"]||o.gid||"",gl=cur.length?(cur[cur.length-1]["題組id"]||cur[cur.length-1].gid||""):"";if(cur.length&&(cur.length>=1500||sz+z>650000)&&!(g0&&g0!=="-"&&g0===gl)){ /* 同一個題組的列不拆到兩批，題幹檢查才對得上 */jobs.push({file:x.name,rows:cur,base:base});base+=cur.length;cur=[];sz=0}cur.push(o);sz+=z});
    if(cur.length)jobs.push({file:x.name,rows:cur,base:base})});
   if(bad.length)return msg(bf,"<b>格式不符，完全沒有匯入：</b><br>"+bad.map(esc).join("<br>"),0);
   var ig=Object.keys(ign);if(ig.length&&!confirm("這些欄位不認得，會被忽略：\n"+ig.join("、")+"\n\n如果是欄名打錯（例如多了空白或寫錯字），請先取消、改好再匯入。\n確定要忽略它們繼續嗎？"))return;
   if(mode.value==="replace"&&!confirm(kind.value==="bank"?"這會刪除現有全部題目，改成匯入的內容。確定？":"這會清掉現有全部屬性，改成匯入的內容。確定？"))return;
   var total=jobs.reduce(function(a,j){return a+j.rows.length},0),orphan=0,gcount=0;b1.disabled=true;
   function done(){b1.disabled=false}
   function pass(dry,k){ /* dry：只檢查不寫入；全部檢查完才真正寫入 */
    if(k>=jobs.length)return Promise.resolve(true);var j=jobs[k];msg(bf,(dry?"檢查中 ":"匯入中 ")+(k+1)+" / "+jobs.length+"（"+esc(j.file)+"）…",1);
    return M.api("POST",K.api,{rows:j.rows,mode:!dry&&k===0&&mode.value==="replace"?"replace":"merge",dry:dry?1:0,base:j.base}).then(function(x){if(!x.ok)bad=bad.concat(x.errs.map(function(e){return"【"+j.file+"】"+e}));else if(dry){orphan+=x.orphans||0;gcount+=x.groups||0}return pass(dry,k+1)})}
   pass(true,0).then(function(){if(bad.length){done();return msg(bf,"<b>有地方要修正，完全沒有匯入：</b><br>"+bad.slice(0,30).map(esc).join("<br>")+(bad.length>30?"<br>…還有 "+(bad.length-30)+" 項":""),0)}
    return pass(false,0).then(function(){done();msg(bf,"已匯入 "+total+(kind.value==="bank"?" 題":" 列屬性")+"（"+src.length+" 個來源）"+(gcount?"，含 "+gcount+" 個題組":"")+(orphan?"。其中 "+orphan+" 列的 id 在題庫找不到，已先存起來，之後題庫有那題就會對上":""),1);setTimeout(ctx.go,900)})}).catch(function(e){done();msg(bf,errs(e)+"。已完成的批次不會復原，可以重新匯入（相同 id 會更新，不會重複）。",0)})};
  bx.onclick=function(){download(kind.value==="bank"?"題庫範本.csv":"題目屬性表範本.csv",KINDS[kind.value].sample)};
  b2.onclick=function(){download("題庫.csv",COLS.concat(AH,["題目類別"]).join(",")+"\n"+rows.map(function(x){return COLS.concat(AK,["kind"]).map(function(k){return csvEsc(x[k])}).join(",")}).join("\n"))};
  c2.onclick=function(){var K=["id","perf","content","diff","cog","know"];download("題目屬性表.csv",["id"].concat(AH).join(",")+"\n"+rows.filter(function(x){return x.perf||x.content||x.diff||x.cog||x.know}).map(function(x){return K.map(function(k){return csvEsc(x[k])}).join(",")}).join("\n"))};
 },function(e){s.appendChild(h('<div class="fb no">'+errs(e)+"</div>"))})}

/* ---------- 系統參數與提醒（管理員、唯讀）：這個專案在 Cloudflare 上的所有參數，加上「怎麼設比較好」與寫入／讀取的注意事項 ---------- */
var SYS_DOCS=[
 ["PRINT_DAILY_CAP","學生每天（滾動 24 小時）最多出幾份練習卷","wrangler.toml","每出一份卷，資料庫就寫入 1 筆列印紀錄。建議 3～5；調高會讓寫入與流量跟著增加。用「自訂大題」或「挑題」出卷也只算 1 份、只寫 1 筆。"],
 ["PRINT_DAILY_CAP_TEACHER","老師每天最多出幾份（管理員不限）","wrangler.toml","目前設為 10。老師一份卷也只寫 1 筆；挑題只讀記憶體、不寫資料庫。"],
 ["PRINT_WM","學生列印的練習卷是否一律加浮水印（姓名、班級座號、Email、IP、時間）","wrangler.toml",'"1"＝強制（建議）；"0"＝不強制。浮水印是外流時追查來源用的，不建議關。'],
 ["MOCK_WM","模擬考作答畫面是否加浮水印","wrangler.toml",'預設開啟，設成 "0" 才關閉。'],
 ["REPORT_TO","問題回報寄到哪個信箱","wrangler.toml","要同時設定 RESEND_API_KEY 才會真的寄信；沒設定時，回報仍會存在後台的「問題回報」。"],
 ["ALLOWED_ORIGINS","允許呼叫 API 的前端網址（CORS，多個用逗號隔開）","wrangler.toml","必須和網站網址完全一致（含 https、不含結尾斜線）。網站換網域時一定要同步修改，否則瀏覽器會擋掉所有 API，畫面看起來像是全部壞掉。"],
 ["ALLOW_LOCALHOST","是否允許本機（localhost）呼叫 API","wrangler.toml",'平常要是 "0"。只有在自己電腦測試時才改成 "1"，測完一定改回去，否則別人可以在自己電腦上冒充你的前端。'],
 ["FIREBASE_PROJECT_ID","驗證 Google 登入用的 Firebase 專案代號","wrangler.toml","要和前端 Firebase 設定的專案一致。改錯會讓所有人登入失敗，平常不要動。"],
 ["ALLOWED_PROVIDERS","允許的登入方式","wrangler.toml",'目前是 "google.com"。'],
 ["JWKS_URL","驗證登入憑證的金鑰網址","wrangler.toml","通常不用設（空白＝用 Firebase 預設網址）。"],
 ["POINTS_BY_LEVEL","答對一題的積分（基礎,應用,挑戰）","後台「遊戲設定」（優先）／wrangler.toml","在後台「遊戲設定」改，全班立刻生效，不用重新部署；這裡顯示的是 wrangler.toml 的值，實際生效的值看下方「目前生效」。"],
 ["LEVEL_STEP","每幾分升一級","後台「遊戲設定」／wrangler.toml","同上。數字越大升級越慢。"],
 ["DAILY_Q_CAP","每人每天最多計分的題數","後台「遊戲設定」／wrangler.toml","防止刷分；也等於限制每人每天的寫入量。太高會增加資料庫寫入，建議 100 左右。"],
 ["RATE_PER_MIN","每位使用者每分鐘最多幾次 API 請求（管理員不限）","wrangler.toml",'預設 120，正常使用遠低於此值，是擋失控腳本用的。記憶體內計算、不寫資料庫；設成 "0" 關閉。'],
 ["DAILY_MOCK_CAP","每人每天最多做幾次模擬卷","後台「遊戲設定」／wrangler.toml","每份模擬卷會寫入作答紀錄，建議 2～3。"],
 ["REVIEW_DAYS","錯題複習的間隔天數","後台「遊戲設定」／wrangler.toml","例如 1,3,7＝答對一次隔 1 天再考、再對隔 3 天、再對隔 7 天，全部通過才畢業。"],
 ["HINT_COST","看一次提示扣幾分","後台「遊戲設定」／wrangler.toml","0＝不扣分；看過提示的題目答對只拿一半積分。"]
];
var SYS_LIM=[
 ["printRange","每份練習卷題數（快速出卷）","5～40 題"],["planTeacher","自訂大題：老師每份卷最多","50 題、8 個大題（管理員不限）"],["planStudent","自訂大題：學生每份卷最多","30 題、4 個大題"],
 ["poolPer10minTeacher","挑題查詢：老師每 10 分鐘最多","20 次（每次最多 30 題；學生 10 次；管理員不限）"],["announceMax","公告最多存","30 則"],["bankImportRows","題庫單次匯入","2000 題一批（大檔會自動分批）"],
 ["groupMax","一個題組最多","10 個小題"],["cacheSeconds","題庫與名單的記憶體快取","10 秒檢查一次有沒有更新"],["printKeepDays","列印紀錄保留","180 天（自動清理）"]
];
var SYS_NOTES=[
 ["免費額度（以 Cloudflare 官方文件為準）","<ul><li><b>D1 資料庫（免費）</b>：每天讀取 500 萬列、寫入 10 萬列、容量 5 GB；每天 UTC 00:00（台灣 08:00）歸零。</li><li><b>Workers（免費）</b>：每天 10 萬次請求；每次請求的 CPU 時間約 10 毫秒。</li><li>「讀取列數」算的是<b>掃描過的列數</b>，不是回傳的列數；「寫入列數」是新增、修改、刪除的列數（索引也會多算）。一列不論多大都只算一列。</li></ul>"],
 ["哪些動作會寫入資料庫","<ul><li>學生答題、交卷：更新個人檔案，每次約 1～3 列。</li><li>每份列印卷：1 列列印紀錄（自訂大題、挑題一樣只有 1 列）。</li><li><b>匯入題庫：每一題 1 列，還要加上屬性表、題組表</b>。整本 4,700 題匯入一次約 5,000～10,000 列寫入。</li><li>老師後台改名單、公告、設定：每次幾列。</li></ul><p>大量寫入的動作，建議<b>避開上課時間</b>，而且一天不要重複做很多次。</p>"],
 ["匯入題庫的建議做法","<ul><li>改一兩題：用「編輯題目」，只寫 1 列。</li><li>新增一批：用「合併」，只會新增／更新有出現的題。</li><li><b>「取代」會先刪光全部題庫再寫入</b>，寫入量最大，也會讓所有人的快取重讀，非必要不要用。</li><li>匯入前先用「只檢查」（系統會先全部檢查才寫入），有錯整份都不會寫入，不會浪費額度。</li><li>同一份檔案修好後再匯入，相同 id 是「更新」，不會變成兩份。</li></ul>"],
 ["讀取量最大的是什麼","<ul><li>每個 Worker 伺服器實例第一次需要題庫時，會把整張題庫、名單、屬性表、題組表讀進記憶體：<b>讀取列數≈題庫題數＋名單人數＋屬性與題組列數</b>（題庫 4,700 題時，一次約 5,000～10,000 列）。</li><li>之後 10 秒檢查一次「版本號」，沒有改動就不會重讀。<b>只要有人改題庫、名單、設定，版本號就會變，所有實例都會重讀一次</b>。</li><li>所以：<b>不要在上課時間頻繁改題庫</b>；一天改很多次，讀取量會成倍增加。</li><li>挑題、題目清單都是讀記憶體裡的快取，不會多讀資料庫。</li></ul>"],
 ["不要這樣做","<ul><li>不要把圖片放進資料庫（後台上傳圖片會存進 D1，量大會佔容量）；圖片請放在網站的 <code>assets/q/</code>，用檔名引用。</li><li>不要把 RESEND_API_KEY、Firebase 金鑰貼到聊天、截圖或程式碼裡；密鑰只用 <code>npx wrangler secret put 名稱</code> 設定。</li><li>不要開 ALLOW_LOCALHOST 後忘記關。</li><li>不要同時從多個瀏覽器分頁一直按「匯入」，一份一份來。</li></ul>"],
 ["要改參數時","<ul><li><b>遊戲類</b>（積分、升級、每日題數、提示扣分…）：直接在上面「遊戲設定」改，立刻生效。</li><li><b>wrangler.toml 的參數</b>：改檔案 → commit、push 後端 repo → 等 GitHub Actions 出現 ✓ 才會生效。</li><li><b>密鑰</b>：在後端資料夾執行 <code>npx wrangler secret put RESEND_API_KEY</code>，貼上後 Enter（不用 push）。</li><li>這一頁只能看，不能改，避免誤按。</li></ul>"],
 ["額度快用完時","<ul><li>先看「資料表筆數與用量」，確認是哪一張表最大。</li><li>列印紀錄會自動保留 180 天；問題回報、舊的作答紀錄可以到「資料管理」清理。</li><li>超過免費額度時，API 會開始失敗，到隔天 UTC 00:00 才恢復；若常常超過，再考慮升級付費方案（門檻比免費高很多）。</li><li>資料庫備份：Cloudflare 後台的 D1 有「Time Travel」可以還原到過去某個時間點（保留天數依方案而定），重大匯入或刪除前，也可以先匯出題庫與名單 CSV 留一份。</li></ul>"]
];
/* ---------- Cloudflare 用量儀表板（管理員）：讀 Cloudflare 的統計，不讀自己的資料庫 ---------- */
function usage(ctx){
 var s=ctx.sheet("Cloudflare 用量儀表板","今天的實際用量對照免費額度（每天 UTC 00:00＝台灣早上 8 點歸零）。讀的是 Cloudflare 的統計，不會增加資料庫讀寫。"),box=h("<div>讀取中…</div>");s.appendChild(box);
 var LV={ok:"正常",warn:"留意",bad:"要處理"};
 function pct(a,b){return b?Math.min(100,Math.round(a/b*100)):0}
 function lvOf(p){return p>=80?"bad":p>=50?"warn":"ok"}
 function num(n){return Math.round(+n||0).toLocaleString()}
 function meter(name,val,lim,unit,extra){var p=pct(val,lim),l=lvOf(p);return'<div class="um '+l+'"><div class="ut"><b>'+esc(name)+'</b><span>'+p+'%</span></div><div class="ub"><i style="width:'+Math.max(p,val>0?2:0)+'%"></i></div><div class="uv">'+num(val)+" / "+num(lim)+" "+esc(unit)+(extra?"<br><small class=\"soft\">"+esc(extra)+"</small>":"")+"</div></div>"}
 function spark(name,days,key,lim){var mx=Math.max.apply(null,days.map(function(d){return d[key]}).concat([lim?lim*0.1:1]));return'<div class="us"><b>'+esc(name)+'</b><div class="ubars">'+days.map(function(d){var p=Math.max(2,Math.round(d[key]/mx*100));return'<span title="'+esc(d.d+"：約 "+num(d[key]))+'"><i style="height:'+p+'%"></i><small>'+esc(d.d.slice(5))+"</small></span>"}).join("")+"</div></div>"}
 function draw(r){
  box.innerHTML="";
  if(!r.configured){box.appendChild(h('<div class="wi"><b>還沒啟用</b>（缺：'+esc((r.missing||[]).join("、"))+'）<br><small class="soft">只要設定兩樣東西就會顯示真實用量：</small><ol class="soft"><li>Cloudflare 後台 → 右上角頭像 → My Profile → API Tokens → Create Token → Create Custom Token。權限選「Account → Account Analytics → Read」，建立後複製 token。</li><li>在專案的 backend 資料夾執行 <code>npx wrangler@4.151.3 secret put CF_API_TOKEN</code>，貼上 token。<b>token 不要貼在聊天或程式碼裡。</b></li><li>Cloudflare 後台首頁網址或右側欄找到「帳戶 ID」，填進 wrangler.toml 的 <code>CF_ACCOUNT_ID = "…"</code>，commit、push 後等 Actions ✓。</li></ol><small class="soft">沒設定時，下面的「系統參數與提醒」仍然可以用。</small></div>'));return}
  var T=r.today,L=r.limits,ok=r.ok||{},g=h('<div class="ugrid"></div>');
  g.innerHTML=(ok.workers?meter("Workers 請求數",T.requests,L.reqDay,"次",T.errors?"錯誤 "+num(T.errors)+" 次":""):"")+(ok.d1?meter("資料庫讀取",T.rowsRead,L.rowsReadDay,"列","讀取查詢 "+num(T.readQueries)+" 次")+meter("資料庫寫入",T.rowsWritten,L.rowsWrittenDay,"列","寫入查詢 "+num(T.writeQueries)+" 次"):"")+(ok.workers?meter("CPU 時間 P99",Math.round(T.cpuP99Ms*10)/10,L.cpuMs,"ms","P50 約 "+(Math.round(T.cpuP50Ms*10)/10)+" ms（每次請求上限）"):"")+(r.storage!=null?meter("資料庫容量",Math.round(r.storage/1048576),Math.round(L.storageBytes/1048576),"MB","整個帳號共用 5 GB"):"");
  box.appendChild(g);
  var tr=h('<div class="utr"></div>');tr.innerHTML=(ok.workersDays?spark("近 7 天請求數",r.days,"requests",L.reqDay):"")+(ok.d1?spark("近 7 天讀取列數",r.days,"rowsRead",L.rowsReadDay)+spark("近 7 天寫入列數",r.days,"rowsWritten",L.rowsWrittenDay):"");if(tr.innerHTML)box.appendChild(tr);
  var ad=h('<div class="uad"><b>建議</b></div>');(r.advice||[]).forEach(function(a){ad.appendChild(h('<div class="ua '+esc(a.level)+'"><span class="ul">'+(LV[a.level]||"")+"</span><div><b>"+esc(a.title)+"</b><br><small>"+esc(a.text)+"</small></div></div>"))});box.appendChild(ad);
  var er=Object.keys(r.errors||{}).filter(function(k){return r.errors[k]&&r.errors[k]!=="token"});if(er.length)box.appendChild(h('<p class="meta">有 '+er.length+" 項統計讀不到（"+esc(er.join("、"))+"），其餘照常顯示。可能是 Cloudflare 尚未提供該項統計。</p>"));
  var d=new Date(r.asof);box.appendChild(h('<p class="meta">資料時間：'+d.toLocaleString("zh-TW",{hour12:false})+(r.cached?"（暫存，2 分鐘內不會重抓）":"")+"。Cloudflare 的統計約有 1～2 分鐘延遲。</p>"))}
 function load(force){box.innerHTML="讀取中…";M.api("GET","/api/admin/usage"+(force?"?refresh=1":"")).then(function(r){draw(r);var b=h('<div class="ctl"><button class="pen">重新整理</button></div>');b.firstChild.onclick=function(){load(true)};box.appendChild(b)},function(e){box.innerHTML="";box.appendChild(h('<div class="fb no">'+errs(e)+"</div>"))})}
 load(false)}
function sysinfo(ctx){
 var s=ctx.sheet("系統參數與提醒","這個專案目前在 Cloudflare 上的設定（唯讀）。按說明展開看「怎麼設比較好」"),box=h("<div>讀取中…</div>");s.appendChild(box);
 M.api("GET","/api/admin/sysinfo").then(function(r){
  box.innerHTML="";var V=r.vars||{},ef=r.effective||{};
  var sb=h('<div class="wi"></div>');
  sb.innerHTML="<b>連線與密鑰</b><br>資料庫 D1（DB）："+(r.bindings.DB?"已連接":'<b class="flag">未連接</b>')+"　題庫與名單 KV（KV）："+(r.bindings.KV?"已連接":"未連接（沒有舊資料要搬時可忽略）")+"<br>寄信密鑰 RESEND_API_KEY："+(r.secrets.RESEND_API_KEY?"已設定":"<b>未設定</b>（問題回報只會存在後台，不會寄信）")+(V.ALLOW_LOCALHOST==="1"?'<br><b class="flag">注意：ALLOW_LOCALHOST 目前是 1，測完請改回 0。</b>':"");
  box.appendChild(sb);
  var eff=h('<div class="wi"></div>');eff.innerHTML="<b>目前生效的遊戲設定</b>（後台「遊戲設定」優先於 wrangler.toml）<br>積分 "+esc((ef.pts||[]).join(","))+"・每 "+ef.step+" 分升一級・每天最多計分 "+ef.capQ+" 題・模擬卷每天 "+ef.capMock+" 次・複習間隔 "+esc((ef.review||[]).join(","))+" 天・看提示扣 "+ef.hint+" 分";box.appendChild(eff);
  box.appendChild(h("<p class=\"meta\"><b>參數一覽</b>（名稱＝程式讀取的變數名稱）</p>"));
  SYS_DOCS.forEach(function(d){var v=V[d[0]],w=h('<div class="wi"></div>');w.innerHTML='<b><code>'+d[0]+"</code></b>　目前值："+(v===null||v===undefined?"<i>（未設定，用預設）</i>":"<code>"+esc(v)+"</code>")+'<br><small class="soft">設定位置：'+esc(d[2])+"</small><br>"+esc(d[1])+'<br><small class="soft">'+esc(d[3])+"</small>";box.appendChild(w)});
  var lim=h('<div class="wi"></div>'),L=r.limits||{};lim.innerHTML="<b>程式內建的上限</b>（寫在程式裡，改要請我修改）<ul>"+SYS_LIM.map(function(x){var v=x[0]==="printRange"?x[2]:x[2];return"<li>"+esc(x[1])+"："+esc(v)+"</li>"}).join("")+"</ul>";box.appendChild(lim);
  var st=h('<div class="wi"><b>資料表筆數與用量</b><br><small class="soft">按下去會逐張資料表計算筆數，<b>會讀取資料庫（約等於資料總筆數的讀取量）</b>，平常不用按。</small><div class="ctl"><button class="pen">查看資料表筆數</button></div><div class="st"></div></div>');
  st.querySelector("button").onclick=function(){var o=st.querySelector(".st");o.textContent="計算中…";M.api("GET","/api/admin/sysinfo?stats=1").then(function(x){var R=x.stats.rows,names={bank:"題庫",bank_meta:"題目屬性",bank_grp:"題組成員",grp_stem:"題組題幹",roster:"名單",profiles:"學生檔案",sessions:"作答／考試場次",attempts:"作答紀錄",prints:"列印紀錄",reports:"問題回報",images:"後台上傳的圖片",settings:"設定"},t="<ul>";Object.keys(names).forEach(function(k){t+="<li>"+names[k]+"（"+k+"）："+(R[k]===null?"—":R[k])+"</li>"});o.innerHTML=t+"</ul>近 24 小時列印 "+(x.stats.prints24h==null?"—":x.stats.prints24h)+" 份；估計每個實例冷啟動時會讀約 <b>"+((R.bank||0)+(R.roster||0)+(R.bank_meta||0)+(R.bank_grp||0)+(R.grp_stem||0)+(R.settings||0))+"</b> 列。"},function(e){o.textContent=errs(e)})};
  box.appendChild(st);
  box.appendChild(h("<p class=\"meta\"><b>提醒</b></p>"));
  SYS_NOTES.forEach(function(n){var d=h("<details class=\"wi\"><summary></summary><div></div></details>");d.querySelector("summary").textContent=n[0];d.lastChild.innerHTML=n[1];box.appendChild(d)});
 },function(e){box.innerHTML='<div class="fb no">'+errs(e)+"</div>"})}

/* ---------- 設定 ---------- */
function ann(ctx){
 var s=ctx.sheet("首頁公告","可建立多則；首頁預設顯示 3 則，其餘收在「更多公告」。置頂的在最前面，其餘依發布時間由新到舊；存檔後立即生效");
 var list=h("<div></div>"),fb=h('<div class="fb"></div>'),form=h("<div></div>");s.appendChild(list);s.appendChild(fb);s.appendChild(form);
 function dstr(ts){if(!ts)return"（舊版）";var d=new Date(ts+8*36e5);return d.getUTCFullYear()+"-"+("0"+(d.getUTCMonth()+1)).slice(-2)+"-"+("0"+d.getUTCDate()).slice(-2)}
 function state(a){var t=new Date(Date.now()+8*36e5).toISOString().slice(0,10);if(!a.on)return"已關閉";if(a.from&&t<a.from)return"尚未開始";if(a.until&&t>a.until)return"已過期";return"顯示中"}
 function load(){M.api("GET","/api/admin/announce").then(function(r){list.innerHTML="";var L=r.list||[];
  if(!L.length)list.appendChild(h('<p class="soft">目前沒有公告。</p>'));
  L.forEach(function(a){var row=h('<div class="wi"></div>'),st=state(a);
   var t=h("<div></div>");t.textContent=(a.pin?"［置頂］":"")+(a.level==="warn"?"［重要］":"")+(a.title?a.title+"：":"")+a.text;row.appendChild(t);
   var m=h('<small class="soft"></small>');m.textContent=st+"・發布 "+dstr(a.ts)+(a.from?"・自 "+a.from:"")+(a.until?"・至 "+a.until:"");row.appendChild(m);
   var c=h('<div class="ctl"><button class="pen">編輯</button><button class="pen">刪除</button></div>');
   c.children[0].onclick=function(){edit(a)};
   c.children[1].onclick=function(){if(!confirm("確定刪除這則公告？"))return;M.api("POST","/api/admin/announce/delete",{id:a.id}).then(function(){msg(fb,"已刪除",1);form.innerHTML="";load()},function(er){msg(fb,errs(er),0)})};
   row.appendChild(c);list.appendChild(row)});
  var add=h('<div class="ctl"><button class="pen go">新增公告</button></div>');add.firstChild.onclick=function(){edit(null)};list.appendChild(add)},function(e){list.appendChild(h('<div class="fb no">'+errs(e)+"</div>"))})}
 function edit(a){a=a||{};form.innerHTML="";var F={on:sel([["1","顯示"],["0","關閉"]],a.id&&!a.on?"0":"1"),pin:sel([["0","一般"],["1","置頂（排在最前面）"]],a.pin?"1":"0"),level:sel([["info","一般公告"],["warn","重要提醒（紅色標示）"]],a.level||"info"),title:inp(a.title||"","標題（40 字內，可留白）"),text:inp(a.text||"","內容（400 字內）"),from:inp(a.from||"","","date"),until:inp(a.until||"","","date")};
  if(a.id){F.repost=sel([["0","維持原發布時間"],["1","重新發布（移到最新）"]],"0")}
  form.appendChild(h("<h3>"+(a.id?"編輯公告":"新增公告")+"</h3>"));
  [["狀態",F.on],["排序",F.pin],["類型",F.level],["標題",F.title],["內容",F.text],["開始顯示的日期（留空＝立即）",F.from],["顯示到哪一天（含當天；留空＝不限期）",F.until]].forEach(function(x){form.appendChild(field(x[0],x[1]))});
  if(F.repost)form.appendChild(field("發布時間",F.repost));
  var b=h('<div class="ctl"><button class="pen go">儲存公告</button><button class="pen">取消</button></div>');form.appendChild(b);
  b.children[1].onclick=function(){form.innerHTML=""};
  b.children[0].onclick=function(){M.api("POST","/api/admin/announce",{id:a.id||"",on:F.on.value==="1",pin:F.pin.value==="1",level:F.level.value,title:F.title.value,text:F.text.value,from:F.from.value,until:F.until.value,repost:F.repost?F.repost.value==="1":false}).then(function(){msg(fb,"已儲存",1);form.innerHTML="";load()},function(er){var c=er&&er.code;msg(fb,c==="no_text"?"內容不能空白":c==="bad_range"?"開始日期不能晚於結束日期":c==="too_many"?"公告太多了，請先刪除舊的":"內容不合規定："+errs(er),0)})}}
 load()}
function settings(ctx){
 ann(ctx);
 var s=ctx.sheet("遊戲設定","改完按儲存，全班立刻套用；空白＝用預設值");
 M.api("GET","/api/admin/settings").then(function(r){var e=r.effective,F={
  POINTS_BY_LEVEL:inp(e.pts.join(",")),LEVEL_STEP:inp(e.step,"","number"),DAILY_Q_CAP:inp(e.capQ,"","number"),DAILY_MOCK_CAP:inp(e.capMock,"","number"),REVIEW_DAYS:inp(e.review.join(",")),HINT_COST:inp(e.hint,"","number"),QR_ON:h('<select><option value="0">關閉</option><option value="1">開放</option></select>')};F.QR_ON.value=e.qr?"1":"0";
  s.appendChild(field("答對一題的積分（基礎,應用,挑戰）",F.POINTS_BY_LEVEL));s.appendChild(field("每幾分升一級",F.LEVEL_STEP));s.appendChild(field("每天最多計分的題數（防刷）",F.DAILY_Q_CAP));s.appendChild(field("每天可領獎勵的模擬卷份數",F.DAILY_MOCK_CAP));s.appendChild(field("看一次提示扣幾分（0＝不扣；看過提示的題目答對只拿一半積分）",F.HINT_COST));s.appendChild(field("錯題複習間隔（幾天後，用逗號分隔）",F.REVIEW_DAYS));s.appendChild(field("QR code 線上作答（總開關：開放後，老師出卷時才能勾選「印 QR code 線上作答」；關閉時學生掃描也不能作答）",F.QR_ON));
  var fb=h('<div class="fb"></div>'),b=h('<div class="ctl"><button class="pen go">儲存設定</button></div>');s.appendChild(b);s.appendChild(fb);
  b.firstChild.onclick=function(){var o={};Object.keys(F).forEach(function(k){o[k]=F[k].value});M.api("POST","/api/admin/settings",o).then(function(){msg(fb,"已儲存",1)},function(er){msg(fb,errs(er),0)})}},function(e){s.appendChild(h('<div class="fb no">'+errs(e)+"</div>"))});
 if(M.U&&M.U.admin){usage(ctx);sysinfo(ctx)}}

/* ---------- 資料管理 ---------- */
function data(ctx){
 var s=ctx.sheet("資料管理","重設、刪除學生或整班的成績資料");
 s.appendChild(h("<p>學生個別的「重設／刪除」按鈕在「班級分析」頁的「全班進度」表格最右側；整班刪除在該表格下方。</p><p>學期結束建議流程：① 下載成績 CSV → ② 刪除整班資料 → ③ 在「學生名單」把學生刪除或停用。</p>"));
 var b=h('<div class="ctl"><a class="pen go" href="#overview">前往班級分析（全班進度）</a></div>');b.firstChild.onclick=function(e){e.preventDefault();ctx.tab("overview")};s.appendChild(b);
 var m=h('<div class="ctl"><button class="pen">檢查是否有舊資料可搬移</button></div>'),mf=h('<div class="fb"></div>');s.appendChild(m);s.appendChild(mf);
 m.firstChild.onclick=function(){M.api("GET","/api/admin/roster").then(function(r){if(!r.legacy)return msg(mf,"沒有需要搬移的舊資料。",1);ctx.box=s;ctx.go2=ctx.go;migrateBanner(ctx,true)},function(e){msg(mf,errs(e),0)})}}

/* ---- 問題回報（只有管理員）---- */
function reports(ctx){
 var s=ctx.sheet("問題回報","學生按「回報問題」送來的內容，最新的在最上面");
 var ST={new:"新的",doing:"處理中",done:"已處理"};
 M.api("GET","/api/admin/reports").then(function(r){
  if(!r.mail)s.appendChild(h('<p class="fb no">目前還沒設定寄信（RESEND_API_KEY），回報只會存在這裡，不會寄到信箱。設定方式見更新說明。</p>'));
  var bar=h('<div class="fbar"></div>'),sel=h('<select><option value="">全部狀態</option><option value="new">新的</option><option value="doing">處理中</option><option value="done">已處理</option></select>'),cnt=h('<span class="meta"></span>');bar.appendChild(sel);bar.appendChild(cnt);s.appendChild(bar);
  var list=h('<div class="sbox"></div>');s.appendChild(list);
  function when(t){var d=new Date(t+288e5).toISOString();return d.slice(5,10)+" "+d.slice(11,16)}
  function draw(){list.innerHTML="";var n=0;r.rows.forEach(function(x){if(sel.value&&x.status!==sel.value)return;n++;
   var c=h('<div class="rcard'+(x.status==="done"?" done":"")+'"><div><b>#'+x.id+"　"+esc(x.cat)+'</b>　<span class="rst '+x.status+'">'+ST[x.status]+"</span>"+(x.mailed?"":'　<small>未寄信</small>')+'</div><div class="rmsg">'+esc(x.msg)+"</div><small>"+when(x.ts)+"　"+esc(x.cls||"")+" 班 "+(x.no||"")+" 號 "+esc(x.name||"")+"（"+esc(x.email)+"）　"+((x.ctx||{}).qid?"題目ID "+esc(x.ctx.qid)+"　":"")+"頁面 "+esc((x.ctx||{}).page||"")+"　"+esc((x.ctx||{}).screen||"")+"</small>"+((x.ctx&&x.ctx.errs&&x.ctx.errs.length)?'<br><small>程式錯誤：'+x.ctx.errs.map(esc).join("；")+"</small>":"")+'<div class="rimgs"></div><div class="ctl"></div></div>'),act=c.lastChild,im=c.querySelector(".rimgs");
   [["new","設為新的"],["doing","處理中"],["done","已處理"]].forEach(function(p){if(p[0]===x.status)return;var b=h('<button class="pen">'+p[1]+"</button>");b.onclick=function(){M.api("POST","/api/admin/report/status",{id:x.id,status:p[0]}).then(function(){x.status=p[0];draw()},function(){})};act.appendChild(b)});
   if(x.hasFiles){var fb=h('<button class="pen">看附件</button>');fb.onclick=function(){fb.disabled=true;M.api("GET","/api/admin/report?id="+x.id).then(function(d){im.innerHTML="";d.files.forEach(function(f){var i=document.createElement("img");i.alt=f.name;i.src="data:"+f.mime+";base64,"+f.data;im.appendChild(i)});fb.remove()},function(){fb.disabled=false})};act.appendChild(fb)}
   var mb=h('<a class="pen" href="mailto:'+esc(x.email)+"?subject="+encodeURIComponent("回覆你的問題回報 #"+x.id)+'">寫信給他</a>');act.appendChild(mb);
   var db=h('<button class="pen">刪除</button>');db.onclick=function(){if(!confirm("刪除回報 #"+x.id+"？"))return;M.api("POST","/api/admin/report/status",{id:x.id,delete:1}).then(function(){r.rows=r.rows.filter(function(y){return y!==x});draw()},function(){})};act.appendChild(db);
   list.appendChild(c)});
   if(!n)list.appendChild(h("<p>沒有符合的回報。</p>"));cnt.textContent="共 "+n+" 則（新的 "+r.rows.filter(function(y){return y.status==="new"}).length+" 則）"}
  sel.onchange=draw;draw()},function(e){s.appendChild(h("<p>載入失敗（"+esc(e.code||"net")+"）</p>"))})}

/* ---- 列印紀錄：學生每出一份練習卷就記一筆；卷子上印著卷號，外流時在搜尋框輸入卷號就查得到是誰、什麼時候、用什麼裝置 ---- */
function prints(ctx){
 var s=ctx.sheet("列印紀錄",M.U.admin?"最近 500 筆；試卷上印的「卷號」可以查到是誰、什麼時候、用什麼裝置印的。只有管理員能刪除":"最近 500 筆（只看得到自己班）；IP、網路、裝置與刪除紀錄只有管理員能用");
 M.api("GET","/api/admin/prints").then(function(r){
  if(!r.rows.length){s.appendChild(h("<p>還沒有列印紀錄。</p>"));return}
  function when(t){var d=new Date(t+288e5).toISOString();return d.slice(5,10)+" "+d.slice(11,16)}
  function devOf(x){var c={};try{c=JSON.parse(x.dev||"{}")||{}}catch(e){}return esc(x.brief||"")+(c.model?"（"+esc(c.model)+"）":"")+(c.scr?" "+esc(c.scr):"")}
  var AD=!!M.U.admin,box=h('<div></div>'),t='<table class="tb"><tr><th>時間</th><th>班</th><th>號</th><th>姓名</th><th>卷號</th><th>題數</th>'+(AD?"<th>IP</th><th>網路</th><th>裝置</th>":"")+"<th></th></tr>";
  r.rows.forEach(function(x){t+="<tr><td>"+when(x.ts)+"</td><td>"+esc(x.cls)+"</td><td>"+x.no+"</td><td>"+esc(x.name)+"</td><td><b>"+esc(x.id)+"</b></td><td>"+x.n+"</td>"+(AD?"<td>"+esc(x.ip)+"</td><td>"+esc(x.net||"")+"</td><td>"+devOf(x)+"</td>":"")+'<td><button class="pen" data-id="'+esc(x.id)+'">看題目</button>'+(AD?' <button class="pen" data-del="'+esc(x.id)+'">刪除</button>':"")+"</td></tr>"});
  var tb=h(t+"</table>"),det=h('<div class="sbox" hidden></div>');box.appendChild(tb);box.appendChild(det);s.appendChild(box);
  box.addEventListener("click",function(e){var dl=e.target.closest("button[data-del]");if(dl){if(!confirm("確定刪除卷號 "+dl.dataset.del+" 的列印紀錄？刪除後就查不到這份卷子是誰印的。"))return;dl.disabled=true;
   M.api("POST","/api/admin/print/delete",{ids:[dl.dataset.del]}).then(function(r){if(r.n){var tr=dl.closest("tr");if(tr)tr.remove();det.hidden=true}else{dl.disabled=false;alert("沒有刪除（可能不是你的班）")}},function(){dl.disabled=false;alert("刪除失敗，請再試一次")});return}
   var b=e.target.closest("button[data-id]");if(!b)return;b.disabled=true;
   M.api("GET","/api/admin/print?id="+encodeURIComponent(b.dataset.id)).then(function(d){b.disabled=false;det.hidden=false;
    det.innerHTML="<p><b>卷號 "+esc(d.id)+"</b>　"+esc(d.name)+"（"+esc(d.email)+"）　"+esc(d.cls)+" 班 "+d.no+" 號　"+when(d.ts)+"<br><small>"+(AD?"IP "+esc(d.ip)+"　"+esc(d.net||"")+"　"+esc(d.place||"")+"　"+esc(d.brief||"")+"<br>裝置回報："+esc(d.dev||"（無）")+"<br>":"")+"來源："+esc(d.src||"")+"</small></p><ol>"+d.qs.map(function(q){return"<li>"+esc(q.q)+"　<small>答："+esc(q.a)+"</small></li>"}).join("")+"</ol>";det.scrollIntoView({block:"nearest"})},function(){b.disabled=false})})
 },function(e){s.appendChild(h("<p>載入失敗（"+esc(e.code||"net")+"）</p>"))})}

/* ---------- 模擬考紀錄 ---------- */
function mocks(ctx){
 var s=ctx.sheet("模擬考紀錄","最近 500 筆（老師只看得到自己班）。離開次數是學生切到別的分頁或視窗的次數，只作參考，系統不會因此扣分");
 M.api("GET","/api/admin/mocks").then(function(r){
  if(!r.rows.length){s.appendChild(h("<p>還沒有模擬考紀錄。</p>"));return}
  function when(t){var d=new Date(t+288e5).toISOString();return d.slice(5,10)+" "+d.slice(11,16)}
  function mmss(x){return Math.floor(x/60)+":"+("0"+x%60).slice(-2)}
  var t='<table class="tb"><tr><th>時間</th><th>班</th><th>號</th><th>姓名</th><th>成績</th><th>答對</th><th>用時</th><th>離開次數</th><th>離開秒數</th><th>注意</th><th></th></tr>';
  r.rows.forEach(function(x){var f=[];if(x.late)f.push("逾時");if(x.leaves>=3||x.away>=60)f.push("離開多次");if(x.n>=5&&x.used/x.n<6)f.push("作答過快");
   t+="<tr><td>"+when(x.ts)+"</td><td>"+esc(x.cls)+"</td><td>"+x.no+"</td><td>"+esc(x.name)+"</td><td>"+(x.late?"—":x.sc)+"</td><td>"+x.c+" / "+x.n+"</td><td>"+mmss(x.used)+"</td><td>"+x.leaves+"</td><td>"+x.away+"</td><td>"+(f.length?"<b>"+f.join("、")+"</b>":"")+"</td><td>"+(M.U.admin?'<button class="pen" data-del="'+esc(x.id)+'">刪除</button>':"")+"</td></tr>"});
  var tb=h(t+"</table>");s.appendChild(tb);
  tb.addEventListener("click",function(e){var d=e.target.closest("button[data-del]");if(!d)return;if(!confirm("確定刪除這筆模擬考紀錄？刪除後老師就看不到這次的離開次數與用時。成績和積分不受影響。"))return;d.disabled=true;
   M.api("POST","/api/admin/mock/delete",{ids:[d.dataset.del]}).then(function(r){if(r.n){var tr=d.closest("tr");if(tr)tr.remove()}else{d.disabled=false;alert("沒有刪除（可能不是你的班）")}},function(){d.disabled=false;alert("刪除失敗，請再試一次")})})},function(e){s.appendChild(h("<p>載入失敗（"+esc(e.code||"net")+"）</p>"))})}

/* ---------- 派卷 ---------- */
function assign(ctx){
 var s=ctx.sheet("派卷","派給班級或部分學生的待測卷。學生會在「待測清單」看到，限時、只能作答一次，每位學生的題目各自抽、順序不同");
 M.api("GET","/api/admin/roster").then(function(r){
  var st=r.rows.filter(function(x){return x.role==="student"&&x.active!=="0"}),cls={};st.forEach(function(x){cls[x.class]=1});var cl=Object.keys(cls).sort();
  var ti=inp("","標題，例如：第三章小考"),cw=h('<div class="ctl wrapctl"></div>'),pw=h("<details><summary>只派給部分學生（不勾＝整班）</summary><div class=\"ppg\"></div></details>");
  var cks=cl.map(function(c){var l=h('<label class="ppc"><input type="checkbox" value="'+esc(c)+'"> '+esc(c)+" 班（"+st.filter(function(x){return x.class===c}).length+" 人）</label>");cw.appendChild(l);return l.firstChild});
  function drawStu(){var on=cks.filter(function(x){return x.checked}).map(function(x){return x.value}),g=pw.querySelector(".ppg");g.innerHTML="";
   if(!on.length){g.textContent="先勾選班級。";return}
   st.filter(function(x){return on.indexOf(x.class)>=0}).forEach(function(x){g.appendChild(h('<label class="ppc"><input type="checkbox" data-e="'+esc(x.email)+'"> '+esc(x.class)+"-"+x.no+" "+esc(x.name)+"</label>"))})}
  cw.addEventListener("change",drawStu);drawStu();
  var n=sel([[5,"5 題"],[10,"10 題"],[15,"15 題"],[20,"20 題"],[30,"30 題"]],10),mi=inp("","留空＝每題 2 分鐘","number"),du=inp("","","date"),un=inp("","單元代號，多個用逗號；留空＝依年級綜合");un.setAttribute("list","aul");
  var dl=document.createElement("datalist");dl.id="aul";NB.flat.forEach(function(o){var e=document.createElement("option");e.value=o.id;e.label=o.sem+" "+o.num+" "+o.title;dl.appendChild(e)});
  function chk(name,vals){return h('<div class="ctl wrapctl">'+vals.map(function(v){return'<label class="ppc"><input type="checkbox" name="'+name+'" value="'+v+'"> '+v+"</label>"}).join("")+"</div>")}
  var fd=chk("afd",["易","中","難"]),fg=chk("afg",["知識","理解","應用","分析","評鑑","創造"]),fk=inp("","知識類型包含的字，例如：面積、公因數"),fp=inp("","學習表現／學習內容代碼，例如：n-III-3、S-5");
  s.appendChild(dl);s.appendChild(field("標題",ti));s.appendChild(field("班級",cw));s.appendChild(pw);s.appendChild(field("題數",n));s.appendChild(field("時限（分鐘）",mi));s.appendChild(field("截止日（當天晚上 11:59 截止，可留空）",du));
  s.appendChild(field("單元範圍",un));s.appendChild(h('<p class="meta">題目篩選（可以不選）：有勾選或填寫任何一項，就只會從題庫裡「已有屬性」的固定題挑，不使用自動產生的題目。</p>'));
  s.appendChild(field("難易度",fd));s.appendChild(field("認知層次",fg));s.appendChild(field("知識類型",fk));s.appendChild(field("學習表現／內容",fp));
  var fb=h('<div class="fb"></div>'),go=h('<button class="pen go">派卷</button>');s.appendChild(h('<div class="ctl"></div>')).appendChild(go);s.appendChild(fb);
  function vals(name){return Array.prototype.map.call(document.querySelectorAll('input[name="'+name+'"]:checked'),function(x){return x.value})}
  go.onclick=function(){var o={title:ti.value.trim(),classes:cks.filter(function(x){return x.checked}).map(function(x){return x.value}),emails:Array.prototype.map.call(pw.querySelectorAll("input[data-e]:checked"),function(x){return x.dataset.e}),n:+n.value,mins:mi.value,due:du.value,
    units:un.value.split(/[,，\s]+/).filter(Boolean),filt:{d:vals("afd"),cg:vals("afg"),kw:fk.value.trim(),pf:fp.value.trim()}};
   if(!o.title)return msg(fb,"請填標題。",0);if(!o.classes.length)return msg(fb,"請至少勾一個班級。",0);
   go.disabled=true;M.api("POST","/api/admin/assign",o).then(function(x){go.disabled=false;msg(fb,"已派卷，學生開啟網站就看得到。"+(x.warn?"<br>"+esc(x.warn):""),1);setTimeout(ctx.go,x.warn?3500:900)},function(e){go.disabled=false;msg(fb,e.code==="forbidden"?"只能派給自己的班級。":e.code==="bad_students"?"選的學生不在勾選的班級裡。":e.code==="bad_due"?"截止日格式不對。":errs(e),0)})};
  var ls=ctx.sheet("已派的卷子","最近 200 份；點「看狀況」查看每位學生的完成情形"),det=h('<div class="sbox" hidden></div>');
  function when(t){var d=new Date(t+288e5).toISOString();return d.slice(5,10)+" "+d.slice(11,16)}
  M.api("GET","/api/admin/assigns").then(function(q){
   if(!q.rows.length){ls.appendChild(h("<p>還沒有派過卷。</p>"));return}
   var t='<table class="tb"><tr><th>派出時間</th><th>標題</th><th>班級</th><th>對象</th><th>題數</th><th>時限</th><th>截止</th><th>完成</th><th>平均</th><th></th></tr>';
   q.rows.forEach(function(a){t+="<tr><td>"+when(a.ts)+"</td><td>"+esc(a.title)+"</td><td>"+esc(a.classes.join("、"))+"</td><td>"+(a.part?"部分 "+a.part+" 人":"整班")+"</td><td>"+a.n+"</td><td>"+(a.mins?a.mins+" 分":"每題2分")+"</td><td>"+(a.due?new Date(a.due+288e5).toISOString().slice(5,10):"—")+"</td><td>"+a.done+" / "+a.total+(a.started>a.done?"（"+(a.started-a.done)+" 人作答中）":"")+"</td><td>"+(a.avg===null?"—":a.avg)+'</td><td><button class="pen" data-v="'+esc(a.id)+'">看狀況</button> <button class="pen" data-x="'+esc(a.id)+'">刪除</button></td></tr>'});
   var tb=h(t+"</table>");ls.appendChild(tb);ls.appendChild(det);
   tb.addEventListener("click",function(e){var x=e.target.closest("button[data-x]");
    if(x){if(!confirm("確定刪除這份派卷？學生的待測清單會消失，已交的成績紀錄也會一併刪除（學生本身的積分和錯題本不受影響）。"))return;x.disabled=true;M.api("POST","/api/admin/assign/delete",{id:x.dataset.x}).then(ctx.go,function(){x.disabled=false;alert("刪除失敗（只有派卷的老師或管理員可以刪）")});return}
    var v=e.target.closest("button[data-v]");if(!v)return;v.disabled=true;
    M.api("GET","/api/admin/assign?id="+encodeURIComponent(v.dataset.v)).then(function(d){v.disabled=false;det.hidden=false;
     var tt='<p><b>'+esc(d.title)+"</b>　"+d.n+" 題</p><table class=\"tb\"><tr><th>班</th><th>號</th><th>姓名</th><th>狀態</th><th>成績</th><th>答對</th><th>用時</th><th>離開次數</th><th>離開秒數</th></tr>";
     d.rows.forEach(function(x){tt+="<tr><td>"+esc(x.cls)+"</td><td>"+x.no+"</td><td>"+esc(x.name)+"</td><td>"+({done:x.late?"逾時":"已完成",open:"作答中",new:"未開始"}[x.st])+"</td><td>"+(x.sc==null?"—":x.sc)+"</td><td>"+(x.st==="done"?x.c+" / "+x.n:"")+"</td><td>"+(x.used?Math.floor(x.used/60)+":"+("0"+x.used%60).slice(-2):"")+"</td><td>"+(x.st==="done"?x.leaves:"")+"</td><td>"+(x.st==="done"?x.away:"")+"</td></tr>"});
     det.innerHTML=tt+"</table>";det.scrollIntoView()},function(){v.disabled=false;alert("載入失敗")})})},function(){ls.appendChild(h("<p>載入失敗。</p>"))})
 },function(e){s.appendChild(h('<div class="fb no">'+errs(e)+"</div>"))})}

NB.tadmin={roster:roster,bank:bank,settings:settings,data:data,reports:reports,prints:prints,mocks:mocks,assign:assign};
})();
