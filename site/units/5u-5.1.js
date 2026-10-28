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
    
    // 將 SVG 畫布高度稍微拉高，把判定標示放進 SVG 內，並套用標準無襯線字體
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

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

    // 在 SVG 內部繪製打勾與打叉圖示 + 判定文字
    function drawVerdict(isOK, text, cx, cy) {
        // 群組容器置中
        var g = NB.mk("g", { transform: "translate(" + cx + "," + cy + ")" }, v, 5);
        
        if (isOK) {
            NB.mk("circle", { cx: -55, cy: 0, r: 12, fill: "var(--p1)" }, g, 6);
            NB.mk("path", { d: "M -60 0 L -57 4 L -50 -4", stroke: "white", "stroke-width": 3, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, g, 7);
            NB.t(g, -35, 6, text, { z: 18, c: "var(--p1)", b: 1 });
        } else {
            NB.mk("circle", { cx: -65, cy: 0, r: 12, fill: "#e91e63" }, g, 6);
            NB.mk("path", { d: "M -71 -4 L -59 4 M -59 -4 L -71 4", stroke: "white", "stroke-width": 3, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, g, 7);
            NB.t(g, -45, 6, text, { z: 18, c: "#e91e63", b: 1 });
        }
    }

    function draw() {
      v.innerHTML = ""; 
      var c = cases[currentCase];
      var cx = 250, cy = 95; // 圖形中心往上移一點，空出下方給判定結果
      
      var pathD = "";
      if (c.type === "polygon" && c.isRegular) {
         var pts = [];
         for(var i=0; i<5; i++){ pts.push((cx + 75 * Math.cos(-Math.PI/2 + i*2*Math.PI/5)) + "," + (cy + 75 * Math.sin(-Math.PI/2 + i*2*Math.PI/5))); }
         pathD = "M" + pts.join("L") + "Z";
      } else if (c.type === "polygon" && !c.isRegular) {
         pathD = "M" + cx + " " + (cy-75) + " L" + (cx+85) + " " + (cy-15) + " L" + (cx+35) + " " + (cy+75) + " L" + (cx-55) + " " + (cy+65) + " L" + (cx-75) + " " + (cy-10) + " Z";
      } else if (c.type === "open") {
         pathD = "M" + (cx-50) + " " + (cy-55) + " L" + (cx+50) + " " + (cy-55) + " L" + (cx+65) + " " + (cy+55) + " L" + (cx-65) + " " + (cy+55);
      } else if (c.type === "curve") {
         pathD = "M" + cx + " " + (cy-75) + " L" + (cx+65) + " " + (cy+55) + " Q" + cx + " " + (cy+95) + " " + (cx-65) + " " + (cy+55) + " Z";
      }

      NB.mk("path", { 
          d: pathD, 
          fill: c.type === "open" ? "none" : "#f0f8ff", 
          stroke: "var(--p2)", 
          "stroke-width": 4, 
          "stroke-linejoin": "round" 
      }, v, 2);

      var isPolygon = (c.type === "polygon");
      // 把判定結果畫在 SVG 內部的下方 (y = 210)
      drawVerdict(isPolygon, isPolygon ? "是多邊形" : "不是多邊形", cx, 215);

      if (isPolygon) {
          eq.innerHTML = c.isRegular ? '它是<b>封閉</b>的，全部由<b>直線</b>組成，而且邊長和角都相等，所以是<b style="color:var(--p1)">正多邊形</b>！' : '它是<b>封閉</b>的，且全部由<b>直線</b>組成，所以是多邊形。但邊長沒有全部一樣，所以不加「正」字。';
      } else {
          eq.innerHTML = c.type === "open" ? '這個圖形有<b>缺口</b>（沒有封閉），所以<b style="color:#e91e63">不是</b>多邊形！' : '這個圖形的底部有一條<b>曲線</b>，多邊形必須全部都是直線，所以它<b style="color:#e91e63">不是</b>多邊形！';
      }
    }
    draw();
  }
});
