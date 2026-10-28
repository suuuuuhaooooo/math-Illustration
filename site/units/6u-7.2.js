/* 六上 7.2 扇形面積 */
NB.unit({
 q:"半徑 10 公分、圓心角 120 度的扇形，面積是多少？",
 steps:[
  "扇形是圓的一部分，所以要先算出一整個完整的圓面積。",
  "圓面積 ＝ 10 × 10 × 3.14 ＝ 314。",
  "接著看圓心角佔了 360 度的幾分之幾：120 ÷ 360 ＝ 1/3。",
  "所以扇形面積 ＝ 314 × 1/3 ＝ 104.67 (約)。"
 ],
 ch:{q:"半徑 20 公分、圓心角 90 度的扇形，面積是多少平方公分？",a:314,h:"(20×20×3.14) × (90/360) ＝ 1256 × (1/4)"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,220);
  
  var ctl = NB.h('<div class="ctl" style="justify-content:center; margin-bottom:10px;"></div>');
  var angles = [90, 120, 180, 270];
  var btns = [];
  angles.forEach(function(ang){
      var btn = NB.h('<button class="pen'+(ang===90?" on":"")+'">'+ang+'度</button>');
      btn.onclick = function(){ 
          btns.forEach(function(bb){ bb.className="pen"; }); 
          btn.className="pen on"; 
          draw(ang); 
      };
      btns.push(btn); ctl.appendChild(btn);
  });
  b.insertBefore(ctl, st);
  
  function draw(ang){
   v.innerHTML="";
   var cx = 150, cy = 110, r = 80;
   
   /* 畫底層的虛線圓 */
   NB.mk("circle",{cx:cx, cy:cy, r:r, fill:"var(--paper2)", stroke:"var(--soft)", 'stroke-dasharray':"4 4"},v);

   /* 計算扇形路徑 */
   var rad = (ang * Math.PI) / 180;
   var x2 = cx + r * Math.cos(rad);
   var y2 = cy - r * Math.sin(rad); // SVG的Y軸向下，所以要減
   var largeArc = ang > 180 ? 1 : 0;
   
   var d = "M"+cx+" "+cy+" L"+(cx+r)+" "+cy+" A"+r+" "+r+" 0 "+largeArc+" 0 "+x2+" "+y2+" Z";
   NB.mk("path",{d:d, fill:"color-mix(in srgb,var(--p4) 60%,transparent)", stroke:"var(--ink)", 'stroke-width':2},v);

   /* 畫圓心角的標示弧 */
   NB.mk("path",{d:"M"+(cx+20)+" "+cy+" A20 20 0 "+largeArc+" 0 "+(cx+20*Math.cos(rad))+" "+(cy-20*Math.sin(rad)), fill:"none", stroke:"var(--p1)", 'stroke-width':2},v);
   NB.t(v, cx+15, cy-15, ang+"°", {z:14, fill:"var(--p1)", b:1});

   /* 計算佔比 */
   var fraction = "";
   if(ang===90) fraction = "1/4";
   if(ang===120) fraction = "1/3";
   if(ang===180) fraction = "1/2";
   if(ang===270) fraction = "3/4";

   eq.innerHTML="圓心角佔全部的比例："+ang+" ÷ 360 ＝ <b>"+fraction+" 圓</b><br>扇形面積 ＝ (半徑 × 半徑 × 3.14) × <b class='ok'>"+fraction+"</b>";
  }
  draw(90);
 }
});