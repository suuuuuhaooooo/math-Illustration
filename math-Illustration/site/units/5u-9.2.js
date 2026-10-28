/* 五上 第九章 面積 9.2：三角形的面積 */
NB.unit({
  title: "三角形的面積",
  ref: "五上・第九章 面積・9.2 三角形的面積",
  q: "底 10 公分、高 6 公分的<span class='hl'>三角形</span>，面積是多少？",
  steps: [
    "拿兩個完全一樣的三角形，把它們拼在一起。",
    "旋轉拼起來後，會剛好變成一個「平行四邊形」。",
    "平行四邊形的面積是「底 × 高」。",
    "因為這是兩個三角形拼成的，所以一個三角形的面積要「除以 2」。",
    "三角形面積公式：底 × 高 ÷ 2 = 10 × 6 ÷ 2 = 30"
  ],
  ch: { 
    q: "底 8 公尺、高 5 公尺的三角形，面積是多少？", 
    a: "20 平方公尺", 
    h: "底 × 高 ÷ 2 = 8 × 5 ÷ 2 = 20。" 
  },
  tool: function(b, eq) {
    var stepRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var stepsText = ["1. 原本的三角形", "2. 複製另一個", "3. 旋轉拼成平行四邊形"];
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
      
      var cx = 150, cy = 180, base = 120, h = 100, topShift = 40;
      var ptA = cx + "," + cy;
      var ptB = (cx+base) + "," + cy;
      var ptC = (cx+topShift) + "," + (cy-h);
      
      // 畫高
      NB.mk("line", { x1: cx+topShift, y1: cy-h, x2: cx+topShift, y2: cy, stroke: "#ff7675", "stroke-width": 2, "stroke-dasharray": "5,5" }, v, 1);
      
      // 原本的三角形
      NB.mk("polygon", { points: ptA+" "+ptB+" "+ptC, fill: "#e0f2fe", stroke: "var(--p2)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 2);
      
      NB.t(v, cx+topShift+5, cy-h/2, "高 6", { z: 16, c: "#ff7675", b: 1 });
      NB.t(v, cx+base/2, cy+25, "底 10", { z: 18, c: "var(--p2)", b: 1 });

      if (currentStep === 0) {
          eq.innerHTML = '我們該怎麼計算這塊三角形的面積呢？';
      } else if (currentStep === 1) {
          // 複製的三角形 (先放在旁邊)
          var shiftX = 180;
          NB.mk("polygon", { points: (cx+shiftX)+","+cy+" "+(cx+base+shiftX)+","+cy+" "+(cx+topShift+shiftX)+","+(cy-h), fill: "#fce7f3", stroke: "var(--p1)", "stroke-width": 3, "stroke-linejoin": "round", "stroke-dasharray": "4,4" }, v, 2);
          eq.innerHTML = '魔法第一步：拿出一個<b>一模一樣</b>的三角形！';
      } else if (currentStep === 2) {
          // 旋轉拼上的三角形 (點C對點B，點B對點C，點A變成右上角)
          // 旋轉後的頂點：左上 C, 右下 B, 右上對應 A -> 新座標
          var ptD = (cx+base+topShift) + "," + (cy-h);
          NB.mk("polygon", { points: ptC+" "+ptB+" "+ptD, fill: "#fce7f3", stroke: "var(--p1)", "stroke-width": 3, "stroke-linejoin": "round", "stroke-dasharray": "4,4" }, v, 2);
          
          eq.innerHTML = '旋轉拼在一起後，變成我們學過的「平行四邊形」！<br>兩個三角形面積 = 底 &times; 高。<br>所以一個<b>三角形面積 = 底 &times; 高 &divide; 2</b> = 10 &times; 6 &divide; 2 = <b>30</b>';
      }
    }
    draw();
  }
});