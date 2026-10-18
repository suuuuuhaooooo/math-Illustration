/* 班級名單與雲端設定
   - CLASSES：用 tools/roster.html 產生後貼在這裡（密碼只存雜湊，不存明碼）
   - NB_CONFIG.cloud：貼上 Google Apps Script 網址就會開啟全班同步排行榜；留空＝只存在本機 */
var NB_CONFIG={cloud:""};
var CLASSES=[
{code:"demo",name:"示範班",grade:6,s:[
 {no:1,n:"小明",h:"cc8b35845f16d60a999f7e73f7419885e589e596f29aa1c7d1d08c5e13343bd4"},
 {no:2,n:"小華",h:"2588680093162142a56c17b2772908a9481bd2eb7dc75cd96f8a82e32e8bd345"},
 {no:3,n:"小美",h:"54b00cbb48fb3cf3ae7ef5be392352e9a441f027db83c5b248790c849b64fc93"}
]}
];
