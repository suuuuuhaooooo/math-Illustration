/* 六上 9.3 比例尺的應用 */
NB.unit({
 q:"有一座實際長度 400 公尺的跨海大橋，如果要畫在比例尺 1 : 10000 的地圖上，要畫幾公分？",
 steps:[
  "陷阱：比例尺的單位通常都是預設「公分」，所以要先把實際長度換成公分！",
  "第一步：400 公尺 ＝ 40000 公分。",
  "第二步：乘上比例尺縮小。 40000 × (1/10000) ＝ 4。",
  "所以地圖上要畫 4 公分長。"
 ],
 ch:{q:"實際長度 3 公里，畫在 1:50000 的地圖上，是幾公分？",a:6,h:"3公里 = 300000公分。300000 ÷ 50000 = 6。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,260);
  
  var ctl = NB.h('<div class="ctl" style="justify-content:center; margin-bottom:10px;"></div>');
  var btns = [];
  var modes = ["1. 真實的大橋", "2. 換算單位(公分)", "3. 縮小放進地圖"];
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
   var cx = 280;

   if(step === 0){
       /* 真實風景 */
       NB.mk("rect",{x:0, y:120, width:560, height:140, fill:"color-mix(in srgb,var(--p1) 20%,transparent)", stroke:"none"},v); // 海水
       NB.mk("rect",{x:80, y:100, width:400, height:20, fill:"var(--p2)", stroke:"var(--ink)", 'stroke-width':2},v); // 橋面
       NB.mk("line",{x1:150, y1:120, x2:150, y2:200, stroke:"var(--p2)", 'stroke-width':10},v); // 橋墩
       NB.mk("line",{x1:410, y1:120, x2:410, y2:200, stroke:"var(--p2)", 'stroke-width':10},v);

       NB.mk("line",{x1:80, y1:60, x2:480, y2:60, stroke:"var(--ink)", 'stroke-width':3},v);
       NB.mk("line",{x1:80, y1:50, x2:80, y2:70, stroke:"var(--ink)", 'stroke-width':3},v);
       NB.mk("line",{x1:480, y1:50, x2:480, y2:70, stroke:"var(--ink)", 'stroke-width':3},v);
       NB.t(v, cx, 45, "實際長度：400 公尺", {z:18, b:1});

       eq.innerHTML="真實世界的大橋很長，總共 <b>400 公尺</b>。";
   }
   else if(step === 1){
       /* 單位換算面板 */
       NB.mk("rect",{x:80, y:100, width:400, height:20, fill:"var(--p2)", stroke:"var(--soft)", 'stroke-dasharray':"2 2"},v);
       
       NB.mk("rect",{x:130, y:50, width:300, height:120, rx:15, fill:"#fff", stroke:"var(--p4)", 'stroke-width':4},v);
       NB.t(v, cx, 85, "準備換算單位！", {z:16, fill:"var(--soft)"});
       NB.t(v, cx, 120, "400 公尺 ＝ 40000 公分", {z:20, b:1, fill:"var(--p4)"});
       
       eq.innerHTML="⚠️ 比例尺的計算必須在相同單位下進行。<br>第一步：先將公尺換算成公分（加上兩個 0）。";
   }
   else if(step === 2){
       /* 變成地圖上的一條線段 */
       NB.mk("rect",{x:180, y:20, width:200, height:180, fill:"var(--paper2)", stroke:"var(--soft)", 'stroke-width':2},v); // 紙張
       NB.t(v, 280, 50, "比例尺 1 : 10000", {z:14, fill:"var(--soft)", b:1});

       // 縮小後的橋 (畫 40px 長)
       NB.mk("line",{x1:260, y1:120, x2:300, y2:120, stroke:"var(--p2)", 'stroke-width':6},v);
       
       // 測量標示
       NB.mk("line",{x1:260, y1:100, x2:300, y2:100, stroke:"var(--ink)", 'stroke-width':2},v);
       NB.mk("line",{x1:260, y1:95, x2:260, y2:105, stroke:"var(--ink)", 'stroke-width':2},v);
       NB.mk("line",{x1:300, y1:95, x2:300, y2:105, stroke:"var(--ink)", 'stroke-width':2},v);
       NB.t(v, cx, 85, "畫 4 公分", {z:14, b:1, fill:"var(--p1)"});

       eq.innerHTML="第二步：將實際公分數乘上比例尺（除以 10000）。<br>計算：40000 × (1/10000) ＝ <b class='ok'>4</b><br>所以只要在地圖上畫 4 公分就可以了！";
   }
  }
  draw(0);
 }
});