/* 六上 3.4 積不變 (長方形面積) */
NB.unit({
 q:"用 24 塊邊長 1 公分的正方形小積木排成長方形，不管排成哪種長度和寬度，『總面積』會改變嗎？",
 steps:["不管排成細細長長，還是接近正方形，用到的積木數量都是 24 塊。","長 × 寬 = 24，這就是「積不變」的關係。","當長度變 2 倍，寬度就會變成 1/2 倍，相乘結果依然是 24。"],
 ch:{q:"如果長是 8 公分，寬會是多少公分？",a:3,h:"面積是 24，寬 = 24 ÷ 8。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,260);
  var len=NB.slider(b,"設定長度",1,24,1,6,"公分",draw);
  function draw(){
   v.innerHTML="";
   var L=len.v, W=24/L;
   if(24%L !== 0) {
       eq.innerHTML="無法用 24 塊積木完整排成整數長寬。請滑動選擇 24 的因數 (如 2, 3, 4, 6, 8, 12)。";
       return;
   }
   var scale = 16, cx = (560-L*scale)/2, cy = (240-W*scale)/2;
   
   /* 畫出積木網格 */
   for(var r=0; r<W; r++){
       for(var c=0; c<L; c++){
           NB.mk("rect",{x:cx+c*scale, y:cy+r*scale, width:scale, height:scale, fill:"color-mix(in srgb,var(--p3) 50%,transparent)", stroke:"var(--ink)", 'stroke-width':1},v);
       }
   }
   
   NB.t(v, cx+L*scale/2, cy-10, "長: "+L, {z:14});
   NB.t(v, cx-25, cy+W*scale/2+5, "寬: "+W, {z:14});

   eq.innerHTML="排成 長 "+L+" 公分、寬 "+W+" 公分的長方形。<br>面積："+L+" × "+W+" = <b class='ok'>24</b> 平方公分 (積不變)";
  }
  draw();
 }
});