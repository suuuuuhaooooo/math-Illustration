import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
var CFG=window.NB_CONFIG||{},R=window.__nbAuthResolve||function(){};
if(!CFG.firebase||!CFG.firebase.apiKey){R(null)}
else{
 var auth=getAuth(initializeApp(CFG.firebase)),first=true;auth.languageCode="zh-TW";
 var api={
  user:function(){return auth.currentUser},
  token:function(){return auth.currentUser.getIdToken()},
  signOut:function(){return signOut(auth)},
  signIn:function(){
   var p=new GoogleAuthProvider();p.setCustomParameters(Object.assign({prompt:"select_account"},CFG.hd?{hd:CFG.hd}:{}));
   return signInWithPopup(auth,p).catch(function(e){if(e&&e.code==="auth/popup-blocked")return signInWithRedirect(auth,p);throw e})}
 };
 /* 從「改用跳轉登入」回來時如果失敗，以前這裡是吞掉錯誤、畫面完全沒反應；現在把代碼留給登入頁顯示 */
 var red=getRedirectResult(auth).catch(function(e){window.__nbAuthErr=(e&&e.code)||"auth/unknown"});
 onAuthStateChanged(auth,function(){if(first){first=false;red.then(function(){R(api)})}});
}
