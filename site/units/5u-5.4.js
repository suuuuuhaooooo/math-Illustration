/* 五上 第五章 多邊形與扇形 5.4：扇形與圓心角 */
NB.unit({
  title: "扇形與圓心角",
  ref: "五上・第五章 多邊形與扇形・5.4 扇形與圓心角",
  q: "把一個披薩平分成 6 塊，其中一塊扇形的「<span class='hl'>圓心角</span>」是多少度？",
  steps: [
    "一個完整的圓，繞一圈的角度是 360 度。",
    "平分成 6 塊，代表把 360 度平分成 6 份。",
    "算式：360 ÷ 6 = 60",
    "所以 1/6 圓的扇形，它的圓心角就是 60 度。"
  ],
  ch: { 
    q: "1/4 圓的扇形，圓心角是多少度？", 
    a: "90度", 
    h: "360 ÷ 4 = 90，這剛好也是一個直角。" 
  },
  tool: function(b, eq) {
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var cases = [
      { name: "1/2 圓", parts: 2 },
      { name: "1/3 圓", parts: 3 },
      { name: "1/4 圓", parts: 4 },
      { name: "1/6 圓", parts: 6 }
    ];
    var currentCase = 3; // 預設 1/6 圓
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 260);

    cases.forEach(function(c, i) {
      var btn = NB.h('<button class="pen ' + (i === 3 ? 'on' : '') + '">' + c.name + '</button>');
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
      var cx = 250, cy = 130, r = 100;
      
      var angleDeg = 360 / c.parts;
      var angleRad = (angleDeg * Math.PI) / 180;
      
      // 1. 畫底部的完整圓形 (虛線輔助)
      NB.mk("circle", { cx: cx, cy: cy, r: r, fill: "white", stroke: "#ddd", "stroke-width": 2, "stroke-dasharray": "4,4" }, v, 1);
      
      // 2. 畫出扇形 (利用 SVG 的 Arc 指令)
      var startX = cx; 
      var startY = cy - r; // 從正上方開始
      var endX = cx + r * Math.sin(angleRad);
      var endY = cy - r * Math.cos(angleRad);
      
      var largeArcFlag = angleDeg > 180 ? 1 : 0; // 雖然這裡題目設計不會超過 180，但照規矩寫
      
      var pathD = "M " + cx + " " + cy + " L " + startX + " " + startY + 
                  " A " + r + " " + r + " 0 " + largeArcFlag + " 1 " + endX + " " + endY + " Z";
                  
      NB.mk("path", { d: pathD, fill: "var(--p1)", "fill-opacity": "0.3", stroke: "var(--p1)", "stroke-width": 3 }, v, 2);

      // 3. 畫出圓心角的小弧線標示
      var arcR = 25;
      var arcEndX = cx + arcR * Math.sin(angleRad);
      var arcEndY = cy - arcR * Math.cos(angleRad);
      var arcPathD = "M " + cx + " " + (cy - arcR) + " A " + arcR + " " + arcR + " 0 0 1 " + arcEndX + " " + arcEndY;
      
      if (angleDeg === 90) {
          // 直角畫方框
          NB.mk("path", { d: "M " + cx + " " + (cy-15) + " L " + (cx+15) + " " + (cy-15) + " L " + (cx+15) + " " + cy, fill: "none", stroke: "var(--p1)", "stroke-width": 2 }, v, 3);
      } else {
          NB.mk("path", { d: arcPathD, fill: "none", stroke: "var(--p1)", "stroke-width": 2 }, v, 3);
      }

      // 4. 文字標示
      var textAngle = angleRad / 2;
      var textX = cx + (r * 0.6) * Math.sin(textAngle);
      var textY = cy - (r * 0.6) * Math.cos(textAngle) + 5;
      NB.t(v, textX, textY, angleDeg + "°", { z: 18, c: "var(--p1)", b: 1 });
      NB.mk("circle", { cx: cx, cy: cy, r: 4, fill: "var(--p2)" }, v, 4); // 圓心點

      eq.innerHTML = '一整個圓是 360&deg;。<br>這個扇形是把圓平分成 <b>' + c.parts + '</b> 份，所以圓心角為：360&deg; &divide; ' + c.parts + ' = <b style="color:var(--p1)">' + angleDeg + '&deg;</b>';
    }
    draw();
  }
});