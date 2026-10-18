/* 六上 6.2 圓周長 (畫布直接拖曳) */
NB.unit({
 q:"請直接在畫面上拖曳小紅點，改變圓的半徑，看看圓周長會怎麼變化？",
 steps:[
  "圓的大小由「半徑」或「直徑」決定。",
  "圓周長 ＝ 直徑 × 3.14 ＝ 半徑 × 2 × 3.14。",
  "當直徑變大時，圓周長也會按照 3.14 倍的比例變長。"
 ],
 ch:{q:"半徑 5 公分的圓，圓周長是多少公分？",a:31.4,h:"5 × 2 × 3.14"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage" style="touch-action:none; cursor:ew-resize;"></div>'); // 禁用預設滑動，改為拖曳游標
  b.appendChild(st);var v=NB.svg(st,560,260);
  
  var cx = 160, cy = 130, R = 50; // 初始半徑
  var isDragging = false;

  /* 綁定拖曳事件 */
  v.onpointerdown = function(e){ isDragging = true; v.setPointerCapture(e.pointerId); updateR(e); };
  v.onpointermove = function(e){ if(isDragging) updateR(e); };
  v.onpointerup = function(e){ isDragging = false; };
  v.onpointercancel = function(e){ isDragging = false; };

  function updateR(e){
      var rect = v.getBoundingClientRect();
      var scaleX = 560 / rect.width; // 處理 SVG 縮放比例
      var touchX = (e.clientX - rect.left) * scaleX;
      // 限制拖曳範圍，最短 20，最長 120
      var newR = Math.max(20, Math.min(120, touchX - cx));
      if(Math.abs(newR - R) > 1) { // 微微防抖
          R = Math.round(newR);
          draw();
      }
  }

  function draw(){
   v.innerHTML="";
   var D = R * 2;
   var C = +(D * 3.14).toFixed(2);

   /* 背景提示文字 */
   NB.t(v, 280, 20, "💡 請按住小紅點向左右拖曳", {z:14, fill:"var(--soft)"});

   /* 畫圓 */
   NB.mk("circle",{cx:cx, cy:cy, r:R, fill:"color-mix(in srgb,var(--p3) 40%,transparent)", stroke:"var(--ink)", 'stroke-width':2},v);
   
   /* 畫直徑與紅點 */
   NB.mk("line",{x1:cx-R, y1:cy, x2:cx+R, y2:cy, stroke:"var(--ink)", 'stroke-width':1.5, 'stroke-dasharray':"4 2"},v);
   NB.mk("circle",{cx:cx+R, cy:cy, r:8, fill:"var(--p1)", stroke:"var(--ink)", 'stroke-width':2},v); // 拖曳把手
   NB.mk("circle",{cx:cx, cy:cy, r:3, fill:"var(--ink)"},v); // 圓心

   /* 畫右側的長條圖來比較長度 */
   var barX = 320, barY = 80;
   NB.t(v, barX, barY, "直徑：", {z:14, a:"start"});
   NB.mk("rect",{x:barX+50, y:barY-15, width:D, height:20, fill:"var(--paper2)", stroke:"var(--ink)"},v);
   NB.t(v, barX+60+D, barY, D+" cm", {z:14, a:"start"});

   NB.t(v, barX, barY+60, "圓周長：", {z:14, a:"start"});
   NB.mk("rect",{x:barX+60, y:barY+45, width:C, height:20, fill:"var(--p4)", stroke:"var(--ink)"},v);
   NB.t(v, barX+70+C, barY+60, C+" cm", {z:14, a:"start", fill:"var(--p4b)", b:1});

   eq.innerHTML="半徑："+R+" cm ｜ 直徑："+D+" cm<br>圓周長 ＝ "+D+" × 3.14 ＝ <b class='ok'>"+C+"</b> cm";
  }
  draw();
 }
});