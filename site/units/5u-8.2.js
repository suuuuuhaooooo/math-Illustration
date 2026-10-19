/* 五上 第八章 整數四則運算 8.2：多步驟問題 */
NB.unit({
  title: "多步驟問題",
  ref: "五上・第八章 整數四則運算・8.2 多步驟問題",
  q: "請計算混合算式：<span class='hl'>250 − ( 30 + 15 ) × 4</span> = ？",
  steps: [
    "混合計算的三大規則：",
    "1. 有括號的要先算。",
    "2. 先乘除，後加減。",
    "3. 如果只有乘除或只有加減，由左往右算。"
  ],
  ch: { 
    q: "計算 80 + 20 × 3 = ？", 
    a: "140", 
    h: "先乘除後加減，先算 20 × 3 = 60，再算 80 + 60 = 140。" 
  },
  tool: function(b, eq) {
    var stepRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var currentStep = 0; // 0, 1, 2
    
    var btn0 = NB.h('<button class="pen on">題目</button>');
    var btn1 = NB.h('<button class="pen">第一步</button>');
    var btn2 = NB.h('<button class="pen">第二步</button>');
    var btn3 = NB.h('<button class="pen">第三步</button>');
    
    [btn0, btn1, btn2, btn3].forEach(function(btn, i) {
        btn.onclick = function() { 
            [btn0, btn1, btn2, btn3].forEach(function(el){ el.classList.remove('on'); });
            btn.classList.add('on');
            currentStep = i; draw(); 
        };
        stepRow.appendChild(btn);
    });
    b.appendChild(stepRow);
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center; padding: 40px 0;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 100); // 高度不用太高，主要是呈現文字排版
    v.style.fontFamily = "monospace, system-ui, -apple-system, sans-serif";
    v.style.fontSize = "32px";
    v.style.fontWeight = "bold";

    function draw() {
      v.innerHTML = ""; 
      
      var cx = 250, cy = 50;
      
      if (currentStep === 0) {
          NB.t(v, cx, cy, "250 - ( 30 + 15 ) × 4", { z: 32, c: "#333", b: 1 });
          eq.innerHTML = '找出算式中最需要優先計算的部分。';
      } else if (currentStep === 1) {
          NB.t(v, cx - 110, cy, "250 - ", { z: 32, c: "#94a3b8", b: 1 }); // 變淡
          NB.t(v, cx + 15, cy, "( 30 + 15 )", { z: 32, c: "#e91e63", b: 1 }); // 高亮
          NB.t(v, cx + 130, cy, " × 4", { z: 32, c: "#94a3b8", b: 1 });
          // 畫底線
          NB.mk("line", { x1: cx - 60, y1: cy+15, x2: cx + 80, y2: cy+15, stroke: "#e91e63", "stroke-width": 4 }, v, 1);
          eq.innerHTML = '第一步：有<b style="color:#e91e63">括號</b>的地方最偉大，必須最先計算！<br>30 + 15 = 45';
      } else if (currentStep === 2) {
          NB.t(v, cx - 75, cy, "250 - ", { z: 32, c: "#94a3b8", b: 1 });
          NB.t(v, cx + 25, cy, "45 × 4", { z: 32, c: "var(--p1)", b: 1 }); // 高亮乘法
          NB.mk("line", { x1: cx - 15, y1: cy+15, x2: cx + 80, y2: cy+15, stroke: "var(--p1)", "stroke-width": 4 }, v, 1);
          eq.innerHTML = '第二步：先乘除，後加減。所以要先算<b style="color:var(--p1)">乘法</b>！<br>45 × 4 = 180';
      } else if (currentStep === 3) {
          NB.t(v, cx, cy, "250 - 180", { z: 32, c: "var(--p2)", b: 1 });
          NB.mk("line", { x1: cx - 80, y1: cy+15, x2: cx + 80, y2: cy+15, stroke: "var(--p2)", "stroke-width": 4 }, v, 1);
          eq.innerHTML = '最後一步：只剩下減法了，直接計算。<br>250 - 180 = <b style="color:var(--p2); font-size:24px;">70</b>';
      }
    }
    draw();
  }
});