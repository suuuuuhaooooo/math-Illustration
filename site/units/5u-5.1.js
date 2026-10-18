/* 五上 第五章 多邊形與扇形 5.1：多邊形 */
NB.unit({
  title: "多邊形",
  ref: "五上・第五章 多邊形與扇形・5.1 多邊形",
  q: "下列哪一個圖形是「<span class='hl'>多邊形</span>」？",
  steps: [
    "多邊形必須滿足兩個條件：",
    "1. 全部的邊都是「直線」。",
    "2. 圖形必須是「封閉」的（沒有缺口）。",
    "如果邊長全部一樣長，而且內角全部一樣大，就稱為「正多邊形」。"
  ],
  ch: { 
    q: "一個圖形有 5 條直線，但有一個小缺口沒有連起來，它是多邊形嗎？", 
    a: "不是", 
    h: "多邊形必須是封閉圖形。" 
  },
  tool: function(b, eq) {
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var cases = [
      { name: "正五邊形", type: "polygon", isRegular: true },
      { name: "不規則五邊形", type: "polygon", isRegular: false },
      { name: "有缺口的圖形", type: "open", isRegular: false },
      { name: "有曲線的圖形", type: "curve", isRegular: false }
    ];
    var currentCase = 0;
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 220);

    cases.forEach(function(c, i) {
      var btn = NB.h('<button class="pen ' + (i === 0 ? 'on' : '') + '">' + c.name + '</button>');
      btn.onclick = function() {
        Array.from(btnRow.children).forEach(function(el){ el.classList.remove('on'); });
        btn.classList.add('on');
        currentCase = i;
        draw();
      };
      btnRow.appendChild(btn);
    });
    b.appendChild(btnRow);

    // 手工 SVG 打勾與打叉函數 (取代 Emoji)
    function drawIcon(isOK, x, y) {
        if (isOK) {
            NB.mk("circle", { cx: x, cy: y, r: 12, fill: "var(--p1)" }, v, 5);
            NB.mk("path", { d: "M" + (x-5) + " " + y + " L" + (x-1) + " " + (y+5) + " L" + (x+6) + " " + (y-4), stroke: "white", "stroke-width": 3, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, v, 6);
        } else {
            NB.mk("circle", { cx: x, cy: y, r: 12, fill: "#e91e63" }, v, 5);
            NB.mk("path", { d: "M" + (x-4) + " " + (y-4) + " L" + (x+4) + " " + (y+4) + " M" + (x+4) + " " + (y-4) + " L" + (x-4) + " " + (y+4), stroke: "white", "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, v, 6);
        }
    }

    function draw() {
      v.innerHTML = ""; 
      var c = cases[currentCase];
      var cx = 250, cy = 110;
      
      var pathD = "";
      if (c.type === "polygon" && c.isRegular) {
         // 正五邊形
         var pts = [];
         for(var i=0; i<5; i++){ pts.push((cx + 80 * Math.cos(-Math.PI/2 + i*2*Math.PI/5)) + "," + (cy + 80 * Math.sin(-Math.PI/2 + i*2*Math.PI/5))); }
         pathD = "M" + pts.join("L") + "Z";
      } else if (c.type === "polygon" && !c.isRegular) {
         // 不規則五邊形
         pathD = "M" + cx + " " + (cy-80) + " L" + (cx+90) + " " + (cy-20) + " L" + (cx+40) + " " + (cy+80) + " L" + (cx-60) + " " + (cy+70) + " L" + (cx-80) + " " + (cy-10) + " Z";
      } else if (c.type === "open") {
         // 有缺口
         pathD = "M" + (cx-50) + " " + (cy-60) + " L" + (cx+50) + " " + (cy-60) + " L" + (cx+70) + " " + (cy+60) + " L" + (cx-70) + " " + (cy+60); // 不加 Z 就不會封閉
      } else if (c.type === "curve") {
         // 有曲線
         pathD = "M" + cx + " " + (cy-80) + " L" + (cx+70) + " " + (cy+60) + " Q" + cx + " " + (cy+100) + " " + (cx-70) + " " + (cy+60) + " Z";
      }

      NB.mk("path", { 
          d: pathD, 
          fill: c.type === "open" ? "none" : "#f0f8ff", 
          stroke: "var(--p2)", 
          "stroke-width": 4, 
          "stroke-linejoin": "round" 
      }, v, 2);

      var isPolygon = (c.type === "polygon");
      drawIcon(isPolygon, cx - 60, cy + 85);
      NB.t(v, cx, cy + 90, isPolygon ? "是多邊形" : "不是多邊形", { z: 20, c: isPolygon ? "var(--p1)" : "#e91e63", b: 1 });

      if (isPolygon) {
          eq.innerHTML = c.isRegular ? '它是<b>封閉</b>的，全部由<b>直線</b>組成，而且邊長和角都相等，所以是<b style="color:var(--p1)">正多邊形</b>！' : '它是<b>封閉</b>的，且全部由<b>直線</b>組成，所以是多邊形。但邊長沒有全部一樣，所以不加「正」字。';
      } else {
          eq.innerHTML = c.type === "open" ? '這個圖形有<b>缺口</b>（沒有封閉），所以<b style="color:#e91e63">不是</b>多邊形！' : '這個圖形的底部有一條<b>曲線</b>，多邊形必須全部都是直線，所以它<b style="color:#e91e63">不是</b>多邊形！';
      }
    }
    draw();
  }
});