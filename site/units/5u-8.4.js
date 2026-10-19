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
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var mode0 = NB.h('<button class="pen on">原本的水量</button>');
    var mode1 = NB.h('<button class="pen">混合後重新平分 (平均)</button>');
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
      
      var vals = [20, 40, 50, 10];
      var avg = 30; // (20+40+50+10)/4
      
      var cx = 250, bottomY = 200;
      var gap = 70, width = 40;
      var startX = cx - (gap*3)/2;
      var scale = 2.5; // 高度放大倍率
      
      if (currentMode === 0) {
          vals.forEach(function(val, i) {
              var x = startX + i*gap - width/2;
              // 畫杯子外框
              NB.mk("rect", { x: x, y: bottomY - 60*scale, width: width, height: 60*scale, fill: "none", stroke: "#cbd5e1", "stroke-width": 2 }, v, 1);
              // 畫水量
              NB.mk("rect", { x: x, y: bottomY - val*scale, width: width, height: val*scale, fill: "#74b9ff", "fill-opacity": "0.8" }, v, 2);
              // 標示數字
              NB.t(v, x + width/2, bottomY + 20, val, { z: 16, c: "#64748b", b: 1 });
          });
          eq.innerHTML = '每個杯子的水量都不一樣高。<br>總水量：20 + 40 + 50 + 10 = <b>120</b>';
          
      } else {
          // 畫一條虛線代表「平均線」
          NB.mk("line", { x1: startX - 40, y1: bottomY - avg*scale, x2: startX + 3*gap + 40, y2: bottomY - avg*scale, stroke: "#ff7675", "stroke-width": 3, "stroke-dasharray": "6,4" }, v, 3);
          NB.t(v, startX + 3*gap + 55, bottomY - avg*scale + 5, "平均 30", { z: 16, c: "#ff7675", b: 1 });
          
          vals.forEach(function(val, i) {
              var x = startX + i*gap - width/2;
              NB.mk("rect", { x: x, y: bottomY - 60*scale, width: width, height: 60*scale, fill: "none", stroke: "#cbd5e1", "stroke-width": 2 }, v, 1);
              // 水量全部變成平均值
              NB.mk("rect", { x: x, y: bottomY - avg*scale, width: width, height: avg*scale, fill: "var(--p1)", "fill-opacity": "0.8" }, v, 2);
              // 底部標示變成 30
              NB.t(v, x + width/2, bottomY + 20, "30", { z: 16, c: "var(--p1)", b: 1 });
          });
          
          eq.innerHTML = '把 120 的總水量混合後，平分倒回 4 個杯子（截長補短）。<br>公式：<b>總和 &divide; 數量 = 平均</b> &rarr; 120 &divide; 4 = <b style="color:var(--p1)">30</b>';
      }
    }
    draw();
  }
});