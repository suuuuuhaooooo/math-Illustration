/* 五上 第六章 異分母分數的加減 6.1：異分母分數的加法 */
NB.unit({
  title: "異分母分數的加法",
  ref: "五上・第六章 異分母分數的加減・6.1 異分母分數的加法",
  q: "計算 <span class='hl'>1/2 + 1/3</span> = ？",
  steps: [
    "分母代表每一份的大小。分母不同，大小就不一樣，不能直接相加。",
    "要先「通分」，找出 2 和 3 的最小公倍數 6。",
    "1/2 擴分為 3/6，1/3 擴分為 2/6。",
    "現在每一小格都是 1/6，只要把格子數相加：3 + 2 = 5。",
    "所以答案是 5/6。"
  ],
  ch: { 
    q: "1/4 + 3/8 = ？", 
    a: "5/8", 
    h: "1/4 通分為 2/8，再與 3/8 相加。" 
  },
  tool: function(b, eq) {
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var cases = [
      { n1: 1, d1: 2, n2: 1, d2: 3 }, // 1/2 + 1/3
      { n1: 1, d1: 2, n2: 1, d2: 4 }, // 1/2 + 1/4
      { n1: 2, d1: 3, n2: 1, d2: 4 }  // 2/3 + 1/4
    ];
    var currentCase = 0;
    
    var stepRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center; padding-top:10px; border-top:1px dashed #ccc;"></div>');
    var currentStep = 0; // 0: 原始, 1: 通分切細, 2: 合併
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    
    var v = NB.svg(st, 500, 240);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    // 題目切換按鈕
    cases.forEach(function(c, i) {
      var btn = NB.h('<button class="pen ' + (i === 0 ? 'on' : '') + '">' + c.n1 + '/' + c.d1 + ' + ' + c.n2 + '/' + c.d2 + '</button>');
      btn.onclick = function() {
        Array.from(btnRow.children).forEach(function(el){ el.classList.remove('on'); });
        btn.classList.add('on');
        currentCase = i;
        currentStep = 0; // 切換題目時回到第一步
        updateStepBtns();
        draw();
      };
      btnRow.appendChild(btn);
    });
    b.appendChild(btnRow);
    b.appendChild(stepRow);

    // 步驟切換按鈕
    var stepsText = ["1. 原始圖形", "2. 通分切細", "3. 合併相加"];
    var stepBtns = [];
    stepsText.forEach(function(txt, i) {
      var btn = NB.h('<button class="pen ' + (i === 0 ? 'on' : '') + '" style="background:' + (i===0?'#e2e8f0':'') + '">' + txt + '</button>');
      btn.onclick = function() { currentStep = i; updateStepBtns(); draw(); };
      stepBtns.push(btn);
      stepRow.appendChild(btn);
    });
    function updateStepBtns() {
      stepBtns.forEach(function(btn, i) {
        btn.classList.toggle('on', i === currentStep);
        btn.style.background = (i === currentStep) ? "var(--p1)" : "";
        btn.style.color = (i === currentStep) ? "white" : "";
      });
    }

    // 數學輔助
    function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
    function getLcm(x, y) { return (x * y) / gcd(x, y); }
    function frac(num, den) {
      return '<div style="display:inline-block; vertical-align:middle; text-align:center; margin:0 5px; line-height:1.2; font-family:monospace; font-size:20px; font-weight:bold;">' +
             '<div style="border-bottom:2px solid currentColor; padding:0 5px;">' + num + '</div>' +
             '<div style="padding:0 5px;">' + den + '</div></div>';
    }

    // 畫分數條的函數
    function drawBar(x, y, w, h, n, d, targetD, color, label) {
        var unitW = w / d;
        // 塗色的區塊
        NB.mk("rect", { x: x, y: y, width: unitW * n, height: h, fill: color, "fill-opacity": "0.8" }, v, 1);
        
        // 如果進入「通分」或「合併」步驟，畫出更細的虛線切割
        if (targetD > d && currentStep >= 1) {
            var targetUnitW = w / targetD;
            for(var j = 1; j < targetD; j++) {
                NB.mk("line", { x1: x + j*targetUnitW, y1: y, x2: x + j*targetUnitW, y2: y+h, stroke: "#ffffff", "stroke-width": 1.5, "stroke-dasharray": "3,3" }, v, 2);
            }
        }
        
        // 原始的實線切割
        for(var i = 1; i < d; i++) {
            NB.mk("line", { x1: x + i*unitW, y1: y, x2: x + i*unitW, y2: y+h, stroke: "#333333", "stroke-width": 2 }, v, 3);
        }
        
        // 外框
        NB.mk("rect", { x: x, y: y, width: w, height: h, fill: "none", stroke: "#94a3b8", "stroke-width": 3, rx: 4 }, v, 4);
        
        // 標籤文字
        if (label) {
            NB.t(v, x - 30, y + h/2 + 5, label, { z: 16, c: "#ffffff", b: 1 });
        }
    }

    function draw() {
      v.innerHTML = ""; 
      var c = cases[currentCase];
      var lcm = getLcm(c.d1, c.d2);
      var m1 = lcm / c.d1;
      var m2 = lcm / c.d2;
      var val1 = c.n1 * m1;
      var val2 = c.n2 * m2;
      var sumNum = val1 + val2;
      
      var barW = 300, barH = 30, startX = 100;
      
      if (currentStep === 0) {
          // 步驟 1: 原始圖形
          drawBar(startX, 50, barW, barH, c.n1, c.d1, c.d1, "var(--p1)", c.n1+"/"+c.d1);
          drawBar(startX, 110, barW, barH, c.n2, c.d2, c.d2, "var(--p2)", c.n2+"/"+c.d2);
          
          NB.t(v, 250, 200, "格子大小不一樣，不能直接相加！", { z: 16, c: "#ff7675", b: 1 });
          eq.innerHTML = '計算：' + frac(c.n1, c.d1) + ' <span style="font-size:20px; font-weight:bold;">+</span> ' + frac(c.n2, c.d2);
          
      } else if (currentStep === 1) {
          // 步驟 2: 通分切細
          drawBar(startX, 50, barW, barH, c.n1, c.d1, lcm, "var(--p1)", val1+"/"+lcm);
          drawBar(startX, 110, barW, barH, c.n2, c.d2, lcm, "var(--p2)", val2+"/"+lcm);
          
          NB.t(v, 250, 200, "找出分母的最小公倍數 " + lcm + "，把它們切成一樣大小的格子", { z: 16, c: "#74b9ff", b: 1 });
          eq.innerHTML = '通分：' + frac(val1, lcm) + ' <span style="font-size:20px; font-weight:bold;">+</span> ' + frac(val2, lcm);
          
      } else if (currentStep === 2) {
          // 步驟 3: 合併相加
          // 第一部分
          drawBar(startX, 80, barW, barH, val1, lcm, lcm, "var(--p1)", sumNum+"/"+lcm);
          // 緊接在後面的第二部分 (平移重疊)
          var offsetW = (barW / lcm) * val1;
          NB.mk("rect", { x: startX + offsetW, y: 80, width: (barW / lcm) * val2, height: barH, fill: "var(--p2)", "fill-opacity": "0.8" }, v, 1);
          
          // 補上切割線與外框
          for(var j = 1; j < lcm; j++) {
              NB.mk("line", { x1: startX + j*(barW/lcm), y1: 80, x2: startX + j*(barW/lcm), y2: 80+barH, stroke: "#ffffff", "stroke-width": 1.5, "stroke-dasharray": "3,3" }, v, 2);
          }
          NB.mk("rect", { x: startX, y: 80, width: barW, height: barH, fill: "none", stroke: "#94a3b8", "stroke-width": 3, rx: 4 }, v, 4);
          
          NB.t(v, 250, 160, "格子一樣大，就可以直接把格子數量相加了！", { z: 16, c: "var(--p1)", b: 1 });
          eq.innerHTML = '相加：' + frac(val1, lcm) + ' <span style="font-size:20px; font-weight:bold;">+</span> ' + frac(val2, lcm) + ' = ' + frac(sumNum, lcm);
      }
    }
    draw();
  }
});