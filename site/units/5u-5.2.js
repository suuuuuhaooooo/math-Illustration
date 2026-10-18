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
    var v = NB.svg(st, 500, 240);

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
      var scale = 25; // 放大比例
      
      var cx = 250, cy = 180; // 基準點在下方
      var leftX = cx - (c.c * scale)/2;
      var rightX = cx + (c.c * scale)/2;
      var rA = c.a * scale;
      var rB = c.b * scale;
      
      // 畫出作為底邊的最長邊 C
      NB.mk("line", { x1: leftX, y1: cy, x2: rightX, y2: cy, stroke: "#333", "stroke-width": 6, "stroke-linecap": "round" }, v, 2);
      NB.t(v, cx, cy + 25, "最長邊: " + c.c, { z: 16, c: "#333", b: 1 });

      // 用虛線圓弧畫出另外兩邊的「伸展範圍」
      NB.mk("circle", { cx: leftX, cy: cy, r: rA, fill: "none", stroke: "var(--p1)", "stroke-width": 2, "stroke-dasharray": "5,5" }, v, 1);
      NB.mk("circle", { cx: rightX, cy: cy, r: rB, fill: "none", stroke: "var(--p2)", "stroke-width": 2, "stroke-dasharray": "5,5" }, v, 1);

      var sum = c.a + c.b;
      if (sum > c.c) {
          // 畫出實際的三角形 (利用餘弦定理算頂點)
          var cosA = (c.c*c.c + c.a*c.a - c.b*c.b) / (2 * c.c * c.a);
          var sinA = Math.sqrt(1 - cosA*cosA);
          var topX = leftX + rA * cosA;
          var topY = cy - rA * sinA; // SVG y 軸朝下，所以減
          
          NB.mk("line", { x1: leftX, y1: cy, x2: topX, y2: topY, stroke: "var(--p1)", "stroke-width": 6, "stroke-linecap": "round" }, v, 3);
          NB.mk("line", { x1: rightX, y1: cy, x2: topX, y2: topY, stroke: "var(--p2)", "stroke-width": 6, "stroke-linecap": "round" }, v, 3);
          
          NB.t(v, leftX + (topX-leftX)/2 - 15, cy - (cy-topY)/2 - 10, "邊長 " + c.a, { z: 16, c: "var(--p1)", b: 1 });
          NB.t(v, rightX - (rightX-topX)/2 + 15, cy - (cy-topY)/2 - 10, "邊長 " + c.b, { z: 16, c: "var(--p2)", b: 1 });
          
          eq.innerHTML = '看虛線圓的交點！<br>較短的兩邊和：<b style="color:var(--p1)">' + c.a + '</b> + <b style="color:var(--p2)">' + c.b + '</b> = <b>' + sum + '</b>，大於最長邊 ' + c.c + '。<br>所以可以順利在頂端交會，組成三角形！';
      } else {
          // 碰不到或平躺，把邊平放在底邊上
          NB.mk("line", { x1: leftX, y1: cy-6, x2: leftX + rA, y2: cy-6, stroke: "var(--p1)", "stroke-width": 6, "stroke-linecap": "round" }, v, 3);
          NB.mk("line", { x1: rightX, y1: cy-6, x2: rightX - rB, y2: cy-6, stroke: "var(--p2)", "stroke-width": 6, "stroke-linecap": "round" }, v, 3);
          
          var sign = sum === c.c ? "=" : "&lt;";
          var reason = sum === c.c ? '剛好平躺重疊在底邊上' : '碰都碰不到彼此';
          
          eq.innerHTML = '看虛線圓的範圍！<br>較短的兩邊和：<b style="color:var(--p1)">' + c.a + '</b> + <b style="color:var(--p2)">' + c.b + '</b> = <b>' + sum + '</b>，' + sign + ' 最長邊 ' + c.c + '。<br>長度太短，' + reason + '，所以無法組成三角形！';
      }
    }
    draw();
  }
});