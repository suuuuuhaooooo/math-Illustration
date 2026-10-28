/* 五上 第八章 整數四則運算 8.3：分配律 */
NB.unit({
  title: "分配律",
  ref: "五上・第八章 整數四則運算・8.3 分配律",
  q: "長方形菜園長 15 公尺、寬 8 公尺，旁邊連著長 5 公尺、寬 8 公尺的花園。<span class='hl'>總面積</span>是多少？",
  steps: [
    "【方法一】先算總長度，再乘上寬度：",
    "( 15 + 5 ) × 8 = 20 × 8 = 160",
    "【方法二】分開算兩塊面積，再相加：",
    "15 × 8 + 5 × 8 = 120 + 40 = 160",
    "這種可以拆開或合併的規則，就叫作「分配律」。"
  ],
  ch: { 
    q: "計算 99 × 7 = ？", 
    a: "693", 
    h: "利用分配律：(100 - 1) × 7 = 100×7 - 1×7 = 700 - 7 = 693。" 
  },
  tool: function(b, eq) {
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var mode0 = NB.h('<button class="pen on">合併計算 (括號先算)</button>');
    var mode1 = NB.h('<button class="pen">拆開計算 (分配律)</button>');
    var currentMode = 0;
    
    mode0.onclick = function() { currentMode = 0; mode0.classList.add('on'); mode1.classList.remove('on'); draw(); };
    mode1.onclick = function() { currentMode = 1; mode1.classList.add('on'); mode0.classList.remove('on'); draw(); };
    btnRow.appendChild(mode0); btnRow.appendChild(mode1);
    b.appendChild(btnRow);
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 240);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    function draw() {
      v.innerHTML = ""; 
      
      var cx = 250, cy = 130;
      var h = 100, w1 = 180, w2 = 60; // h=8, w1=15, w2=5 (比例縮放)
      var leftX = cx - (w1+w2)/2;
      
      // 共通元素：左側的寬度(高)標示
      NB.t(v, leftX - 25, cy + 6, "8", { z: 20, c: "#333", b: 1 });
      
      if (currentMode === 0) {
          // 合併計算：畫一個大框
          NB.mk("rect", { x: leftX, y: cy-h/2, width: w1+w2, height: h, fill: "var(--p1)", "fill-opacity": "0.15", stroke: "var(--p1)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 1);
          
          // 畫上方的長度括號
          NB.mk("path", { d: "M" + leftX + " " + (cy-h/2-10) + " Q " + (leftX+(w1+w2)/2) + " " + (cy-h/2-25) + " " + (leftX+w1+w2) + " " + (cy-h/2-10), fill: "none", stroke: "var(--p1)", "stroke-width": 2 }, v, 2);
          NB.t(v, leftX + (w1+w2)/2, cy-h/2 - 25, "15 + 5", { z: 18, c: "var(--p1)", b: 1 });
          
          NB.t(v, cx, cy + 6, "總面積", { z: 24, c: "var(--p1)", b: 1 });
          
          eq.innerHTML = '先算一整條的長度，再算大面積：<br><b style="color:var(--p1)">( 15 + 5 )</b> &times; 8 = 20 &times; 8 = <b>160</b>';
          
      } else {
          // 拆開計算：畫兩個分開的框
          NB.mk("rect", { x: leftX, y: cy-h/2, width: w1, height: h, fill: "var(--p1)", "fill-opacity": "0.15", stroke: "var(--p1)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 1);
          NB.mk("rect", { x: leftX+w1+4, y: cy-h/2, width: w2, height: h, fill: "var(--p2)", "fill-opacity": "0.15", stroke: "var(--p2)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 1); // 中間留一點空隙
          
          // 上方分別標示長度
          NB.t(v, leftX + w1/2, cy-h/2 - 15, "15", { z: 18, c: "var(--p1)", b: 1 });
          NB.t(v, leftX + w1 + 4 + w2/2, cy-h/2 - 15, "5", { z: 18, c: "var(--p2)", b: 1 });
          
          NB.t(v, leftX + w1/2, cy + 6, "15×8", { z: 20, c: "var(--p1)", b: 1 });
          NB.t(v, leftX + w1 + 4 + w2/2, cy + 6, "5×8", { z: 16, c: "var(--p2)", b: 1 });
          
          eq.innerHTML = '把面積切成兩塊分別計算，最後再加起來：<br><b style="color:var(--p1)">15 &times; 8</b> + <b style="color:var(--p2)">5 &times; 8</b> = 120 + 40 = <b>160</b>';
      }
    }
    draw();
  }
});