/* 五上 第九章 面積 9.3：梯形的面積 */
NB.unit({
  title: "梯形的面積",
  ref: "五上・第九章 面積・9.3 梯形的面積",
  q: "上底 4 公分、下底 8 公分、高 5 公分的<span class='hl'>梯形</span>，面積是多少？",
  steps: [
    "拿兩個完全一樣的梯形，把它們上下顛倒拼在一起。",
    "會剛好拼成一個大的「平行四邊形」。",
    "這個平行四邊形的底是「上底 + 下底」，高就是原本的高。",
    "因為是兩個梯形拼成的，所以算出來的面積要「除以 2」。",
    "梯形面積公式：(上底 + 下底) × 高 ÷ 2 = (4 + 8) × 5 ÷ 2 = 30"
  ],
  ch: { 
    q: "上底 5、下底 7、高 4 的梯形面積是多少？", 
    a: "24", 
    h: "(5 + 7) × 4 ÷ 2 = 24。" 
  },
  tool: function(b, eq) {
    var stepRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var stepsText = ["1. 原本的梯形", "2. 複製並顛倒", "3. 拼成平行四邊形"];
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
      
      var cx = 100, cy = 180, topBase = 60, bottomBase = 120, h = 90, topShift = 30;
      var ptA = cx + "," + cy; // 左下
      var ptB = (cx+bottomBase) + "," + cy; // 右下
      var ptC = (cx+topShift+topBase) + "," + (cy-h); // 右上
      var ptD = (cx+topShift) + "," + (cy-h); // 左上
      
      // 原本的梯形
      NB.mk("polygon", { points: ptA+" "+ptB+" "+ptC+" "+ptD, fill: "#e0f2fe", stroke: "var(--p2)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 2);
      
      // 標示
      NB.mk("line", { x1: cx+topShift, y1: cy-h, x2: cx+topShift, y2: cy, stroke: "#ff7675", "stroke-width": 2, "stroke-dasharray": "5,5" }, v, 1);
      NB.t(v, cx+topShift+5, cy-h/2, "高 5", { z: 16, c: "#ff7675", b: 1 });
      NB.t(v, cx+topShift+topBase/2, cy-h-10, "上底 4", { z: 16, c: "var(--p2)", b: 1 });
      NB.t(v, cx+bottomBase/2, cy+25, "下底 8", { z: 16, c: "var(--p2)", b: 1 });

      if (currentStep === 0) {
          eq.innerHTML = '梯形看起來很複雜，但只要用「拼湊魔法」也能輕鬆解決！';
      } else if (currentStep === 1) {
          // 複製的梯形 (顛倒放在旁邊)
          var shiftX = 220;
          var nA = (cx+shiftX+bottomBase) + "," + (cy-h);
          var nB = (cx+shiftX) + "," + (cy-h);
          var nC = (cx+shiftX+bottomBase-topShift-topBase) + "," + cy;
          var nD = (cx+shiftX+bottomBase-topShift) + "," + cy;
          
          NB.mk("polygon", { points: nA+" "+nB+" "+nC+" "+nD, fill: "#fce7f3", stroke: "var(--p1)", "stroke-width": 3, "stroke-linejoin": "round", "stroke-dasharray": "4,4" }, v, 2);
          eq.innerHTML = '複製一個一模一樣的梯形，並且把它<b>上下顛倒</b>！';
          
      } else if (currentStep === 2) {
          // 拼上去的梯形
          var nA = (cx+bottomBase+topBase) + "," + cy;
          var nB = (cx+bottomBase) + "," + cy;
          var nC = (cx+topShift) + "," + (cy-h);
          var nD = (cx+topShift+topBase) + "," + (cy-h);
          // 修正拼合邏輯，顛倒後的梯形貼在右邊
          var pA = ptB; // 左下貼原本的右下
          var pB = (cx+bottomBase+topBase) + "," + cy; // 往右延伸上底的長度
          var pC = (cx+topShift+topBase+bottomBase) + "," + (cy-h); // 右上
          var pD = ptC; // 左上貼原本的右上
          
          NB.mk("polygon", { points: pA+" "+pB+" "+pC+" "+pD, fill: "#fce7f3", stroke: "var(--p1)", "stroke-width": 3, "stroke-linejoin": "round", "stroke-dasharray": "4,4" }, v, 2);
          
          // 標示新的底
          NB.mk("path", { d: "M" + cx + " " + (cy+40) + " Q " + (cx+(bottomBase+topBase)/2) + " " + (cy+60) + " " + (cx+bottomBase+topBase) + " " + (cy+40), fill: "none", stroke: "var(--p1)", "stroke-width": 2 }, v, 3);
          NB.t(v, cx+(bottomBase+topBase)/2, cy+75, "新底 = 上底(4) + 下底(8) = 12", { z: 16, c: "var(--p1)", b: 1 });
          
          eq.innerHTML = '拼成平行四邊形了！新平行四邊形的底是「上底 + 下底」。<br><b>梯形面積 = (上底 + 下底) &times; 高 &divide; 2</b> = (4 + 8) &times; 5 &divide; 2 = <b>30</b>';
      }
    }
    draw();
  }
});