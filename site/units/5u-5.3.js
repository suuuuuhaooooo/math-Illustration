/* 五上 第五章 多邊形與扇形 5.3：三角形和四邊形的內角和 */
NB.unit({
  title: "三角形和四邊形的內角和",
  ref: "五上・第五章 多邊形與扇形・5.3 三角形和四邊形的內角和",
  q: "一個四邊形的內角和是幾度？如果是五邊形呢？",
  steps: [
    "我們知道一個三角形的內角和固定是 180 度。",
    "從四邊形的一個頂點畫對角線，可以把它切成 2 個三角形。",
    "所以四邊形的內角和是：180度 × 2 = 360度。",
    "以此類推，多邊形的內角和可以利用「能切出幾個三角形」來計算。"
  ],
  ch: { 
    q: "六邊形的內角和是多少度？", 
    a: "720度", 
    h: "六邊形可以切成 4 個三角形，180 × 4 = 720。" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">點擊下方按鈕切換圖形，觀察對角線是如何將多邊形切割成數個三角形的：</div>');
    b.appendChild(desc);

    // 改用按鈕群組來做互動切換
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var shapes = [
      { name: "三角形", v: 3 },
      { name: "四邊形", v: 4 },
      { name: "五邊形", v: 5 },
      { name: "六邊形", v: 6 }
    ];
    var currentV = 4; // 預設顯示四邊形
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    
    // 建立 SVG 畫布
    var v = NB.svg(st, 500, 260);

    shapes.forEach(function(s) {
      var btn = NB.h('<button class="pen ' + (s.v === 4 ? 'on' : '') + '">' + s.name + '</button>');
      btn.onclick = function() {
        Array.from(btnRow.children).forEach(function(c){ c.classList.remove('on'); });
        btn.classList.add('on');
        currentV = s.v;
        draw();
      };
      btnRow.appendChild(btn);
    });
    b.appendChild(btnRow);

    function draw() {
      v.innerHTML = ""; // 清空畫布
      
      var cx = 250, cy = 130, r = 100;
      var pts = [];
      
      // 計算正多邊形的各個頂點座標
      for(var i = 0; i < currentV; i++){
        var angle = -Math.PI / 2 + (i * 2 * Math.PI / currentV);
        pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
      }
      var ptsStr = pts.map(function(p){ return p[0] + "," + p[1]; }).join(" ");

      // 1. 畫出多邊形外框
      NB.mk("polygon", { points: ptsStr, fill: "#f0f8ff", stroke: "var(--p1)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 2);

      // 2. 從第一個頂點 (pts[0]) 畫出對角線切割成三角形
      var trianglesCount = currentV - 2;
      for(var j = 2; j < currentV - 1; j++){
        NB.mk("line", { 
            x1: pts[0][0], y1: pts[0][1], 
            x2: pts[j][0], y2: pts[j][1], 
            stroke: "var(--p2)", "stroke-width": 2, "stroke-dasharray": "6,6" 
        }, v, 3);
      }

      // 3. 在頂點畫上小圓點裝飾 (完全用 SVG 刻，不用任何 Emoji)
      pts.forEach(function(p, idx) {
          NB.mk("circle", { cx: p[0], cy: p[1], r: 4, fill: idx === 0 ? "var(--p2)" : "var(--p1)" }, v, 4);
      });

      // 4. 標示三角形的編號
      for(var k = 0; k < trianglesCount; k++){
         // 粗略計算每個被切割出來的三角形的中心點位置來放文字
         var p1 = pts[0], p2 = pts[k+1], p3 = pts[k+2];
         var midX = (p1[0] + p2[0] + p3[0]) / 3;
         var midY = (p1[1] + p2[1] + p3[1]) / 3;
         NB.t(v, midX, midY + 6, (k+1).toString(), { z: 18, c: "var(--p2)", b: 1 });
      }

      var degStr = 180 * trianglesCount;
      eq.innerHTML = '從一個頂點畫對角線，可以把 ' + currentV + ' 邊形切成 <b style="color:var(--p2)">' + trianglesCount + '</b> 個三角形。<br>內角和總共為：180&deg; &times; ' + trianglesCount + ' = <b>' + degStr + '&deg;</b>';
    }
    
    draw();
  }
});