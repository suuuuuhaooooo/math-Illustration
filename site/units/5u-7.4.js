/* 五上 第七章 線對稱圖形 7.4：線對稱圖形的應用 */
NB.unit({
  title: "線對稱圖形的應用",
  ref: "五上・第七章 線對稱圖形・7.4 線對稱圖形的應用",
  q: "正多邊形有幾條對稱軸呢？它們和邊數有什麼關係？",
  steps: [
    "我們來觀察正多邊形的對稱軸數量：",
    "正三角形有 3 條對稱軸。",
    "正方形有 4 條對稱軸。",
    "結論：「正 N 邊形」就會有「N 條對稱軸」喔！"
  ],
  ch: { 
    q: "正六邊形有幾條對稱軸？圓形呢？", 
    a: "6條，圓形有無限多條", 
    h: "正多邊形邊數=對稱軸數。圓形只要通過圓心的直線都是對稱軸。" 
  },
  tool: function(b, eq) {
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var cases = [
      { name: "正三角形", sides: 3, isRegular: true },
      { name: "正方形", sides: 4, isRegular: true },
      { name: "長方形", sides: 4, isRegular: false } // 作為對比組
    ];
    var currentCase = 1; // 預設正方形
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    cases.forEach(function(c, i) {
      var btn = NB.h('<button class="pen ' + (i === 1 ? 'on' : '') + '">' + c.name + '</button>');
      btn.onclick = function() {
        Array.from(btnRow.children).forEach(function(el){ el.classList.remove('on'); });
        btn.classList.add('on');
        currentCase = i; draw();
      };
      btnRow.appendChild(btn);
    });

    function draw() {
      v.innerHTML = ""; 
      var c = cases[currentCase];
      var cx = 250, cy = 130, r = 80;
      
      var pathD = "";
      var axesLines = []; // 儲存對稱軸的座標
      
      if (c.name === "長方形") {
         NB.mk("rect", { x: cx-90, y: cy-60, width: 180, height: 120, fill: "#f0f8ff", stroke: "var(--p2)", "stroke-width": 4, "stroke-linejoin": "round" }, v, 1);
         // 長方形只有兩條 (十字)
         axesLines.push({x1: cx, y1: cy-90, x2: cx, y2: cy+90});
         axesLines.push({x1: cx-120, y1: cy, x2: cx+120, y2: cy});
      } else {
         // 正多邊形
         var pts = [];
         for(var i=0; i<c.sides; i++){ 
            var angle = -Math.PI/2 + (i*2*Math.PI/c.sides);
            pts.push({x: cx + r*Math.cos(angle), y: cy + r*Math.sin(angle)}); 
         }
         pathD = "M" + pts.map(function(p){ return p.x+","+p.y; }).join("L") + "Z";
         NB.mk("path", { d: pathD, fill: "#f0f8ff", stroke: "var(--p2)", "stroke-width": 4, "stroke-linejoin": "round" }, v, 1);
         
         // 畫正多邊形的對稱軸
         if (c.sides % 2 !== 0) {
             // 奇數邊：從頂點到對邊中點
             for(var j=0; j<c.sides; j++){
                 var oppX = cx - (pts[j].x - cx);
                 var oppY = cy - (pts[j].y - cy);
                 // 稍微延伸出去
                 var extX1 = cx + (pts[j].x - cx)*1.3;
                 var extY1 = cy + (pts[j].y - cy)*1.3;
                 var extX2 = cx + (oppX - cx)*1.3;
                 var extY2 = cy + (oppY - cy)*1.3;
                 axesLines.push({x1: extX1, y1: extY1, x2: extX2, y2: extY2});
             }
         } else {
             // 偶數邊 (如正方形)：頂點對頂點，以及邊中點對邊中點
             for(var k=0; k<c.sides/2; k++){
                 var extX1 = cx + (pts[k].x - cx)*1.3;
                 var extY1 = cy + (pts[k].y - cy)*1.3;
                 var oppIdx = k + c.sides/2;
                 var extX2 = cx + (pts[oppIdx].x - cx)*1.3;
                 var extY2 = cy + (pts[oppIdx].y - cy)*1.3;
                 axesLines.push({x1: extX1, y1: extY1, x2: extX2, y2: extY2});
             }
             for(var l=0; l<c.sides/2; l++){
                 var midX = (pts[l].x + pts[(l+1)%c.sides].x)/2;
                 var midY = (pts[l].y + pts[(l+1)%c.sides].y)/2;
                 var extX1 = cx + (midX - cx)*1.5;
                 var extY1 = cy + (midY - cy)*1.5;
                 var extX2 = cx - (midX - cx)*1.5;
                 var extY2 = cy - (midY - cy)*1.5;
                 axesLines.push({x1: extX1, y1: extY1, x2: extX2, y2: extY2});
             }
         }
      }

      // 畫出計算出來的所有對稱軸
      axesLines.forEach(function(line) {
          NB.mk("line", { x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, stroke: "#ff7675", "stroke-width": 3, "stroke-dasharray": "6,4" }, v, 2);
      });

      var axesCount = axesLines.length;
      if (c.isRegular) {
          eq.innerHTML = '這個圖形是<b>正多邊形</b>。<br>仔細數數看紅色的虛線，它剛好有 <b style="color:#ff7675; font-size:24px;">' + axesCount + '</b> 條對稱軸喔！';
      } else {
          eq.innerHTML = '長方形只有「上下對摺」和「左右對摺」兩種方式能重合。<br>沿對角線摺疊是無法重合的，所以它只有 <b style="color:#ff7675; font-size:24px;">' + axesCount + '</b> 條對稱軸。';
      }
    }
    draw();
  }
});