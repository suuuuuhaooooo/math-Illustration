/* 五上 第八章 整數四則運算 8.4：平均問題 */
NB.unit({
  title: "平均問題",
  ref: "五上・第八章 整數四則運算・8.4 平均問題",
  q: "四個水杯裡分別裝有 20、40、50、10 毫升的水，把它們均分，<span class='hl'>平均每杯</span>會有多少毫升？",
  steps: [
    "「平均」的意思是把東西混合後，平分給每一個單位。",
    "第一步：先算總和。20 + 40 + 50 + 10 = 120 毫升",
    "第二步：平分給 4 杯。120 ÷ 4 = 30 毫升",
    "所以平均每杯是 30 毫升。"
  ],
  ch: { 
    q: "小明三次數學考試的分數是 85、90、95 分，他的平均分數是多少？", 
    a: "90分", 
    h: "( 85 + 90 + 95 ) ÷ 3 = 270 ÷ 3 = 90。" 
  },
  tool: function(b, eq) {
    var stepRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    
    // ★ 變更點：拆解成 3 個更詳細的步驟
    var stepsText = ["1. 原本的水量", "2. 全部混合 (算總和)", "3. 重新平分 (算平均)"];
    var currentStep = 0;
    
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
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 260); // 稍微加高畫布
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    function draw() {
      v.innerHTML = ""; 
      
      var vals = [20, 40, 50, 10];
      var sum = 120;
      var avg = 30;
      var cx = 250, bottomY = 220;
      var scale = 2.0; 
      
      if (currentStep === 0) {
          // 步驟一：四個不一樣的杯子
          var gap = 80, width = 45;
          var startX = cx - (gap*3)/2;
          vals.forEach(function(val, i) {
              var x = startX + i*gap - width/2;
              NB.mk("rect", { x: x, y: bottomY - 60*scale, width: width, height: 60*scale, fill: "none", stroke: "#cbd5e1", "stroke-width": 2 }, v, 1);
              NB.mk("rect", { x: x, y: bottomY - val*scale, width: width, height: val*scale, fill: "#74b9ff", "fill-opacity": "0.8" }, v, 2);
              NB.t(v, x + width/2, bottomY + 25, val, { z: 18, c: "#64748b", b: 1 });
          });
          eq.innerHTML = '每個杯子的水量都不一樣高。<br>計算平均的第一步，要先把它們全部加起來！';
          
      } else if (currentStep === 1) {
          // 步驟二：倒進大水桶混合 (算總和)
          var bigW = 120;
          var bigX = cx - bigW/2;
          
          NB.mk("rect", { x: bigX, y: bottomY - 140*scale, width: bigW, height: 140*scale, fill: "none", stroke: "#cbd5e1", "stroke-width": 3, rx: 6 }, v, 1);
          // 畫總和的水量 (高度稍微等比例調整)
          NB.mk("rect", { x: bigX, y: bottomY - sum*scale*0.8, width: bigW, height: sum*scale*0.8, fill: "var(--p2)", "fill-opacity": "0.8" }, v, 2);
          
          NB.t(v, cx, bottomY - sum*scale*0.4, "總共 120", { z: 22, c: "#fff", b: 1 });
          
          eq.innerHTML = '把它們全部倒進一個大水桶裡混合。<br><b>總水量</b> = 20 + 40 + 50 + 10 = <b style="color:var(--p2)">120</b>';
          
      } else if (currentStep === 2) {
          // 步驟三：平分回 4 個杯子 (算平均)
          var gap = 80, width = 45;
          var startX = cx - (gap*3)/2;
          
          // 平均線
          NB.mk("line", { x1: startX - 40, y1: bottomY - avg*scale, x2: startX + 3*gap + 40, y2: bottomY - avg*scale, stroke: "#ff7675", "stroke-width": 3, "stroke-dasharray": "6,4" }, v, 3);
          NB.t(v, startX + 3*gap + 60, bottomY - avg*scale + 6, "平均 30", { z: 18, c: "#ff7675", b: 1 });
          
          vals.forEach(function(val, i) {
              var x = startX + i*gap - width/2;
              NB.mk("rect", { x: x, y: bottomY - 60*scale, width: width, height: 60*scale, fill: "none", stroke: "#cbd5e1", "stroke-width": 2 }, v, 1);
              // 水量全部變成 30
              NB.mk("rect", { x: x, y: bottomY - avg*scale, width: width, height: avg*scale, fill: "var(--p1)", "fill-opacity": "0.8" }, v, 2);
              NB.t(v, x + width/2, bottomY + 25, "30", { z: 18, c: "var(--p1)", b: 1 });
          });
          
          eq.innerHTML = '再把 120 毫升的水，平分倒回 4 個杯子（截長補短）。<br>公式：<b>總和 &divide; 數量 = 平均</b> &rarr; 120 &divide; 4 = <b style="color:var(--p1)">30</b>';
      }
    }
    draw();
  }
});
