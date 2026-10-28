/* 閒置自動登出：多久沒操作就登出，避免共用電腦被別人接手。模擬卷作答中不會登出。 */
(function(){
var C=window.NB_CONFIG||{},LIM=(C.idleMinutes||20)*60e3,WARN=60e3,K="nb-act",last=Date.now(),box;
function ls(v){try{if(v)localStorage.setItem(K,v);else return+localStorage.getItem(K)||0}catch(e){return 0}}
function mark(){var n=Date.now();if(n-last<1500)return;last=n;ls(String(n));if(box)hide()}
["pointerdown","keydown","scroll","touchstart"].forEach(function(e){addEventListener(e,mark,{passive:true})});
function busy(){return/#mock/.test(location.hash)&&document.querySelector(".clock")}
function hide(){if(box){box.remove();box=null}}
function show(sec){if(!box){box=document.createElement("div");box.setAttribute("role","alertdialog");box.style.cssText="position:fixed;left:0;right:0;bottom:0;z-index:99;padding:14px;text-align:center;background:var(--paper);border-top:2px solid var(--ink);color:var(--ink)";document.body.appendChild(box)}
 box.innerHTML="";var t=document.createElement("span");t.textContent="閒置過久，"+sec+" 秒後自動登出　";var b=document.createElement("button");b.className="pen go";b.textContent="繼續使用";b.onclick=function(){last=0;mark()};box.appendChild(t);box.appendChild(b)}
setInterval(function(){
 var M=window.NB&&NB.member;if(!M||!M.U)return;if(busy()){last=Date.now();return}
 var a=Math.max(last,ls()),idle=Date.now()-a;
 if(idle>=LIM){hide();M.logout().then(function(){try{sessionStorage.setItem("nb-idle","1")}catch(e){}location.href=(document.body.getAttribute("data-root")||"./")+"member.html"})}
 else if(idle>=LIM-WARN)show(Math.ceil((LIM-idle)/1000));else hide()},1000);
})();
