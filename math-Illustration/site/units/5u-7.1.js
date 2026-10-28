/* 五上 第七章 線對稱圖形 7.1：認識線對稱圖形 */
NB.unit({
  title: "認識線對稱圖形",
  ref: "五上・第七章 線對稱圖形・7.1 認識線對稱圖形",
  q: "下列哪一個圖形是「<span class='hl'>線對稱圖形</span>」？",
  steps: [
    "如果一個圖形沿著一條直線對摺，兩邊能「完全重合」，就是線對稱圖形。",
    "這條摺線就稱為「對稱軸」。",
    "有些圖形只有 1 條對稱軸，有些有 2 條以上。",
    "如果怎麼摺都無法完全重疊，它就不是線對稱圖形。"
  ],
  ch: { 
    q: "正方形是不是線對稱圖形？有幾條對稱軸？", 
    a: "是，4條", 
    h: "上下、左右、兩條對角線都能對摺重合。" 
  },
  tool: function(b, eq) {
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var cases = [
      { name: "等腰三角形", type: "iso-tri", isSym: true, axes: 1 },
      { name: "長方形", type: "rect", isSym: true, axes: 2 },
      { name: "平行四邊形", type: "para", isSym: false, axes: 0 }
    ];
    var currentCase = 0;
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    cases.forEach(function(c, i) {
      var btn = NB.h('<button class="pen ' + (i === 0 ? 'on' : '') + '">' + c.name + '</button>');
      btn.onclick = function() {
        Array.from(btnRow.children).forEach(function(el){ el.classList.remove('on'); });
        btn.classList.add('on');
        currentCase = i; draw();
      };
      btnRow.appendChild(btn);
    });

    // 移除 <g> 標籤，直接在主畫布 v 上使用絕對座標，避免繼承到異常的邊框樣式
    function drawVerdict(isOK, text, cx, cy) {
        if (isOK) {
            NB.mk("circle", { cx: cx - 60, cy: cy, r: 12, fill: "var(--p1)" }, v, 3);
            NB.mk("path", { d: "M " + (cx - 65) + " " + cy + " L " + (cx - 62) + " " + (cy + 4) + " L " + (cx - 55) + " " + (cy - 4), stroke: "white", "stroke-width": 3, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, v, 4);
            NB.t(v, cx - 40, cy + 6, text, { z: 18, c: "var(--p1)", b: 1 });
        } else {
            NB.mk("circle", { cx: cx - 70, cy: cy, r: 12, fill: "#e91e63" }, v, 3);
            NB.mk("path", { d: "M " + (cx - 76) + " " + (cy - 4) + " L " + (cx - 64) + " " + (cy + 4) + " M " + (cx - 64) + " " + (cy - 4) + " L " + (cx - 76) + " " + (cy + 4), stroke: "white", "stroke-width": 3, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, v, 4);
            NB.t(v, cx - 50, cy + 6, text, { z: 18, c: "#e91e63", b: 1 });
        }
    }

    function draw() {
      v.innerHTML = ""; 
      var c = cases[currentCase];
      var cx = 250, cy = 110; 
      
      if (c.type === "iso-tri") {
         NB.mk("polygon", { points: cx+","+(cy-70)+" "+(cx-60)+","+(cy+60)+" "+(cx+60)+","+(cy+60), fill: "#f0f8ff", stroke: "var(--p2)", "stroke-width": 4, "stroke-linejoin": "round" }, v, 1);
         NB.mk("line", { x1: cx, y1: cy-85, x2: cx, y2: cy+75, stroke: "#ff7675", "stroke-width": 3, "stroke-dasharray": "8,6" }, v, 2);
      } else if (c.type === "rect") {
         NB.mk("rect", { x: cx-80, y: cy-50, width: 160, height: 100, fill: "#f0f8ff", stroke: "var(--p2)", "stroke-width": 4, "stroke-linejoin": "round" }, v, 1);
         NB.mk("line", { x1: cx, y1: cy-65, x2: cx, y2: cy+65, stroke: "#ff7675", "stroke-width": 3, "stroke-dasharray": "8,6" }, v, 2);
         NB.mk("line", { x1: cx-95, y1: cy, x2: cx+95, y2: cy, stroke: "#ff7675", "stroke-width": 3, "stroke-dasharray": "8,6" }, v, 2);
      } else if (c.type === "para") {
         NB.mk("polygon", { points: (cx-50)+","+(cy-50)+" "+(cx+80)+","+(cy-50)+" "+(cx+50)+","+(cy+50)+" "+(cx-80)+","+(cy+50), fill: "#f0f8ff", stroke: "var(--p2)", "stroke-width": 4, "stroke-linejoin": "round" }, v, 1);
         NB.mk("line", { x1: cx-90, y1: cy+60, x2: cx+90, y2: cy-60, stroke: "#ccc", "stroke-width": 2, "stroke-dasharray": "4,4" }, v, 2);
         NB.t(v, cx, cy+10, "對角摺疊無法重合！", { z: 14, c: "#999", b: 1 });
      }

      drawVerdict(c.isSym, c.isSym ? "是線對稱圖形" : "不是線對稱圖形", cx, 215);

      if (c.isSym) {
          eq.innerHTML = '沿著紅色的虛線（對稱軸）對摺，兩邊可以完全重合！<br>這個圖形有 <b style="color:#ff7675">' + c.axes + '</b> 條對稱軸。';
      } else {
          eq.innerHTML = '平行四邊形無論怎麼摺，頂點都無法完美重疊在一起，所以它<b style="color:#e91e63">不是</b>線對稱圖形。';
      }
    }
    draw();
  }
});
