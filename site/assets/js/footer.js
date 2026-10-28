/* 全站版權列：所有頁面共用，改 NB_CONFIG.copyright 就全站更新 */
(function(){
var C=Object.assign({owner:"suuuuuhaooooo",year:new Date().getFullYear(),license:"CC BY-NC-ND 4.0"},(window.NB_CONFIG||{}).copyright||{}),R=document.body.getAttribute("data-root")||"./";
var f=document.querySelector("footer.foot")||document.body.appendChild(document.createElement("footer"));f.className="foot";
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
f.innerHTML='<a rel="license" href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh-hant" target="_blank" rel="noopener"><img alt="創用 CC 姓名標示-非商業性-禁止改作" width="88" height="31" src="https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by-nc-nd.svg"></a><p>© '+esc(C.year)+' '+esc(C.owner)+'　公開的單元圖解依 '+esc(C.license)+' 授權；題庫與付費內容保留所有權利</p><p><a href="'+R+'announcements.html">公告</a>　<a href="'+R+'plans.html">方案與價格</a>　<a href="'+R+'terms.html">使用者條款</a>　<a href="'+R+'privacy.html">隱私權政策</a>　<a href="'+R+'about.html">版權・字體授權</a></p>';
})();
