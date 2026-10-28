/* 五上 第七章 線對稱圖形 7.2：對稱點、對稱邊和對稱角 */
NB.unit({
  title: "對稱點、對稱邊和對稱角",
  ref: "五上・第七章 線對稱圖形・7.2 對稱點、對稱邊和對稱角",
  q: "在線對稱圖形中，對摺後互相重合的部位叫作什麼？",
  steps: [
    "互相重合的點叫作「對稱點」。對稱點到對稱軸的距離相等。",
    "互相重合的邊叫作「對稱邊」。對稱邊的長度一樣長。",
    "互相重合的角叫作「對稱角」。對稱角的角度一樣大。"
  ],
  ch: { 
    q: "如果左邊的對稱角是 45 度，右邊對應的對稱角是多少度？", 
    a: "45度", 
    h: "對稱角的角度完全相等。" 
  },
  tool: function(b, eq) {
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var modes = ["找對稱點", "找對稱邊", "找對稱角"];
    var currentMode = 0;
    
    modes.forEach(function(txt, i) {
      var btn = NB.h('<button class="pen ' + (i === 0 ? 'on' : '') + '">' + txt + '</button>');
      btn.onclick = function() {
        Array.from(btnRow.children).forEach(function(el){ el.classList.remove('on'); });
        btn.classList.add('on');
        currentMode = i; draw();
      };
      btnRow.appendChild(btn);
    });
    b.appendChild(btnRow); // <--- 補上這行，按鈕才會顯示！
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 240);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    function draw() {
      v.innerHTML = ""; 
      var cx = 250, cy = 130;
      var pts = [[cx, cy-80], [cx-70, cy-30], [cx-70, cy+60], [cx+70, cy+60], [cx+70, cy-30]];
      var ptsStr = pts.map(function(p){ return p[0]+","+p[1]; }).join(" ");
      
      NB.mk("polygon", { points: ptsStr, fill: "#f8fafc", stroke: "#cbd5e1", "stroke-width": 4, "stroke-linejoin": "round" }, v, 1);
      NB.mk("line", { x1: cx, y1: cy-100, x2: cx, y2: cy+80, stroke: "#ff7675", "stroke-width": 3, "stroke-dasharray": "6,4" }, v, 2);

      if (currentMode === 0) {
         NB.mk("circle", { cx: pts[1][0], cy: pts[1][1], r: 8, fill: "var(--p1)" }, v, 3);
         NB.t(v, pts[1][0]-20, pts[1][1]+5, "A", { z: 18, c: "var(--p1)", b: 1 });
         NB.mk("circle", { cx: pts[4][0], cy: pts[4][1], r: 8, fill: "var(--p2)" }, v, 3);
         NB.t(v, pts[4][0]+20, pts[4][1]+5, "A'", { z: 18, c: "var(--p2)", b: 1 });
         NB.mk("line", { x1: pts[1][0], y1: pts[1][1], x2: pts[4][0], y2: pts[4][1], stroke: "#94a3b8", "stroke-width": 2, "stroke-dasharray": "4,4" }, v, 2);
         eq.innerHTML = '點 A 和點 A\' 摺疊後會重合，是<b style="color:var(--p1)">對稱點</b>。<br>它們到紅色對稱軸的「距離會完全一樣」！';
      } else if (currentMode === 1) {
         NB.mk("line", { x1: pts[1][0], y1: pts[1][1], x2: pts[2][0], y2: pts[2][1], stroke: "var(--p1)", "stroke-width": 8, "stroke-linecap": "round" }, v, 3);
         NB.mk("line", { x1: pts[4][0], y1: pts[4][1], x2: pts[3][0], y2: pts[3][1], stroke: "var(--p2)", "stroke-width": 8, "stroke-linecap": "round" }, v, 3);
         eq.innerHTML = '左邊的牆壁和右邊的牆壁是<b style="color:var(--p1)">對稱邊</b>。<br>對稱邊的「長度完全一樣長」！';
      } else if (currentMode === 2) {
         NB.mk("path", { d: "M" + (pts[2][0]+20) + " " + pts[2][1] + " A 20 20 0 0 0 " + pts[2][0] + " " + (pts[2][1]-20), fill: "var(--p1)", "fill-opacity":"0.5", stroke:"var(--p1)", "stroke-width":3 }, v, 3);
         NB.mk("path", { d: "M" + pts[3][0] + " " + (pts[3][1]-20) + " A 20 20 0 0 0 " + (pts[3][0]-20) + " " + pts[3][1], fill: "var(--p2)", "fill-opacity":"0.5", stroke:"var(--p2)", "stroke-width":3 }, v, 3);
         eq.innerHTML = '左下角和右下角是<b style="color:var(--p1)">對稱角</b>。<br>對稱角的「角度完全一樣大」！';
      }
    }
    draw();
  }
});
