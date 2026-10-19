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
    var currentStep = 0;
    
    var stepsText = ["題目", "第一步", "第二步", "第三步"];
    var stepBtns = [];
    stepsText.forEach(function(txt, i) {
      var btn = NB.h('<button class="pen ' + (i === 0 ? 'on' : '') + '">' + txt + '</button>');
      btn.onclick = function() { currentStep = i; updateStepBtns(); draw(); };
      stepBtns.push(btn);
      stepRow.appendChild(btn);
    });
    
    function updateStepBtns() {
      stepBtns.forEach(function(btn, i) { btn.classList.toggle('on', i === currentStep); });
    }
    b.appendChild(stepRow);
    
    // 放棄 SVG 畫文字，改用 HTML div，字距與符號完美對齊
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center; padding: 50px 0; font-family: monospace, system-ui, sans-serif; font-size: 38px; font-weight: bold; letter-spacing: 2px;"></div>');
    b.appendChild(st);

    function draw() {
      var html = ""; 
      
      if (currentStep === 0) {
          html = '<span style="color:#333;">250 − ( 30 + 15 ) &times; 4</span>';
          eq.innerHTML = '找出算式中最需要優先計算的部分。';
      } else if (currentStep === 1) {
          html = '<span style="color:#94a3b8;">250 − </span>' + 
                 '<span style="color:#e91e63; border-bottom: 4px solid #e91e63; padding-bottom: 4px;">( 30 + 15 )</span>' + 
                 '<span style="color:#94a3b8;"> &times; 4</span>';
          eq.innerHTML = '第一步：有<b style="color:#e91e63">括號</b>的地方最偉大，必須最先計算！<br>30 + 15 = 45';
      } else if (currentStep === 2) {
          html = '<span style="color:#94a3b8;">250 − </span>' + 
                 '<span style="color:var(--p1); border-bottom: 4px solid var(--p1); padding-bottom: 4px;">45 &times; 4</span>';
          eq.innerHTML = '第二步：先乘除，後加減。所以要先算<b style="color:var(--p1)">乘法</b>！<br>45 &times; 4 = 180';
      } else if (currentStep === 3) {
          html = '<span style="color:var(--p2); border-bottom: 4px solid var(--p2); padding-bottom: 4px;">250 − 180</span>';
          eq.innerHTML = '最後一步：只剩下減法了，直接計算。<br>250 − 180 = <b style="color:var(--p2); font-size:24px;">70</b>';
      }
      
      st.innerHTML = html;
    }
    draw();
  }
});
