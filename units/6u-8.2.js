/* 六上 8.2 速率單位換算 */
NB.unit({
 q:"一台腳踏車的速率是「秒速 5 公尺 (5 m/s)」。如果換算成「分速」和「時速」，會是多少呢？",
 steps:[
  "1 分鐘有 60 秒，所以 1 分鐘能跑的距離是 1 秒的 60 倍 (×60)。",
  "1 小時有 60 分鐘，所以 1 小時能跑的距離是 1 分鐘的 60 倍 (×60)。",
  "最後，要把「公尺 (m)」換成「公里 (km)」，記得除以 1000！"
 ],
 ch:{q:"秒速 10 公尺，相當於時速多少公里？",a:36,h:"10 × 60 × 60 ÷ 1000 ＝ 36 km/h"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,200);
  
  var ctl = NB.h('<div class="ctl" style="justify-content:center; margin-bottom:10px;"></div>');
  var btns = [];
  var modes = ["1. 秒速 (m/s)", "2. 變成分速", "3. 變成時速"];
  modes.forEach(function(txt, i){
      var btn = NB.h('<button class="pen'+(i===0?" on":"")+'">'+txt+'</button>');
      btn.onclick = function(){ 
          btns.forEach(function(bb){ bb.className="pen"; }); 
          btn.className="pen on"; 
          draw(i); 
      };
      btns.push(btn); ctl.appendChild(btn);
  });
  b.insertBefore(ctl, st);
  
  function draw(step){
   v.innerHTML="";
   var cx = 80, cy = 100;

   if(step === 0){
       NB.mk("circle",{cx:cx, cy:cy, r:30, fill:"none", stroke:"var(--ink)", 'stroke-width':2},v);
       NB.mk("line",{x1:cx, y1:cy, x2:cx+20, y2:cy, stroke:"var(--p1)", 'stroke-width':2},v); // 秒針走一格
       NB.t(v, cx, cy+55, "1 秒鐘", {z:14, b:1});
       
       NB.mk("rect",{x:160, y:70, width:100, height:60, rx:8, fill:"var(--p2)", stroke:"var(--ink)"},v);
       NB.t(v, 210, 105, "跑 5 公尺", {z:16});
       
       eq.innerHTML="目前速率：<b>秒速 5 公尺 (5 m/s)</b><br>意思是：每經過 1 秒鐘，可以前進 5 公尺。";
   }
   else if(step === 1){
       NB.mk("circle",{cx:cx, cy:cy, r:30, fill:"none", stroke:"var(--ink)", 'stroke-width':2},v);
       NB.mk("path",{d:"M"+cx+" "+(cy-20)+" A20 20 0 1 1 "+(cx-1)+" "+(cy-20), fill:"none", stroke:"var(--p4)", 'stroke-width':3},v); // 繞一圈
       NB.t(v, cx, cy+55, "1 分鐘 (60秒)", {z:14, b:1});

       NB.mk("rect",{x:160, y:70, width:200, height:60, rx:8, fill:"var(--p3)", stroke:"var(--ink)"},v);
       NB.t(v, 260, 105, "5 × 60 ＝ 300 公尺", {z:16});

       eq.innerHTML="1 分鐘 ＝ 60 秒 ➔ 所以距離要放大 60 倍。<br>目前速率：<b>分速 300 公尺 (300 m/min)</b>";
   }
   else if(step === 2){
       NB.mk("circle",{cx:cx, cy:cy, r:30, fill:"none", stroke:"var(--ink)", 'stroke-width':2},v);
       for(var i=0; i<3; i++) NB.mk("circle",{cx:cx, cy:cy, r:15+i*5, fill:"none", stroke:"var(--p1)", 'stroke-dasharray':"2 2"},v); // 繞很多圈
       NB.t(v, cx, cy+55, "1 小時 (60分)", {z:14, b:1});

       NB.mk("rect",{x:160, y:70, width:300, height:60, rx:8, fill:"var(--p4)", stroke:"var(--ink)"},v);
       NB.t(v, 310, 95, "300 × 60 ＝ 18000 公尺", {z:14});
       NB.t(v, 310, 115, "➔ 換算成 18 公里", {z:16, fill:"#fff", b:1});

       eq.innerHTML="1 小時 ＝ 60 分鐘 ➔ 距離再放大 60 倍，再除以 1000 變公里。<br>目前速率：<b class='ok'>時速 18 公里 (18 km/h)</b>";
   }
  }
  draw(0);
 }
});