/* 公告頁：不需登入，列出所有有效公告 */
(function(){
var box=document.getElementById("list"),st=document.getElementById("st"),api=(window.NB_CONFIG&&NB_CONFIG.api)||"";
function dstr(ts){if(!ts)return"";var d=new Date(ts+8*36e5);return d.getUTCFullYear()+"-"+("0"+(d.getUTCMonth()+1)).slice(-2)+"-"+("0"+d.getUTCDate()).slice(-2)}
function item(a){var n=document.createElement("div");n.className="notice "+(a.level==="warn"?"warn":"info");
 var t=document.createElement("b");t.textContent=(a.pin?"置頂｜":"")+(a.title||(a.level==="warn"?"注意":"公告"));n.appendChild(t);
 var p=document.createElement("span");p.textContent=a.text;n.appendChild(p);
 var m=[];if(a.ts)m.push("發布 "+dstr(a.ts));if(a.until)m.push("公告至 "+a.until);
 if(m.length){var sm=document.createElement("small");sm.textContent=m.join("・");n.appendChild(sm)}
 return n}
if(!api||!window.fetch){st.textContent="目前無法載入公告。";return}
fetch(api+"/api/announce").then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
 var L=(j&&j.list)||[];if(!L.length){st.textContent="目前沒有公告。";return}
 box.innerHTML="";L.forEach(function(a){box.appendChild(item(a))})
}).catch(function(){st.textContent="目前無法載入公告，請稍後再試。"})})();
