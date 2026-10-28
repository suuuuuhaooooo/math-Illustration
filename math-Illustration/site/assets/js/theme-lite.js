/* 靜態頁面（條款、隱私、版權、公告、方案）的主題切換：淺色／深色／系統。與主站共用同一個設定（localStorage nb-theme） */
(function(){
var KEY="nb-theme";
function mode(){try{return localStorage.getItem(KEY)||"system"}catch(e){return"system"}}
function apply(m){var r=document.documentElement;if(m==="light"||m==="dark")r.setAttribute("data-theme",m);else r.removeAttribute("data-theme");var bs=document.querySelectorAll(".themes button");for(var i=0;i<bs.length;i++)bs[i].classList.toggle("on",bs[i].dataset.m===m)}
apply(mode());
function bar(){
 var nav=document.querySelector("nav.bar");if(!nav||nav.querySelector(".themes"))return;
 var I={light:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',dark:'<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',system:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'};
 var L={light:"永晝",dark:"永夜",system:"系統"},d=document.createElement("div");d.className="themes";d.setAttribute("role","group");d.setAttribute("aria-label","主題");
 ["light","dark","system"].forEach(function(m){var b=document.createElement("button");b.dataset.m=m;b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+I[m]+"</svg>"+L[m];b.onclick=function(){try{localStorage.setItem(KEY,m)}catch(e){}apply(m)};d.appendChild(b)});
 nav.appendChild(d);apply(mode())}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bar);else bar();
})();
