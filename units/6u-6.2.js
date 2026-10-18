/* 六上 6.2 圓周長 */
NB.unit({
 q:"請直接在畫面上拖曳小紅點，改變圓的半徑，看看圓周長會怎麼變化？",
 steps:[
  "圓的大小由「半徑」或「直徑」決定。",
  "圓周長 ＝ 直徑 × 3.14 ＝ 半徑 × 2 × 3.14。",
  "當直徑變大時，圓周長也會按照 3.14 倍的比例變長。"
 ],
 ch:{q:"半徑 5 公分的圓，圓周長是多少公分？",a:31.4,h:"5 × 2 × 3.14"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage" style="touch-action:none; cursor:ew-resize;"></div>');
  b.appendChild(st);var v=NB.svg(st,560,240);
  
  var cx = 110, cy = 120, R = 45; // 調整圓心位置與初始半徑
  var isDragging = false;

  v.onpointerdown = function(e){ isDragging = true; v.setPointerCapture(e.pointerId); updateR(e); };
  v.onpointermove = function(e){ if(isDragging) updateR(e); };
  v.onpointerup = function(e){ isDragging = false; };
  v.onpointercancel = function(e){ isDragging = false; };

  function updateR(e){
      var rect = v.getBoundingClientRect();
      var scaleX = 560 / rect.width;
      var touchX = (e.clientX - rect.left) * scaleX;
      // 限制半徑範圍在 20 ~ 70 像素，避免圓形太大破版
      var newR = Math.max(20, Math.min(70, touchX - cx));
      if(Math.abs(newR - R) >= 1) {
          R = Math.round(newR);
          draw();
      }
  }

  function draw(){
   v.innerHTML="";
   var D = R * 2;
   var C = +(D * 3.14).toFixed(2);

   NB.t(v, 280, 20, "※ 按住紅點向左右拖曳改變大小", {z:13, fill:"var(--soft)"});

   /* 畫圓形 (左側) */
   NB.mk("circle",{cx:cx, cy:cy, r:R, fill:"color-mix(in srgb,var(--p3) 40%,transparent)", stroke:"var(--ink)", 'stroke-width':2},v);
   NB.mk("line",{x1:cx-R, y1:cy, x2:cx+R, y2:cy, stroke:"var(--ink)", 'stroke-width':1.5, 'stroke-dasharray':"4 2"},v);
   NB.mk("circle",{cx:cx+R, cy:cy, r:7, fill:"var(--p1)", stroke:"var(--ink)", 'stroke-width':2},v); // 拖曳紅點
   NB.mk("circle",{cx:cx, cy:cy, r:3, fill:"var(--ink)"},v); // 圓心

   /* 右側長條圖比較 (等比例縮放防超出) */
   var barX = 220, barY = 75, scaleBar = 0.55; 
   
   // 直徑長條
   NB.t(v, barX, barY, "直徑：", {z:13, a:"start"});
   NB.mk("rect",{x:barX+65, y:barY-14, width:D*scaleBar, height:18, fill:"var(--paper2)", stroke:"var(--ink)"},v);
   NB.t(v, barX+75+D*scaleBar, barY, D+" cm", {z:13, a:"start"});

   // 圓周長長條
   NB.t(v, barX, barY+60, "圓周長：", {z:13, a:"start"});
   NB.mk("rect",{x:barX+65, y:barY+46, width:C*scaleBar, height:18, fill:"var(--p4)", stroke:"var(--ink)"},v);
   NB.t(v, barX+75+C*scaleBar, barY+60, C+" cm", {z:13, a:"start", fill:"var(--p4b)", b:1});

   eq.innerHTML="半徑："+R+" cm ｜ 直徑："+D+" cm<br>圓周長 ＝ "+D+" × 3.14 ＝ <b class='ok'>"+C+"</b> cm";
  }
  draw();
 }
});
