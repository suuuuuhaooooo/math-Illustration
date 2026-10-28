/* 卷類專區（學員）：卷的列表與電子書閱讀。
   頁面在伺服器上是加密的圖片；開卷時後端才發下本卷的金鑰，瀏覽器在記憶體裡解開，
   再把「姓名、班級座號、日期」畫在每一頁上。金鑰與解開的內容都不寫進 localStorage，也不做下載按鈕。 */
(function(){
"use strict";
var M=NB.member,h=NB.h,PER=12;
var ERR={open_limit:"今天已經開過這本卷了，明天再來。",not_found:"這本卷目前沒有開放閱讀。",book_base_missing:"卷的圖片網域還沒設定，請通知管理員。",nologin:"請先登入再閱讀。"};
function msg(e){return ERR[e&&e.code]||("失敗（"+((e&&e.code)||"net")+"）")}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function bytesOf(s){var bin=atob(s),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
var offs=[]; /* 離開閱讀頁時要拿掉的全域監聽 */
function clearGuards(){offs.forEach(function(f){f()});offs=[]}
function on(target,ev,fn,opt){target.addEventListener(ev,fn,opt);offs.push(function(){target.removeEventListener(ev,fn,opt)})}

NB.books={};

/* ---- 列表 ---- */
NB.books.list=function(view){
 clearGuards();
 var s=h('<section class="sheet"><h2><span class="tag">卷類專區</span>段考卷，線上閱讀</h2><p class="meta">每本卷每天可以開 <span class="bklim">-</span> 次。卷只能在網頁上閱讀，不提供下載。</p></section>');
 view.appendChild(s);
 var box=h('<div><p class="meta">讀取中…</p></div>');s.appendChild(box);
 M.api("GET","/api/books").then(function(r){
  box.innerHTML="";
  s.querySelector(".bklim").textContent=r.limit;
  if(!r.rows.length){box.appendChild(h("<p>目前還沒有開放的卷。</p>"));return}
  var page=0,pages=Math.ceil(r.rows.length/PER),grid=h('<div class="bkgrid"></div>'),nav=h('<div class="ctl bknav"></div>');
  function draw(){
   grid.innerHTML="";
   r.rows.slice(page*PER,page*PER+PER).forEach(function(b){
    var c=h('<article class="bkcard"><h3></h3><p class="meta"></p><button type="button" class="pen go"></button></article>');
    c.querySelector("h3").textContent=b.title;
    c.querySelector(".meta").textContent=[b.grade,b.term,b.pages+" 頁","今天還可以開 "+b.left+" 次"].filter(Boolean).join("・");
    var btn=c.querySelector("button");btn.textContent=b.left>0?"開始閱讀":"今天已用完";btn.disabled=b.left<=0;
    btn.onclick=function(){location.hash="#books/"+b.id};
    grid.appendChild(c);
   });
   nav.innerHTML="";
   if(pages>1){
    var pv=h('<button type="button" class="pen">上一頁</button>'),nx=h('<button type="button" class="pen">下一頁</button>'),lb=h('<span class="meta"></span>');
    lb.textContent=(page+1)+" / "+pages;
    pv.disabled=page===0;nx.disabled=page>=pages-1;
    pv.onclick=function(){page--;draw()};nx.onclick=function(){page++;draw()};
    nav.appendChild(pv);nav.appendChild(lb);nav.appendChild(nx);
   }
  }
  box.appendChild(grid);box.appendChild(nav);draw();
 }).catch(function(e){box.textContent=msg(e)});
};

/* ---- 閱讀 ---- */
NB.books.open=function(view,id){
 clearGuards();
 var s=h('<section class="sheet bkv"><p class="bkback"><a href="#books">← 回到卷類列表</a></p><h2><span class="tag">卷類專區</span><span class="bkt">開卷中…</span></h2><p class="meta bkmsg"></p><div class="bkwrap"><div class="bkstage"><div class="bkbook"><div class="bkslot bkl"></div><div class="bkslot bkr"></div></div><div class="bkcover">切回視窗後繼續閱讀</div></div></div><div class="ctl bkbar"><button type="button" class="pen">上一頁</button><span class="bkpos meta"></span><button type="button" class="pen go">下一頁</button></div><div class="ctl bktools"><button type="button" class="pen" data-z="-1" aria-label="縮小">－</button><span class="bkzv meta">100%</span><button type="button" class="pen" data-z="1" aria-label="放大">＋</button><button type="button" class="pen bkfs">全螢幕</button></div></section>');
 view.appendChild(s);
 var msgEl=s.querySelector(".bkmsg");
 M.api("POST","/api/book/open",{id:id}).then(function(b){
  s.querySelector(".bkt").textContent=b.title;
  msgEl.textContent="每本卷每天可以開 "+b.limit+" 次，今天還可以再開 "+b.left+" 次。左右滑動或按方向鍵翻頁。";
  return crypto.subtle.importKey("raw",bytesOf(b.k),{name:"AES-GCM"},false,["decrypt"]).then(function(key){reader(s,b,key)});
 }).catch(function(e){
  s.querySelector(".bkt").textContent="無法開卷";
  msgEl.textContent=msg(e);
 });
};

function reader(root,b,key){
 var U=M.U||{},today=M.T||new Date().toISOString().slice(0,10);
 var who=(U.name||"")+"　"+(U.cls?U.cls+" 班 ":"")+(U.no?U.no+" 號":"")+"　"+today;
 var book=root.querySelector(".bkbook"),L=root.querySelector(".bkl"),R=root.querySelector(".bkr"),pos=root.querySelector(".bkpos");
 var stage=root.querySelector(".bkstage"),cover=root.querySelector(".bkcover");
 var cache=new Map(),cur=0,busy=false,N=b.pages;
 var wide=function(){return window.matchMedia&&matchMedia("(min-width: 860px)").matches};
 var per=function(){return wide()?2:1};

 /* 解開一頁：下載密文 → AES-GCM 解密 → 畫上個人浮水印 → 放進 canvas（canvas 沒有右鍵另存） */
 function load(i){
  if(i<0||i>=N)return Promise.resolve(null);
  if(cache.has(i))return cache.get(i);
  var p=fetch(b.base+(i+1)+b.ext).then(function(r){if(!r.ok)throw new Error("http");return r.arrayBuffer()})
   .then(function(buf){var u=new Uint8Array(buf);return crypto.subtle.decrypt({name:"AES-GCM",iv:u.slice(0,12)},key,u.slice(12))})
   .then(function(plain){return createImageBitmap(new Blob([plain]))})
   .then(function(bmp){
    var c=document.createElement("canvas");c.width=bmp.width;c.height=bmp.height;var g=c.getContext("2d");
    g.drawImage(bmp,0,0);
    g.save();g.globalAlpha=.13;g.fillStyle="#222";g.font=Math.round(c.width/30)+"px 'Noto Sans TC',sans-serif";
    g.translate(c.width/2,c.height/2);g.rotate(-Math.PI/9);
    for(var y=-c.height;y<c.height;y+=c.height/5)for(var x=-c.width;x<c.width;x+=c.width/1.4)g.fillText(who,x,y);
    g.restore();
    g.fillStyle="rgba(20,20,20,.55)";g.font=Math.round(c.width/52)+"px 'Noto Sans TC',sans-serif";
    g.fillText("僅供線上閱讀・"+who,c.width*.04,c.height-c.height*.02);
    return c;
   });
  p=p.catch(function(){cache.delete(i);return null});
  cache.set(i,p);return p;
 }
 function slot(el,i){
  el.innerHTML="";
  if(i<0||i>=N){el.classList.add("empty");return}
  el.classList.remove("empty");
  var ph=h('<div class="bkp ld">載入中…</div>');el.appendChild(ph);
  load(i).then(function(c){
   if(!c){ph.textContent="讀取失敗，請重新整理再試";ph.classList.add("err");return}
   ph.className="bkp";ph.innerHTML="";c.className="bkc";ph.appendChild(c);
  });
 }
 function prefetch(from){for(var i=from-2;i<=from+per()+2;i++)load(i)}
 function render(){
  var pv=per();
  L.style.display="";R.style.display=pv>1?"":"none";
  slot(L,cur);if(pv>1)slot(R,cur+1);else R.innerHTML="";
  pos.textContent=(cur+1)+(pv>1&&cur+1<N?"–"+(cur+2):"")+" / "+N+" 頁";
  prefetch(cur);
 }
 function copy(c){var n=document.createElement("canvas");n.width=c.width;n.height=c.height;n.getContext("2d").drawImage(c,0,0);n.className="bkc";return n}
 function flip(dir){
  if(busy)return;
  var pv=per(),next=cur+dir*pv;
  if(next<0||next>=N)return;
  if(dir<0){cur=next;render();return}
  /* 向後翻：紙的正面是目前這一頁（雙頁時是右頁），背面是下一頁的左頁（或單頁下一頁），翻過去露出新的一頁 */
  busy=true;
  var front=cur+(pv>1?1:0);
  Promise.all([load(front),load(next)]).then(function(res){
   var leaf=document.createElement("div");leaf.className="bkleaf"+(pv>1?"":" one");
   var f=document.createElement("div");f.className="f";var bk=document.createElement("div");bk.className="bk2";
   if(res[0])f.appendChild(copy(res[0]));
   if(res[1])bk.appendChild(copy(res[1]));
   leaf.appendChild(f);leaf.appendChild(bk);book.appendChild(leaf);
   void leaf.offsetWidth;leaf.classList.add("go");
   var done=false;function fin(){if(done)return;done=true;leaf.remove();cur=next;busy=false;render()}
   leaf.addEventListener("transitionend",fin);setTimeout(fin,900);
  },function(){busy=false});
 }
 function go(dir){flip(dir)}
 root.querySelectorAll(".bkbar button")[0].onclick=function(){go(-1)};
 root.querySelectorAll(".bkbar button")[1].onclick=function(){go(1)};
 on(document,"keydown",function(e){if(!root.isConnected)return;if(e.key==="ArrowRight"||e.key==="PageDown"){go(1);e.preventDefault()}if(e.key==="ArrowLeft"||e.key==="PageUp"){go(-1);e.preventDefault()}if(e.key==="+"||e.key==="="){zoom(Z+0.25)}if(e.key==="-"){zoom(Z-0.25)}if(e.key==="Escape"&&root.classList.contains("bk-full"))setFull(false)});
 var sx=null,pd0=0,z0=1,pinch=false;
 function dist(t){return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)}
 on(stage,"touchstart",function(e){if(e.touches.length===2){pinch=true;pd0=dist(e.touches);z0=Z;sx=null}else if(e.touches.length===1&&!pinch){sx=e.touches[0].clientX}});
 on(stage,"touchmove",function(e){if(pinch&&e.touches.length===2&&pd0){e.preventDefault();zoom(z0*dist(e.touches)/pd0)}},{passive:false});
 on(stage,"touchend",function(e){if(e.touches.length===0){if(pinch){pinch=false;sx=null;return}if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>40)go(dx<0?1:-1)}});
 on(stage,"wheel",function(e){if(!e.ctrlKey)return;e.preventDefault();zoom(Z*(e.deltaY<0?1.1:0.9))},{passive:false});
 /* 切走視窗、按截圖鍵、列印時，整頁模糊遮住（能擋的只有這些一般情況；截圖工具本身無法阻止） */
 function hide(on){root.classList.toggle("bk-off",!!on)}
 on(document,"visibilitychange",function(){hide(document.hidden)});
 on(window,"blur",function(){hide(true)});
 on(window,"focus",function(){hide(false)});
 on(window,"beforeprint",function(){hide(true)});
 on(window,"afterprint",function(){hide(false)});
 /* 放大：1～3 倍，每次 0.25；寬度變大後可以在閱讀區裡左右、上下捲動 */
 var Z=1,zv=root.querySelector(".bkzv");
 function zoom(z){Z=Math.max(1,Math.min(3,Math.round(z*4)/4));book.style.width=(Z*100)+"%";zv.textContent=Math.round(Z*100)+"%"}
 root.querySelectorAll(".bktools [data-z]").forEach(function(b){b.onclick=function(){zoom(Z+(+b.dataset.z)*0.25)}});
 /* 全螢幕：支援的瀏覽器用原生全螢幕；不支援（iPhone Safari）就用整頁覆蓋。全螢幕不會重新開卷，也不會扣次數 */
 var fsBtn=root.querySelector(".bkfs");
 function setFull(on){
  root.classList.toggle("bk-full",!!on);fsBtn.textContent=on?"離開全螢幕":"全螢幕";
  var rq=root.requestFullscreen||root.webkitRequestFullscreen;
  if(on&&rq&&!document.fullscreenElement){try{var p=rq.call(root);if(p&&p.catch)p.catch(function(){})}catch(e){}}
  if(!on&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(function(){});
 }
 fsBtn.onclick=function(){setFull(!root.classList.contains("bk-full"))};
 on(document,"fullscreenchange",function(){if(!document.fullscreenElement&&root.classList.contains("bk-full"))setFull(false)});
 render();
}

/* 路由：#books 列表；#books/<id> 閱讀 */
NB.books.member=function(arg,view){
 return arg?NB.books.open(view,arg):NB.books.list(view);
};
})();
