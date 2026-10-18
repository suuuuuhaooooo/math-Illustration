/* 六上 9.2 認識比例尺 */
NB.unit({
 q:"地圖上標示的比例尺有好多種長相，它們的意思一樣嗎？",
 steps:[
  "比例尺代表「地圖上的 1 單位」等於「實際長度的多少單位」。",
  "【比】1 : 1000 (代表地圖 1cm = 實際 1000cm)",
  "【比值】1 / 1000",
  "【圖示】畫出一條線段，直接告訴你這條線在地圖上代表實際多長。最直觀！"
 ],
 ch:{q:"比例尺 1 : 5000 的地圖上，2 公分代表實際距離多少公分？",a:10000,h:"2 × 5000 = 10000 公分"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,200);
  
  var ctl = NB.h('<div class="ctl" style="justify-content:center; margin-bottom:10px;"></div>');
  var btns = [];
  var modes = ["1. 寫成「比」", "2. 寫成「比值」", "3. 畫成「圖示」"];
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
  
  function draw(mode){
   v.innerHTML="";
   
   /* 畫地圖背景 */
   NB.mk("rect",{x:40, y:30, width:260, height:140, fill:"var(--paper2)", stroke:"var(--soft)", 'stroke-width':2, rx:8},v);
   NB.t(v, 80, 55, "📍 某某公園地圖", {z:16, b:1});

   /* 畫右邊的放大解說框 */
   NB.mk("rect",{x:340, y:50, width:180, height:100, fill:"#fff", stroke:"var(--p4)", 'stroke-width':3, 'stroke-dasharray':"4 2", rx:8},v);
   NB.t(v, 430, 80, "地圖比例尺", {z:14, fill:"var(--soft)"});

   if(mode === 0){
       // 比
       NB.t(v, 160, 150, "比例尺 1 : 1000", {z:14, b:1});
       NB.t(v, 430, 115, "1 : 1000", {z:24, b:1, fill:"var(--p1)"});
       eq.innerHTML="寫法：<b>1 : 1000</b><br>意義：地圖上的 1 公分，代表實際長度 <b class='ok'>1000 公分</b>。";
   }
   else if(mode === 1){
       // 比值
       NB.t(v, 160, 150, "比例尺 1 / 1000", {z:14, b:1});
       NB.t(v, 430, 105, "1", {z:20, b:1, fill:"var(--p2)"});
       NB.mk("line",{x1:400, y1:115, x2:460, y2:115, stroke:"var(--p2)", 'stroke-width':3},v);
       NB.t(v, 430, 135, "1000", {z:20, b:1, fill:"var(--p2)"});
       eq.innerHTML="寫法：<b>1 / 1000</b> (分數形式)<br>意義：地圖上的長度，是實際長度的 <b class='ok'>1000 分之 1</b>。";
   }
   else if(mode === 2){
       // 圖示
       NB.t(v, 90, 150, "比例尺", {z:14, b:1});
       // 地圖上的小圖示
       NB.mk("line",{x1:130, y1:145, x2:180, y2:145, stroke:"var(--ink)", 'stroke-width':3},v);
       NB.mk("line",{x1:130, y1:140, x2:130, y2:150, stroke:"var(--ink)", 'stroke-width':2},v);
       NB.mk("line",{x1:180, y1:140, x2:180, y2:150, stroke:"var(--ink)", 'stroke-width':2},v);
       NB.t(v, 130, 135, "0", {z:10}); NB.t(v, 180, 135, "10m", {z:10});
       
       // 放大區的圖示 + 直尺
       NB.mk("line",{x1:380, y1:115, x2:480, y2:115, stroke:"var(--ink)", 'stroke-width':4},v);
       NB.mk("line",{x1:380, y1:105, x2:380, y2:125, stroke:"var(--ink)", 'stroke-width':3},v);
       NB.mk("line",{x1:480, y1:105, x2:480, y2:125, stroke:"var(--ink)", 'stroke-width':3},v);
       NB.t(v, 380, 100, "0", {z:16}); NB.t(v, 480, 100, "10 公尺", {z:16});
       
       // 放一把黃色透明直尺在上面量
       NB.mk("rect",{x:360, y:125, width:140, height:30, fill:"color-mix(in srgb,var(--p4) 40%,transparent)", stroke:"none"},v);
       for(var k=0; k<=10; k++) {
           NB.mk("line",{x1:380+k*10, y1:125, x2:380+k*10, y2:132, stroke:"var(--ink)"},v);
       }
       NB.t(v, 380, 148, "0", {z:12}); NB.t(v, 480, 148, "1cm", {z:12});

       eq.innerHTML="寫法：<b>圖示線段</b><br>意義：拿直尺量地圖，這段 <b class='ok'>1 公分</b> 的線，就代表實際的 <b class='ok'>10 公尺</b>！";
   }
  }
  draw(0);
 }
});