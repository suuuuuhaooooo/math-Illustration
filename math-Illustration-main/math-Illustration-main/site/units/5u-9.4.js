/* 五上 第九章 面積 9.4：複合圖形的面積 */
NB.unit({
  title: "複合圖形的面積",
  ref: "五上・第九章 面積・9.4 複合圖形的面積",
  q: "這個 L 型的圖形，面積該怎麼算呢？",
  steps: [
    "複合圖形通常有兩種解法：",
    "【切割法】把圖形切成兩塊學過的長方形，分別算面積再「相加」。",
    "【填補法】把缺口補起來，變成一個大長方形，算出大面積後，再「減去」補上去的那塊。"
  ],
  ch: { 
    q: "一個回字型的面積怎麼算？", 
    a: "用填補法", 
    h: "用大長方形面積減去中間挖空的長方形面積。" 
  },
  tool: function(b, eq) {
    var stepRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var modesText = ["原本的圖形", "使用【切割法】", "使用【填補法】"];
    var currentMode = 0;
    
    var modeBtns = [];
    modesText.forEach(function(txt, i) {
      var btn = NB.h('<button class="pen ' + (i === 0 ? 'on' : '') + '">' + txt + '</button>');
      btn.onclick = function() { currentMode = i; updateModeBtns(); draw(); };
      modeBtns.push(btn);
      stepRow.appendChild(btn);
    });
    
    function updateModeBtns() {
      modeBtns.forEach(function(btn, i) { btn.classList.toggle('on', i === currentMode); });
    }
    b.appendChild(stepRow);
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    function draw() {
      v.innerHTML = ""; 
      
      var cx = 180, cy = 60;
      var w1 = 160, h1 = 50, w2 = 60, h2 = 140; 
      
      if (currentMode === 0) {
          // 畫完整的 L 型
          var pts = cx+","+cy+" "+(cx+w1)+","+cy+" "+(cx+w1)+","+(cy+h1)+" "+(cx+w2)+","+(cy+h1)+" "+(cx+w2)+","+(cy+h2)+" "+cx+","+(cy+h2);
          NB.mk("polygon", { points: pts, fill: "#e0f2fe", stroke: "var(--p2)", "stroke-width": 4, "stroke-linejoin": "round" }, v, 1);
          
          NB.t(v, cx+w1/2, cy-10, "16", { z: 16, c: "#333", b: 1 }); // 上寬
          NB.t(v, cx-15, cy+h2/2, "14", { z: 16, c: "#333", b: 1 }); // 左高
          NB.t(v, cx+w1+15, cy+h1/2, "5", { z: 16, c: "#333", b: 1 }); // 右高
          NB.t(v, cx+w2/2, cy+h2+15, "6", { z: 16, c: "#333", b: 1 }); // 下寬
          
          eq.innerHTML = '這個不規則的 L 型沒有現成的公式可以代入。<br>你可以想到幾種方法來計算它呢？';
          
      } else if (currentMode === 1) {
          // 切割法：分成左右兩塊
          NB.mk("rect", { x: cx, y: cy, width: w2, height: h2, fill: "var(--p2)", "fill-opacity": "0.4", stroke: "var(--p2)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 1);
          NB.mk("rect", { x: cx+w2, y: cy, width: w1-w2, height: h1, fill: "var(--p1)", "fill-opacity": "0.4", stroke: "var(--p1)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 1);
          
          // 切割線
          NB.mk("line", { x1: cx+w2, y1: cy, x2: cx+w2, y2: cy+h1, stroke: "#fff", "stroke-width": 4, "stroke-dasharray": "6,4" }, v, 2);
          
          NB.t(v, cx+w2/2, cy+h2/2, "A", { z: 24, c: "var(--p2)", b: 1 });
          NB.t(v, cx+w2 + (w1-w2)/2, cy+h1/2, "B", { z: 24, c: "var(--p1)", b: 1 });
          
          eq.innerHTML = '【切割法】畫一條虛線把它切成兩塊！<br>總面積 = <b style="color:var(--p2)">A長方形</b> + <b style="color:var(--p1)">B長方形</b>';
          
      } else if (currentMode === 2) {
          // 填補法：畫一個大長方形，右下角缺口用虛線
          var pts = cx+","+cy+" "+(cx+w1)+","+cy+" "+(cx+w1)+","+(cy+h1)+" "+(cx+w2)+","+(cy+h1)+" "+(cx+w2)+","+(cy+h2)+" "+cx+","+(cy+h2);
          NB.mk("polygon", { points: pts, fill: "#e0f2fe", stroke: "var(--p2)", "stroke-width": 4, "stroke-linejoin": "round" }, v, 1);
          
          // 補齊的缺口
          NB.mk("rect", { x: cx+w2, y: cy+h1, width: w1-w2, height: h2-h1, fill: "#ff7675", "fill-opacity": "0.2", stroke: "#ff7675", "stroke-width": 3, "stroke-dasharray": "6,4" }, v, 2);
          
          NB.t(v, cx+w2 + (w1-w2)/2, cy+h1 + (h2-h1)/2, "扣除缺口", { z: 18, c: "#ff7675", b: 1 });
          
          eq.innerHTML = '【填補法】把缺口補起來，變成一個完整的大長方形！<br>總面積 = <b>大長方形面積</b> <span style="color:#ff7675; font-weight:bold;">− 扣除缺口面積</span>';
      }
    }
    draw();
  }
});