/* 輕量防護：擋右鍵選單、複製、框選與拖曳（輸入框除外）。
   這只是「勸退」，不是安全機制——真正的防護在後端（答案、判分、計時都在伺服器）。 */
(function(){
function inField(e){var t=e.target;if(e.type==="dragstart"&&t&&t.closest&&t.tagName!=="IMG"&&t.closest("[data-drag]"))return true;return t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)} /* data-drag：審題預覽的題目卡可以拖曳排序（卡裡的圖片仍然不能拖） */
["contextmenu","copy","cut","selectstart","dragstart"].forEach(function(n){document.addEventListener(n,function(e){if(!inField(e))e.preventDefault()})});
document.addEventListener("keydown",function(e){var k=(e.key||"").toLowerCase();if((e.ctrlKey||e.metaKey)&&["s","u","c","x"].indexOf(k)>=0&&!inField(e))e.preventDefault();if(e.key==="F12")e.preventDefault()});
})();
