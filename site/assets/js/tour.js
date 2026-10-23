/* 鎂光燈導覽：把要說明的地方亮起來，其他變暗；一步一步按「下一步」。
   第一次進入（每個導覽各一次）自動開始，之後按右下角的「i」圓形按鈕可以再叫出來。
   用法：NB.tour.setup("名稱", 步驟陣列)；步驟 {sel:選擇器或函式, title, text}，沒有 sel 的步驟是置中的說明卡。找不到的元素會自動略過。 */
(function(){
var NB=window.NB=window.NB||{},cur=null,btn=null,ov=null,st=null,keyH=null,rsz=null;
var P="nb-tour-";
function seen(n){try{return localStorage.getItem(P+n)==="1"}catch(e){return false}}
function mark(n){try{localStorage.setItem(P+n,"1")}catch(e){}}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function find(s){try{var e=typeof s.sel==="function"?s.sel():s.sel?document.querySelector(s.sel):null;return e&&e.getBoundingClientRect&&(e.offsetWidth||e.offsetHeight)?e:null}catch(x){return null}}
function infoBtn(){
 if(btn&&btn.isConnected)return btn;
 btn=el("button","tour-i");btn.type="button";btn.setAttribute("aria-label","使用教學");btn.title="使用教學";
 btn.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7.6" r="1.3" fill="currentColor"/><path d="M12 11v6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>';
 btn.onclick=function(){if(cur)start(cur.name,{force:true})};document.body.appendChild(btn);return btn}
function close(done){
 if(!ov)return;if(done&&cur)mark(cur.name);
 document.removeEventListener("keydown",keyH,true);window.removeEventListener("resize",rsz);window.removeEventListener("scroll",rsz,true);
 ov.remove();ov=null;st=null;if(btn)try{btn.focus({preventScroll:true})}catch(e){}}
function start(name,o){
 if(!cur||cur.name!==name)return;if(ov)close(false);
 var steps=cur.steps.map(function(s){return{s:s,e:find(s)}}).filter(function(x){return!x.s.sel||x.e});
 if(!steps.length)return;
 var i=0;
 ov=el("div","tour");ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");ov.setAttribute("aria-label","使用教學");
 var blk=el("div","tour-block"),hole=el("div","tour-hole"),card=el("div","tour-card");ov.append(blk,hole,card);document.body.appendChild(ov);
 var h=el("h3"),p=el("p"),ft=el("div","tour-ft"),dots=el("span","tour-dots"),skip=el("button","pen","略過教學"),bk=el("button","pen","上一步"),nx=el("button","pen go","下一步");
 skip.type=bk.type=nx.type="button";
 var act=el("div","tour-act");act.append(bk,nx);ft.append(skip,dots,act);card.append(h,p,ft);
 function place(){
  var x=steps[i],e=x.s.sel?find(x.s):null,vw=innerWidth,vh=innerHeight,cw=Math.min(340,vw-24);card.style.width=cw+"px";
  if(!e){hole.style.cssText="left:50%;top:50%;width:0;height:0;border-radius:0";card.style.left=(vw-cw)/2+"px";card.style.top=Math.max(12,(vh-card.offsetHeight)/2)+"px";return}
  var r=e.getBoundingClientRect(),pad=8,L=Math.max(4,r.left-pad),T=Math.max(4,r.top-pad),W=Math.min(vw-8,r.right+pad)-L,H=Math.min(vh-8,r.bottom+pad)-T;
  hole.style.cssText="left:"+L+"px;top:"+T+"px;width:"+W+"px;height:"+H+"px";
  var ch=card.offsetHeight,below=vh-(T+H)-12,above=T-12,top;
  if(below>=ch)top=T+H+12;else if(above>=ch)top=T-ch-12;else top=Math.max(12,Math.min(vh-ch-12,T+H/2-ch/2));
  var left=Math.max(12,Math.min(vw-cw-12,L+W/2-cw/2));
  /* 亮起來的地方很大、上下都放不下時，卡片放在畫面最下方 */
  if(top<T+H&&top+ch>T&&below<ch&&above<ch){top=vh-ch-12}
  card.style.left=left+"px";card.style.top=top+"px"}
 function show(){
  var x=steps[i];h.textContent=x.s.title||"";h.hidden=!x.s.title;p.textContent=x.s.text||"";
  dots.textContent=(i+1)+" / "+steps.length;bk.hidden=i===0;nx.textContent=i===steps.length-1?"完成":"下一步";
  var e=x.s.sel?find(x.s):null;if(e){try{e.scrollIntoView({block:"center",inline:"nearest"})}catch(z){}}
  setTimeout(function(){if(ov){place();nx.focus({preventScroll:true})}},e?80:0);place()}
 nx.onclick=function(){if(i<steps.length-1){i++;show()}else close(true)};
 bk.onclick=function(){if(i>0){i--;show()}};
 skip.onclick=function(){close(true)};
 keyH=function(ev){if(!ov)return;if(ev.key==="Escape"){ev.preventDefault();close(true)}else if(ev.key==="ArrowRight"||ev.key==="Enter"){if(ev.target===skip||ev.target===bk)return;ev.preventDefault();nx.onclick()}else if(ev.key==="ArrowLeft"){ev.preventDefault();bk.onclick()}};
 document.addEventListener("keydown",keyH,true);rsz=function(){if(ov)place()};window.addEventListener("resize",rsz);window.addEventListener("scroll",rsz,true);
 show()}
NB.tour={
 setup:function(name,steps,o){
  if(ov&&cur&&cur.name===name){cur.steps=steps;return}
  if(ov)close(false);cur={name:name,steps:steps};infoBtn().hidden=false;
  if(!seen(name)&&!(o&&o.manual))setTimeout(function(){if(cur&&cur.name===name&&!ov)start(name)},700)},
 off:function(){if(ov)close(false);cur=null;if(btn)btn.hidden=true},
 start:function(){if(cur)start(cur.name,{force:true})},
 reset:function(){try{Object.keys(localStorage).forEach(function(k){if(k.indexOf(P)===0)localStorage.removeItem(k)})}catch(e){}}};
})();
