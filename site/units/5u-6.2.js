/* 五上 第六章 異分母分數的加減 6.2：異分母分數的減法 */
NB.unit({
  title: "異分母分數的減法",
  ref: "五上・第六章 異分母分數的加減・6.2 異分母分數的減法",
  q: "計算 <span class='hl'>2/3 - 1/4</span> = ？",
  steps: [
    "減法和加法一樣，分母不同就不能直接計算。",
    "先找出 3 和 4 的最小公倍數 12 來通分。",
    "2/3 擴分為 8/12，1/4 擴分為 3/12。",
    "分母相同後，分子直接相減：8 - 3 = 5。",
    "所以答案是 5/12。"
  ],
  ch: { 
    q: "3/4 - 1/6 = ？", 
    a: "7/12", 
    h: "通分為 9/12 - 2/12 = 7/12。" 
  },
  tool: function(b, eq) {
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var cases = [
      { n1: 2, d1: 3, n2: 1, d2: 4 }, // 2/3 - 1/4
      { n1: 3, d1: 4, n2: 1, d2: 6 }, // 3/4 - 1/6
      { n1: 4, d1: 5, n2: 1, d2: 2 }  // 4/5 - 1/2
    ];
    var currentCase = 0;
    
    var stepRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center; padding-top:10px; border-top:1px dashed #ccc;"></div>');
    var currentStep = 0;
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    
    var v = NB.svg(st, 500, 240);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    cases.forEach(function(c, i) {
      var btn = NB.h('<button class="pen ' + (i === 0 ? 'on' : '') + '">' + c.n1 + '/' + c.d1 + ' - ' + c.n2 + '/' + c.d2 + '</button>');
      btn.onclick = function() {
        Array.from(btnRow.children).forEach(function(el){ el.classList.remove('on'); });
        btn.classList.add('on');
        currentCase = i; currentStep = 0;
        updateStepBtns(); draw();
      };
      btnRow.appendChild(btn);
    });
    b.appendChild(btnRow);
    b.appendChild(stepRow);

    var stepsText = ["1. 原始圖形", "2. 通分切細", "3. 重疊相減"];
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

    function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
    function getLcm(x, y) { return (x * y) / gcd(x, y); }
    function frac(num, den) {
      return '<div style="display:inline-block; vertical-align:middle; text-align:center; margin:0 5px; line-height:1.2; font-family:monospace; font-size:20px; font-weight:bold;">' +
             '<div style="border-bottom:2px solid currentColor; padding:0 5px;">' + num + '</div>' +
             '<div style="padding:0 5px;">' + den + '</div></div>';
    }

    function drawBar(x, y, w, h, n, d, targetD, color, label) {
        var unitW = w / d;
        NB.mk("rect", { x: x, y: y, width: unitW * n, height: h, fill: color, "fill-opacity": "0.8" }, v, 1);
        
        if (targetD > d && currentStep >= 1) {
            var targetUnitW = w / targetD;
            for(var j = 1; j < targetD; j++) {
                NB.mk("line", { x1: x + j*targetUnitW, y1: y, x2: x + j*targetUnitW, y2: y+h, stroke: "#ffffff", "stroke-width": 1.5, "stroke-dasharray": "3,3" }, v, 2);
            }
        }
        for(var i = 1; i < d; i++) {
            NB.mk("line", { x1: x + i*unitW, y1: y, x2: x + i*unitW, y2: y+h, stroke: "#333333", "stroke-width": 2 }, v, 3);
        }
        NB.mk("rect", { x: x, y: y, width: w, height: h, fill: "none", stroke: "#94a3b8", "stroke-width": 3, rx: 4 }, v, 4);
        if (label) NB.t(v, x - 30, y + h/2 + 5, label, { z: 16, c: "#ffffff", b: 1 });
    }

    function draw() {
      v.innerHTML = ""; 
      var c = cases[currentCase];
      var lcm = getLcm(c.d1, c.d2);
      var m1 = lcm / c.d1;
      var m2 = lcm / c.d2;
      var val1 = c.n1 * m1;
      var val2 = c.n2 * m2;
      var diffNum = val1 - val2;
      
      var barW = 300, barH = 30, startX = 100;
      
      if (currentStep === 0) {
          drawBar(startX, 50, barW, barH, c.n1, c.d1, c.d1, "var(--p1)", c.n1+"/"+c.d1);
          drawBar(startX, 110, barW, barH, c.n2, c.d2, c.d2, "#ff7675", "- "+c.n2+"/"+c.d2);
          NB.t(v, 250, 200, "一樣要先通分，才能準確減掉！", { z: 16, c: "#ff7675", b: 1 });
          eq.innerHTML = '計算：' + frac(c.n1, c.d1) + ' <span style="font-size:20px; font-weight:bold;">−</span> ' + frac(c.n2, c.d2);
      } else if (currentStep === 1) {
          drawBar(startX, 50, barW, barH, c.n1, c.d1, lcm, "var(--p1)", val1+"/"+lcm);
          drawBar(startX, 110, barW, barH, c.n2, c.d2, lcm, "#ff7675", "- "+val2+"/"+lcm);
          NB.t(v, 250, 200, "通分變成相同大小的格子了", { z: 16, c: "#74b9ff", b: 1 });
          eq.innerHTML = '通分：' + frac(val1, lcm) + ' <span style="font-size:20px; font-weight:bold;">−</span> ' + frac(val2, lcm);
      } else if (currentStep === 2) {
          // 減法合併呈現：先畫出原本的長度
          drawBar(startX, 80, barW, barH, val1, lcm, lcm, "var(--p1)", diffNum+"/"+lcm);
          
          // 畫出被減掉的部分 (用深灰色遮罩蓋掉後方)
          var remainW = (barW / lcm) * diffNum;
          var subW = (barW / lcm) * val2;
          NB.mk("rect", { x: startX + remainW, y: 78, width: subW, height: barH+4, fill: "#333333", "fill-opacity": "0.9" }, v, 5);
          
          // 在被減掉的部分打個紅色大叉
          var midX = startX + remainW + subW/2;
          NB.mk("path", { d: "M" + (midX-10) + " 85 L" + (midX+10) + " 105 M" + (midX+10) + " 85 L" + (midX-10) + " 105", stroke: "#ff7675", "stroke-width": 4, "stroke-linecap": "round" }, v, 6);

          NB.t(v, 250, 160, "從 " + val1 + " 格中拿走 " + val2 + " 格，剩下 " + diffNum + " 格！", { z: 16, c: "var(--p1)", b: 1 });
          eq.innerHTML = '相減：' + frac(val1, lcm) + ' <span style="font-size:20px; font-weight:bold;">−</span> ' + frac(val2, lcm) + ' = ' + frac(diffNum, lcm);
      }
    }
    draw();
  }
});