/* 五上 第五章 多邊形與扇形 5.2：三角形的邊長關係 */
NB.unit({
  title: "三角形的邊長關係",
  ref: "五上・第五章 多邊形與扇形・5.2 三角形的邊長關係",
  q: "有三根竹籤，長度分別是 2、3、6 公分，能排成一個三角形嗎？",
  steps: [
    "三角形有一個非常重要的規定：「任意兩邊長度的和，一定要大於第三邊」。",
    "我們通常會把「最短的兩個邊」加起來，跟最長的邊比較。",
    "2 + 3 = 5，而 5 < 6。",
    "代表這兩根短竹籤太短了，就算完全平躺也碰不到彼此，所以無法排成三角形！"
  ],
  ch: { 
    q: "邊長為 4、5、8 的三條線段，可以組成三角形嗎？", 
    a: "可以", 
    h: "較短兩邊和 4+5=9，9 大於 8，所以可以。" 
  },
  tool: function(b, eq) {
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var cases = [
      { a: 3, b: 4, c: 5 }, // 可以 (3+4 > 5)
      { a: 4, b: 4, c: 8 }, // 不行 (4+4 = 8，平躺)
      { a: 2, b: 3, c: 6 }  // 不行 (2+3 < 6，碰不到)
    ];
    var currentCase = 0;
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    cases.forEach(function(c, i) {
      var btn = NB.h('<button class="pen ' + (i === 0 ? 'on' : '') + '">邊長 ' + c.a + ', ' + c.b + ', ' + c.c + '</button>');
      btn.onclick = function() {
        Array.from(btnRow.children).forEach(function(el){ el.classList.remove('on'); });
        btn.classList.add('on');
        currentCase = i;
        draw();
      };
      btnRow.appendChild(btn);
    });
    b.appendChild(btnRow);

    function draw() {
      v.innerHTML = ""; 
      var c = cases[currentCase];
      var scale = 22; // 調整比例避免超出邊界
      
      var cx = 250, cy = 170; // 基準線往下移
      var leftX = cx - (c.c * scale)/2;
      var rightX = cx + (c.c * scale)/2;
      var rA = c.a * scale;
      var rB = c.b * scale;
      
      // 【版面優化】把最長邊的文字移到上方，避免被圖形覆蓋
      NB.t(v, cx, 30, "最長邊 = " + c.c, { z: 18, c: "#ffffff", b: 1 });

      // 畫出作為底邊的最長邊 C (使用亮色讓對比更明顯)
      NB.mk("line", { x1: leftX, y1: cy, x2: rightX, y2: cy, stroke: "#94a3b8", "stroke-width": 8, "stroke-linecap": "round" }, v, 2);

      // 用高對比的虛線圓弧畫出另外兩邊的「伸展範圍」
      NB.mk("circle", { cx: leftX, cy: cy, r: rA, fill: "none", stroke: "#ff7675", "stroke-width": 3, "stroke-dasharray": "6,6" }, v, 1);
      NB.mk("circle", { cx: rightX, cy: cy, r: rB, fill: "none", stroke: "#74b9ff", "stroke-width": 3, "stroke-dasharray": "6,6" }, v, 1);

      var sum = c.a + c.b;
      if (sum > c.c) {
          // 計算頂點座標
          var cosA = (c.c*c.c + c.a*c.a - c.b*c.b) / (2 * c.c * c.a);
          var sinA = Math.sqrt(1 - cosA*cosA);
          var topX = leftX + rA * cosA;
          var topY = cy - rA * sinA;
          
          // 畫出實際組成的三角形邊長
          NB.mk("line", { x1: leftX, y1: cy, x2: topX, y2: topY, stroke: "#ff7675", "stroke-width": 6, "stroke-linecap": "round" }, v, 3);
          NB.mk("line", { x1: rightX, y1: cy, x2: topX, y2: topY, stroke: "#74b9ff", "stroke-width": 6, "stroke-linecap": "round" }, v, 3);
          
          // 標示兩邊長度
          NB.t(v, leftX + (topX-leftX)/2 - 15, cy - (cy-topY)/2 - 12, c.a, { z: 16, c: "#ff7675", b: 1 });
          NB.t(v, rightX - (rightX-topX)/2 + 15, cy - (cy-topY)/2 - 12, c.b, { z: 16, c: "#74b9ff", b: 1 });
          
          eq.innerHTML = '看虛線圓的交點！<br>較短的兩邊和：<b style="color:#ff7675">' + c.a + '</b> + <b style="color:#74b9ff">' + c.b + '</b> = <b>' + sum + '</b>，大於最長邊 ' + c.c + '。<br>所以可以順利在頂端交會，組成三角形！';
      } else {
          // 碰不到或平躺
          NB.mk("line", { x1: leftX, y1: cy-6, x2: leftX + rA, y2: cy-6, stroke: "#ff7675", "stroke-width": 6, "stroke-linecap": "round" }, v, 3);
          NB.mk("line", { x1: rightX, y1: cy-6, x2: rightX - rB, y2: cy-6, stroke: "#74b9ff", "stroke-width": 6, "stroke-linecap": "round" }, v, 3);
          
          var sign = sum === c.c ? "=" : "&lt;";
          var reason = sum === c.c ? '剛好平躺重疊在底邊上' : '碰都碰不到彼此';
          
          eq.innerHTML = '看虛線圓的範圍！<br>較短的兩邊和：<b style="color:#ff7675">' + c.a + '</b> + <b style="color:#74b9ff">' + c.b + '</b> = <b>' + sum + '</b>，' + sign + ' 最長邊 ' + c.c + '。<br>長度太短，' + reason + '，所以無法組成三角形！';
      }
    }
    draw();
  }
});
