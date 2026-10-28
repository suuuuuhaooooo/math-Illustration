/* 六上 3.5 堆疊與相接問題 */
NB.unit({
 q:"生活中有許多「重疊」或「相接」的問題，它們的計算規則很像喔！請動手玩玩看。",
 steps:[
  "【紙杯疊高】每個杯子有固定的底，疊上去只會露出「杯緣」。總高度 = 1個完整的杯子 + (數量-1) × 露出的杯緣。",
  "【紙條相黏】把紙條黏起來，接縫處會「重疊」而少掉一段。總長度 = 所有紙條分開的總長 - (重疊長度 × 重疊次數)。",
  "【推車收納】賣場推車推進去收納時，第一輛會佔據完整長度，後面每一輛只會多出「露在外面的部分」。"
 ],
 ch:{q:"大賣場的一輛推車長 80 公分。收納時，每多推入一輛推車，總長度會增加 20 公分。如果有 5 輛推車排在一起，總長度是多少公分？",a:160,h:"1 輛完整的推車 + 4 輛露出的長度。80 + 4 × 20 = 160。"},
 tool:function(b,eq){
  /* 隱藏預設的算式框 */
  eq.style.display = "none";

  /* 建立切換按鈕區 */
  var mode_box = NB.h('<div style="margin-bottom:10px; display:flex; flex-wrap:wrap; gap:8px; align-items:center;"><b>選擇情境：</b> </div>');
  var btn1 = NB.h('<button class="pen on">1. 紙杯疊高</button>');
  var btn2 = NB.h('<button class="pen">2. 紙條相黏</button>');
  var btn3 = NB.h('<button class="pen">3. 推車收納</button>');
  mode_box.appendChild(btn1);
  mode_box.appendChild(btn2);
  mode_box.appendChild(btn3);
  b.appendChild(mode_box);

  /* 建立三個獨立的互動區塊 */
  var st1 = NB.h('<div class="stage"></div>');
  var st2 = NB.h('<div class="stage" style="display:none;"></div>');
  var st3 = NB.h('<div class="stage" style="display:none;"></div>');
  b.appendChild(st1);
  b.appendChild(st2);
  b.appendChild(st3);

  var v1 = NB.svg(st1,560,260); 
  var v2 = NB.svg(st2,560,260);
  var v3 = NB.svg(st3,560,260);

  // ================= 模式 1：紙杯疊高 =================
  var cup_div = NB.h('<div></div>'); st1.appendChild(cup_div);
  var cup = NB.slider(cup_div,"杯子數量",1,10,1,5,"個",draw1);
  var eq1 = NB.h('<div class="eq"></div>'); st1.appendChild(eq1);

  function draw1(){
   v1.innerHTML="";
   var n=cup.v, base_h=10, rim_h=2;
   var total = base_h + (n-1)*rim_h;
   var cx=280, base_y=240, cup_px=60, rim_px=15, w_top=80, w_bot=50; 

   for(var i=0; i<n; i++){
    var y_top = base_y - cup_px - i*rim_px;
    var points = (cx-w_top/2)+","+y_top+" "+(cx+w_top/2)+","+y_top+" "+(cx+w_bot/2)+","+(y_top+cup_px)+" "+(cx-w_bot/2)+","+(y_top+cup_px);
    var fill = i===0 ? "color-mix(in srgb,var(--p2) 50%,transparent)" : "color-mix(in srgb,var(--p1) 30%,transparent)";
    NB.mk("polygon",{points:points,fill:fill,stroke:"var(--ink)",'stroke-width':2},v1);
   }

   var top_y = base_y - cup_px - (n-1)*rim_px;
   NB.mk("line",{x1:cx+w_top/2+20, y1:top_y, x2:cx+w_top/2+20, y2:base_y, stroke:"var(--p4)",'stroke-width':3},v1);
   NB.mk("line",{x1:cx+w_top/2+10, y1:top_y, x2:cx+w_top/2+30, y2:top_y, stroke:"var(--p4)",'stroke-width':3},v1);
   NB.mk("line",{x1:cx+w_top/2+10, y1:base_y, x2:cx+w_top/2+30, y2:base_y, stroke:"var(--p4)",'stroke-width':3},v1);
   NB.t(v1,cx+w_top/2+55, base_y-(cup_px+(n-1)*rim_px)/2+6, total+"cm", {z:16, fill:"var(--p4)", b:1});

   eq1.innerHTML="疊 "+n+" 個紙杯：1 個完整的杯身(" + base_h + "cm) + <b>"+(n-1)+"</b> 個露出的杯緣(各" + rim_h + "cm)<br>總高 = 10 + "+(n-1)+" × 2 = <b class='ok'>"+total+"</b> 公分";
  }

  // ================= 模式 2：紙條相黏 =================
  var strip_div = NB.h('<div></div>'); st2.appendChild(strip_div);
  var strip = NB.slider(strip_div,"紙條數量",1,6,1,3,"張",draw2);
  var eq2 = NB.h('<div class="eq"></div>'); st2.appendChild(eq2);

  function draw2(){
   v2.innerHTML="";
   var n=strip.v, base_len=15, overlap=3;
   var total = base_len * n - overlap * (n-1);
   var scale = 6, cx=30, cy=80, strip_px = base_len * scale, over_px = overlap * scale;

   for(var i=0; i<n; i++){
    var sx = cx + i * (strip_px - over_px);
    var fill = i%2===0 ? "color-mix(in srgb,var(--p3) 50%,transparent)" : "color-mix(in srgb,var(--p4) 50%,transparent)";
    
    NB.mk("rect",{x:sx, y:cy, width:strip_px, height:30, fill:fill, stroke:"var(--ink)",'stroke-width':1.5},v2);
    NB.t(v2, sx + strip_px/2, cy+20, "15cm", {z:14, fill:"var(--ink)"});
    
    if(i > 0){
      var ox = cx + i * (strip_px - over_px);
      NB.mk("rect",{x:ox, y:cy, width:over_px, height:30, fill:"color-mix(in srgb,var(--p1) 50%,transparent)", stroke:"var(--ink)",'stroke-width':1.5,'stroke-dasharray':"2 2"},v2);
      NB.t(v2, ox + over_px/2, cy-10, "重疊3cm", {z:12, fill:"var(--p1)", b:1});
    }
   }

   var total_px = strip_px * n - over_px * (n-1);
   NB.mk("line",{x1:cx, y1:cy+50, x2:cx+total_px, y2:cy+50, stroke:"var(--p2)",'stroke-width':3},v2);
   NB.mk("line",{x1:cx, y1:cy+40, x2:cx, y2:cy+60, stroke:"var(--p2)",'stroke-width':3},v2);
   NB.mk("line",{x1:cx+total_px, y1:cy+40, x2:cx+total_px, y2:cy+60, stroke:"var(--p2)",'stroke-width':3},v2);
   NB.t(v2, cx + total_px/2, cy+75, total+" cm", {z:16, fill:"var(--p2)", b:1});

   eq2.innerHTML="黏 "+n+" 張紙條：有 <b>"+(n-1)+"</b> 個重疊處。<br>總長 = (所有紙條長 15 × "+n+") - (重疊減損 3 × "+(n-1)+") = <b class='ok'>"+total+"</b> 公分";
  }

  // ================= 模式 3：推車收納 =================
  var cart_div = NB.h('<div></div>'); st3.appendChild(cart_div);
  var cart = NB.slider(cart_div,"推車數量",1,8,1,3,"輛",draw3);
  var eq3 = NB.h('<div class="eq"></div>'); st3.appendChild(eq3);

  function draw3(){
   v3.innerHTML="";
   var n=cart.v, base_len=80, offset=20;
   var total = base_len + (n-1) * offset;
   
   var scale = 1.6, cx = 60, cy = 90;
   var px_base = base_len * scale, px_offset = offset * scale;

   /* 為了讓第一輛被蓋住，從最後一輛往前畫 */
   for(var i=n-1; i>=0; i--){
    var sx = cx + i * px_offset;
    var fill = i===0 ? "color-mix(in srgb,var(--p2) 40%,transparent)" : "color-mix(in srgb,var(--p5) 40%,transparent)";
    
    /* 推車把手 */
    NB.mk("line", {x1: sx-5*scale, y1: cy-15*scale, x2: sx+15*scale, y2: cy, stroke: "var(--ink)", 'stroke-width': 2}, v3);
    /* 推車籃子 (用 polygon 畫梯形) */
    var pts = (sx+15*scale)+","+cy+" "+(sx+px_base)+","+cy+" "+(sx+70*scale)+","+(cy+50*scale)+" "+(sx+30*scale)+","+(cy+50*scale);
    NB.mk("polygon", {points: pts, fill: fill, stroke: "var(--ink)", 'stroke-width': 1.5}, v3);
    /* 兩個輪子 */
    NB.mk("circle", {cx: sx+35*scale, cy: cy+55*scale, r: 6*scale, fill: "var(--ink)"}, v3);
    NB.mk("circle", {cx: sx+65*scale, cy: cy+55*scale, r: 6*scale, fill: "var(--ink)"}, v3);

    /* 標示第一輛推車的基準長度 */
    if(i===0){
     NB.mk("line",{x1:sx, y1:cy-30*scale, x2:sx+px_base, y2:cy-30*scale, stroke:"var(--soft)",'stroke-dasharray':"2 2"},v3);
     NB.mk("line",{x1:sx, y1:cy-35*scale, x2:sx, y2:cy-25*scale, stroke:"var(--soft)"},v3);
     NB.mk("line",{x1:sx+px_base, y1:cy-35*scale, x2:sx+px_base, y2:cy-25*scale, stroke:"var(--soft)"},v3);
     NB.t(v3, sx + px_base/2, cy-40*scale, "第 1 輛 "+base_len+"cm", {z:12, fill:"var(--soft)"});
    }
   }

   /* 標示總長度 */
   var total_px = px_base + px_offset * (n-1);
   var line_y = cy + 75 * scale;
   NB.mk("line",{x1:cx, y1:line_y, x2:cx+total_px, y2:line_y, stroke:"var(--p1)",'stroke-width':3},v3);
   NB.mk("line",{x1:cx, y1:line_y-10, x2:cx, y2:line_y+10, stroke:"var(--p1)",'stroke-width':3},v3);
   NB.mk("line",{x1:cx+total_px, y1:line_y-10, x2:cx+total_px, y2:line_y+10, stroke:"var(--p1)",'stroke-width':3},v3);
   NB.t(v3, cx + total_px/2, line_y+20, total+" cm", {z:16, fill:"var(--p1)", b:1});

   eq3.innerHTML="排 "+n+" 輛推車：1 輛完整的推車(" + base_len + "cm) + <b>"+(n-1)+"</b> 輛露出的長度(各" + offset + "cm)<br>總長 = 80 + "+(n-1)+" × 20 = <b class='ok'>"+total+"</b> 公分";
  }

  // ================= 按鈕切換邏輯 =================
  function switchMode(m) {
   btn1.className = m===1 ? "pen on" : "pen";
   btn2.className = m===2 ? "pen on" : "pen";
   btn3.className = m===3 ? "pen on" : "pen";
   st1.style.display = m===1 ? "block" : "none";
   st2.style.display = m===2 ? "block" : "none";
   st3.style.display = m===3 ? "block" : "none";
   if(m===1) draw1();
   if(m===2) draw2();
   if(m===3) draw3();
  }

  btn1.onclick = function(){ switchMode(1); };
  btn2.onclick = function(){ switchMode(2); };
  btn3.onclick = function(){ switchMode(3); };
  
  draw1();
 }
});
