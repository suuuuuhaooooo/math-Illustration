/* 五上 第九章 面積 9.1：平行四邊形的面積 */
NB.unit({
  title: "平行四邊形的面積",
  ref: "五上・第九章 面積・9.1 平行四邊形的面積",
  q: "底 15 公分、高 8 公分的<span class='hl'>平行四邊形</span>，面積是多少？",
  steps: [
    "我們已經學過長方形的面積是「長 × 寬」。",
    "把平行四邊形左邊多出來的「直角三角形」切下來。",
    "平移補到右邊的缺口，剛好可以拼成一個「長方形」。",
    "這個長方形的「長」就是原本的「底」，「寬」就是原本的「高」。",
    "所以平行四邊形面積公式：底 × 高 = 15 × 8 = 120"
  ],
  ch: { 
    q: "底 20 公尺、高 5 公尺的平行四邊形，面積是多少？", 
    a: "100 平方公尺", 
    h: "公式：底 × 高 = 20 × 5 = 100。" 
  },
  tool: function(b, eq) {
    var stepRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var stepsText = ["1. 原本的平行四邊形", "2. 切下左邊的三角形", "3. 平移補到右邊"];
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
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    function draw() {
      v.innerHTML = ""; 
      
      var base = 160, h = 100, shift = 60;
      var leftBottom = 140, topY = 70, bottomY = topY + h;
      var rightBottom = leftBottom + base;
      
      if (currentStep === 0) {
          // 畫完整的平行四邊形
          NB.mk("polygon", { points: leftBottom+","+bottomY+" "+rightBottom+","+bottomY+" "+(rightBottom+shift)+","+topY+" "+(leftBottom+shift)+","+topY, fill: "#e0f2fe", stroke: "var(--p2)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 1);
          // 標示底和高
          NB.mk("line", { x1: leftBottom+shift, y1: topY, x2: leftBottom+shift, y2: bottomY, stroke: "#ff7675", "stroke-width": 2, "stroke-dasharray": "5,5" }, v, 2);
          NB.t(v, leftBottom+shift+15, topY + h/2 + 5, "高 8", { z: 16, c: "#ff7675", b: 1 });
          NB.t(v, leftBottom + base/2, bottomY + 25, "底 15", { z: 18, c: "var(--p2)", b: 1 });
          
          eq.innerHTML = '沒學過平行四邊形的面積怎麼算？<br>別怕，試著把它「變形」成我們學過的圖形！';
          
      } else if (currentStep === 1) {
          // 畫中間的剩餘部分
          NB.mk("polygon", { points: (leftBottom+shift)+","+bottomY+" "+rightBottom+","+bottomY+" "+(rightBottom+shift)+","+topY+" "+(leftBottom+shift)+","+topY, fill: "#e0f2fe", stroke: "var(--p2)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 1);
          // 切下來的三角形 (往左上方稍微拉開一點表示切開)
          NB.mk("polygon", { points: (leftBottom-10)+","+(bottomY-5)+" "+(leftBottom+shift-10)+","+(bottomY-5)+" "+(leftBottom+shift-10)+","+(topY-5), fill: "var(--p1)", "fill-opacity": "0.3", stroke: "var(--p1)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 2);
          
          eq.innerHTML = '沿著高，把左邊多出來的「直角三角形」切下來。';
          
      } else if (currentStep === 2) {
          // 畫中間的剩餘部分
          NB.mk("polygon", { points: (leftBottom+shift)+","+bottomY+" "+rightBottom+","+bottomY+" "+(rightBottom+shift)+","+topY+" "+(leftBottom+shift)+","+topY, fill: "#e0f2fe", stroke: "var(--p2)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 1);
          // 補到右邊的三角形
          NB.mk("polygon", { points: rightBottom+","+bottomY+" "+(rightBottom+shift)+","+bottomY+" "+(rightBottom+shift)+","+topY, fill: "var(--p1)", "fill-opacity": "0.3", stroke: "var(--p1)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 2);
          
          // 標示新長方形的長與寬
          NB.t(v, rightBottom+shift+35, topY + h/2 + 5, "寬 8", { z: 16, c: "#ff7675", b: 1 });
          NB.t(v, leftBottom+shift + base/2, bottomY + 25, "長 15", { z: 18, c: "var(--p2)", b: 1 });
          
          eq.innerHTML = '拼成一個長方形了！原本的底變成「長」，原本的高變成「寬」。<br>平行四邊形面積 = 長方形面積 = <b>底 &times; 高</b> = 15 &times; 8 = <b>120</b>';
      }
    }
    draw();
  }
});