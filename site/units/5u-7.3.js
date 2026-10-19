/* 五上 第七章 線對稱圖形 7.3：繪製線對稱圖形 */
NB.unit({
  title: "繪製線對稱圖形",
  ref: "五上・第七章 線對稱圖形・7.3 繪製線對稱圖形",
  q: "在方格紙上，如何畫出線對稱圖形的另一半？",
  steps: [
    "1. 先找出原本圖形上的重要「頂點」。",
    "2. 算一算這個頂點距離「對稱軸」有幾格。",
    "3. 在對稱軸的另一邊，數出一樣多的格子，點上「對稱點」。",
    "4. 依序把找出來的對稱點用直線連起來，就完成了！"
  ],
  ch: { 
    q: "如果頂點 A 距離對稱軸往左 3 格，它的對稱點在哪裡？", 
    a: "對稱軸往右 3 格", 
    h: "距離相等，方向相反。" 
  },
  tool: function(b, eq) {
    var stepRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var stepsText = ["1. 原本的半邊", "2. 算格子找對稱點", "3. 連線完成圖形"];
    var currentStep = 0;
    
    var stepBtns = [];
    stepsText.forEach(function(txt, i) {
      var btn = NB.h('<button class="pen ' + (i === 0 ? 'on' : '') + '" style="background:' + (i===0?'#e2e8f0':'') + '">' + txt + '</button>');
      btn.onclick = function() { currentStep = i; updateStepBtns(); draw(); };
      stepBtns.push(btn);
      stepRow.appendChild(btn);
    });
    b.appendChild(stepRow); // <--- 補上這行，步驟按鈕才會顯示！

    function updateStepBtns() {
      stepBtns.forEach(function(btn, i) {
        btn.classList.toggle('on', i === currentStep);
        btn.style.background = (i === currentStep) ? "var(--p1)" : "";
        btn.style.color = (i === currentStep) ? "white" : "";
      });
    }
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    function draw() {
      v.innerHTML = ""; 
      var gridSize = 25;
      var cols = 20, rows = 10;
      
      for(var i=0; i<=cols; i++) NB.mk("line", { x1: i*gridSize, y1: 0, x2: i*gridSize, y2: rows*gridSize, stroke: "#e2e8f0", "stroke-width": 1 }, v, 1);
      for(var j=0; j<=rows; j++) NB.mk("line", { x1: 0, y1: j*gridSize, x2: cols*gridSize, y2: j*gridSize, stroke: "#e2e8f0", "stroke-width": 1 }, v, 1);
      
      var cx = 10 * gridSize; 
      NB.mk("line", { x1: cx, y1: 0, x2: cx, y2: rows*gridSize, stroke: "#ff7675", "stroke-width": 3, "stroke-dasharray": "8,6" }, v, 2);

      var ptsData = [{x: 0, y: 2}, {x: -4, y: 4}, {x: -2, y: 5}, {x: -5, y: 8}, {x: 0, y: 8}];
      var leftPtsStr = ptsData.map(function(p){ return (cx + p.x*gridSize) + "," + (p.y*gridSize); }).join(" ");
      var rightPtsStr = ptsData.map(function(p){ return (cx - p.x*gridSize) + "," + (p.y*gridSize); }).join(" ");

      NB.mk("polyline", { points: leftPtsStr, fill: "none", stroke: "var(--p2)", "stroke-width": 4, "stroke-linejoin": "round" }, v, 3);
      ptsData.forEach(function(p) { NB.mk("circle", { cx: cx + p.x*gridSize, cy: p.y*gridSize, r: 5, fill: "var(--p2)" }, v, 4); });

      if (currentStep === 0) {
          eq.innerHTML = '這是一個只有一半的圖形，請觀察左邊的頂點，準備找出右邊的對稱點。';
      } else if (currentStep === 1) {
          ptsData.forEach(function(p) {
              if (p.x !== 0) {
                  var lx = cx + p.x*gridSize, rx = cx - p.x*gridSize, py = p.y*gridSize;
                  NB.mk("line", { x1: lx, y1: py, x2: rx, y2: py, stroke: "var(--p1)", "stroke-width": 2, "stroke-dasharray": "4,4" }, v, 5);
                  NB.t(v, cx + (p.x*gridSize)/2, py - 6, Math.abs(p.x)+"格", { z: 12, c: "var(--p1)", b: 1 });
                  NB.t(v, cx - (p.x*gridSize)/2, py - 6, Math.abs(p.x)+"格", { z: 12, c: "var(--p1)", b: 1 });
                  NB.mk("circle", { cx: rx, cy: py, r: 6, fill: "var(--p1)" }, v, 6);
              }
          });
          eq.innerHTML = '從頂點往紅色對稱軸數，看距離幾格；<br>就在另一邊數出一樣的格數，點上<b style="color:var(--p1)">對稱點</b>。';
      } else if (currentStep === 2) {
          NB.mk("polyline", { points: rightPtsStr, fill: "none", stroke: "var(--p1)", "stroke-width": 4, "stroke-linejoin": "round" }, v, 3);
          var fullPoly = leftPtsStr + " " + ptsData.slice().reverse().map(function(p){ return (cx - p.x*gridSize) + "," + (p.y*gridSize); }).join(" ");
          NB.mk("polygon", { points: fullPoly, fill: "var(--p1)", "fill-opacity": "0.1", stroke: "none" }, v, 2);
          eq.innerHTML = '按照順序把剛才找出來的對稱點連起來，<br>一個完整的線對稱圖形就大功告成了！';
      }
    }
    draw();
  }
});
