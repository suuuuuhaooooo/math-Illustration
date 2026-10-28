/* 六上 6.3 扇形周長 (步驟組裝) */
NB.unit({
 q:"一個半徑 10 公分、圓心角 90 度的扇形，它的「周長」是多少公分？",
 steps:[
  "周長指的是圖形「最外圍那一圈」的總長度。",
  "扇形的外圍包含三個部分：1 段彎曲的弧長，和 2 條直直的半徑。",
  "弧長 ＝ 10 × 2 × 3.14 × (90/360) ＝ 15.7。",
  "周長 ＝ 15.7 (弧長) ＋ 10 (半徑) ＋ 10 (半徑) ＝ 35.7 公分。"
 ],
 ch:{q:"半徑 20 公分的半圓（圓心角 180 度），周長是多少？",a:102.8,h:"弧長 = 20×2×3.14×(180/360)=62.8。記得加上直線直徑 40。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,240);
  
  var ctl = NB.h('<div class="ctl" style="justify-content:center; margin-bottom:10px;"></div>');
  var btn = NB.h('<button class="pen on" style="background:var(--p2); color:#fff; font-size:1.1rem;">開始組裝外框</button>');
  var btnReset = NB.h('<button class="pen">重置</button>');
  ctl.appendChild(btn); ctl.appendChild(btnReset);
  b.insertBefore(ctl, st);

  var step = 0;
  btn.onclick = function(){ 
      if(step < 3) step++; 
      updateBtn(); draw(); 
  };
  btnReset.onclick = function(){ step = 0; updateBtn(); draw(); };

  function updateBtn(){
      if(step === 0) btn.innerHTML = "步驟 1：畫出外側「弧長」";
      if(step === 1) btn.innerHTML = "步驟 2：加上第一條「半徑」";
      if(step === 2) btn.innerHTML = "步驟 3：加上第二條「半徑」";
      if(step === 3) { btn.innerHTML = "✔ 組裝完成"; btn.className = "pen"; }
      else btn.className = "pen on";
  }
  updateBtn();
  
  function draw(){
   v.innerHTML="";
   var cx = 200, cy = 180, R = 120; // 90度扇形，開口朝右上
   
   /* 步驟0：畫出底色影子與基礎虛線圓 */
   NB.mk("circle",{cx:cx, cy:cy, r:R, fill:"none", stroke:"var(--paper2)", 'stroke-dasharray':"4 4"},v);
   NB.mk("path",{d:"M"+cx+" "+cy+" L"+(cx+R)+" "+cy+" A"+R+" "+R+" 0 0 0 "+cx+" "+(cy-R)+" Z", fill:"color-mix(in srgb,var(--p4) 30%,transparent)", stroke:"none"},v);
   NB.t(v, cx+60, cy-50, "扇形", {z:16, fill:"var(--soft)"});

   var msg = "請點擊上方按鈕，把外框圍起來！";
   var calc = "";

   /* 步驟1：弧長 */
   if(step >= 1) {
       NB.mk("path",{d:"M"+(cx+R)+" "+cy+" A"+R+" "+R+" 0 0 0 "+cx+" "+(cy-R), fill:"none", stroke:"var(--p1)", 'stroke-width':4},v);
       NB.t(v, cx+90, cy-90, "弧長 15.7", {z:14, fill:"var(--p1)", b:1});
       msg = "只算弧長，這樣有圍起來嗎？";
       calc = "15.7";
   }
   /* 步驟2：第一條半徑 */
   if(step >= 2) {
       NB.mk("line",{x1:cx, y1:cy-R, x2:cx, y2:cy, stroke:"var(--p2)", 'stroke-width':4},v);
       NB.t(v, cx-35, cy-60, "半徑 10", {z:14, fill:"var(--p2)", b:1});
       msg = "別忘記切口的直線！還差一條。";
       calc = "15.7 + 10";
   }
   /* 步驟3：第二條半徑 */
   if(step >= 3) {
       NB.mk("line",{x1:cx, y1:cy, x2:cx+R, y2:cy, stroke:"var(--p3)", 'stroke-width':4},v);
       NB.t(v, cx+60, cy+20, "半徑 10", {z:14, fill:"var(--p3)", b:1});
       msg = "<b class='ok'>完全封閉，這才是完整的周長！</b>";
       calc = "15.7 + 10 + 10 = <b class='ok'>35.7</b>";
   }

   eq.innerHTML="狀態："+msg+(calc ? "<br>計算："+calc+" cm" : "");
  }
  draw();
 }
});