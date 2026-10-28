/* 五上 第八章 整數四則運算 8.1：兩步驟連除問題 */
NB.unit({
  title: "兩步驟連除問題",
  ref: "五上・第八章 整數四則運算・8.1 兩步驟連除問題",
  q: "有 60 片餅乾，平分裝成 3 盒，每盒再平分裝成 4 袋。請問<span class='hl'>每袋有幾片餅乾</span>？",
  steps: [
    "【方法一】按順序慢慢除：",
    "先算 1 盒有幾片：60 ÷ 3 = 20",
    "再算 1 袋有幾片：20 ÷ 4 = 5",
    "【方法二】先算總袋數再除：",
    "先算全部有幾袋：3 × 4 = 12",
    "再算 1 袋有幾片：60 ÷ 12 = 5",
    "結論：連除兩個數，等於除以這兩個數的乘積！"
  ],
  ch: { 
    q: "計算 120 ÷ 5 ÷ 6 = ？", 
    a: "4", 
    h: "可以用 120 ÷ (5 × 6) = 120 ÷ 30 = 4 比較快算出來。" 
  },
  tool: function(b, eq) {
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var modes = ["方法一：循序漸進", "方法二：合併除數"];
    var currentMode = 0;
    
    modes.forEach(function(txt, i) {
      var btn = NB.h('<button class="pen ' + (i === 0 ? 'on' : '') + '">' + txt + '</button>');
      btn.onclick = function() {
        Array.from(btnRow.children).forEach(function(el){ el.classList.remove('on'); });
        btn.classList.add('on');
        currentMode = i; draw();
      };
      btnRow.appendChild(btn);
    });
    b.appendChild(btnRow);
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 240);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    function draw() {
      v.innerHTML = ""; 
      
      // 畫最上方總數 60
      NB.mk("rect", { x: 200, y: 10, width: 100, height: 40, rx: 6, fill: "var(--p1)", "fill-opacity": "0.1", stroke: "var(--p1)", "stroke-width": 2 }, v, 1);
      NB.t(v, 250, 36, "全部 60 片", { z: 18, c: "var(--p1)", b: 1 });
      
      if (currentMode === 0) {
          // 方法一：分兩層 (3盒 -> 4袋)
          NB.mk("path", { d: "M 250 50 L 250 65 M 250 65 L 100 65 L 100 80 M 250 65 L 400 65 L 400 80", fill: "none", stroke: "#94a3b8", "stroke-width": 2 }, v, 2);
          
          // 畫出三個盒子 (簡化為兩側與中間的框)
          [100, 250, 400].forEach(function(cx, i) {
              NB.mk("rect", { x: cx-45, y: 80, width: 90, height: 35, fill: "#fff", stroke: "#cbd5e1", "stroke-width": 2 }, v, 1);
              NB.t(v, cx, 104, (i===1 ? "每盒 20 片" : "20 片"), { z: 16, c: "#64748b", b: 1 });
              
              // 從每個盒子再切分成 4 袋
              NB.mk("line", { x1: cx, y1: 115, x2: cx, y2: 130, stroke: "#94a3b8", "stroke-width": 2 }, v, 2);
              NB.mk("rect", { x: cx-45, y: 130, width: 90, height: 50, rx: 4, fill: "var(--p2)", "fill-opacity": "0.1", stroke: "var(--p2)", "stroke-width": 2, "stroke-dasharray": "4,4" }, v, 1);
              NB.t(v, cx, 153, "切成 4 袋", { z: 14, c: "var(--p2)" });
              NB.t(v, cx, 172, "每袋 5 片", { z: 16, c: "var(--p2)", b: 1 });
          });
          
          eq.innerHTML = '【算式】 <b style="color:var(--p1)">60 &divide; 3</b> &divide; 4<br> = <b style="color:#64748b">20</b> &divide; 4<br> = <b style="color:var(--p2)">5</b>';
          
      } else if (currentMode === 1) {
          // 方法二：直接算出總袋數 12 袋
          NB.mk("line", { x1: 250, y1: 50, x2: 250, y2: 90, stroke: "#94a3b8", "stroke-width": 2 }, v, 2);
          
          // 中間標示總袋數
          NB.mk("rect", { x: 150, y: 90, width: 200, height: 40, fill: "#fff", stroke: "var(--p2)", "stroke-width": 2 }, v, 1);
          NB.t(v, 250, 116, "總共 3 × 4 = 12 袋", { z: 18, c: "var(--p2)", b: 1 });
          
          NB.mk("line", { x1: 250, y1: 130, x2: 250, y2: 160, stroke: "#94a3b8", "stroke-width": 2 }, v, 2);
          
          NB.mk("rect", { x: 180, y: 160, width: 140, height: 40, rx: 6, fill: "var(--p2)", "fill-opacity": "0.1", stroke: "var(--p2)", "stroke-width": 2, "stroke-dasharray": "4,4" }, v, 1);
          NB.t(v, 250, 186, "每袋 5 片", { z: 18, c: "var(--p2)", b: 1 });
          
          eq.innerHTML = '【算式】 60 &divide; <b style="color:var(--p2)">(3 &times; 4)</b><br> = <b style="color:var(--p1)">60</b> &divide; <b style="color:var(--p2)">12</b><br> = <b style="color:var(--p2)">5</b>';
      }
    }
    draw();
  }
});