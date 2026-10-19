/* 五上 第十章 柱體、錐體和球 10.2：角柱和角錐的構成要素 */
NB.unit({
  title: "角柱和角錐的構成要素",
  ref: "五上・第十章 柱體、錐體和球・10.2 角柱和角錐的構成要素",
  q: "一個「六角柱」總共有幾個面、幾個頂點、幾條邊呢？",
  steps: [
    "【角柱的規律】(N角柱)",
    "面數：N (側面) + 2 (上下底) = N + 2",
    "頂點：N (上底頂點) × 2 = N × 2",
    "邊數：N (上底) + N (下底) + N (側面高) = N × 3",
    "【角錐的規律】(N角錐)",
    "面數：N (側面) + 1 (底) = N + 1",
    "頂點：N (底面) + 1 (上方頂點) = N + 1",
    "邊數：N (底邊) + N (側邊) = N × 2"
  ],
  ch: { 
    q: "八角錐有幾個面？幾條邊？", 
    a: "9個面，16條邊", 
    h: "面數=8+1=9。邊數=8×2=16。" 
  },
  tool: function(b, eq) {
    var topRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var botRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center; border-top:1px dashed #ccc; padding-top:10px;"></div>');
    
    var tBtns = [NB.h('<button class="pen on">角柱</button>'), NB.h('<button class="pen">角錐</button>')];
    var currentType = 0; 
    tBtns.forEach(function(btn, i) {
      btn.onclick = function() { tBtns.forEach(function(el){ el.classList.remove('on'); }); btn.classList.add('on'); currentType = i; draw(); };
      topRow.appendChild(btn);
    });
    b.appendChild(topRow);

    var sidesArr = [3, 4, 5, 6];
    var currentN = 6; 
    var nBtns = [];
    sidesArr.forEach(function(n) {
        var btn = NB.h('<button class="pen ' + (n === 6 ? 'on' : '') + '">底面是 ' + n + ' 邊形</button>');
        btn.onclick = function() { nBtns.forEach(function(el){ el.classList.remove('on'); }); btn.classList.add('on'); currentN = n; draw(); };
        nBtns.push(btn);
        botRow.appendChild(btn);
    });
    b.appendChild(botRow);
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 240);
    v.style.fontFamily = "system-ui, -apple-system, sans-serif";

    function draw() {
      v.innerHTML = ""; 
      var n = currentN;
      var isPrism = (currentType === 0);
      var name = (n===3?"三":n===4?"四":n===5?"五":"六") + (isPrism ? "角柱" : "角錐");
      
      var cx = 130, cyTop = 50, cyBot = 160, rX = 60, rY = 20;
      var ptsTop = [], ptsBot = [];
      for(var i=0; i<n; i++){
          var angle = -Math.PI/2 + (i*2*Math.PI/n);
          ptsTop.push({x: cx + rX * Math.cos(angle), y: cyTop + rY * Math.sin(angle)});
          ptsBot.push({x: cx + rX * Math.cos(angle), y: cyBot + rY * Math.sin(angle)});
      }
      
      if (isPrism) {
          for(var j=0; j<n; j++) {
              var next = (j+1)%n;
              NB.mk("line", { x1: ptsTop[j].x, y1: ptsTop[j].y, x2: ptsBot[j].x, y2: ptsBot[j].y, stroke: "var(--p2)", "stroke-width": 2 }, v, 1);
              NB.mk("line", { x1: ptsBot[j].x, y1: ptsBot[j].y, x2: ptsBot[next].x, y2: ptsBot[next].y, stroke: "var(--p2)", "stroke-width": 2 }, v, 1);
              NB.mk("line", { x1: ptsTop[j].x, y1: ptsTop[j].y, x2: ptsTop[next].x, y2: ptsTop[next].y, stroke: "var(--p2)", "stroke-width": 2 }, v, 1);
              NB.mk("circle", { cx: ptsTop[j].x, cy: ptsTop[j].y, r: 4, fill: "#e91e63" }, v, 2);
              NB.mk("circle", { cx: ptsBot[j].x, cy: ptsBot[j].y, r: 4, fill: "#e91e63" }, v, 2);
          }
      } else {
          for(var k=0; k<n; k++) {
              var next = (k+1)%n;
              NB.mk("line", { x1: cx, y1: cyTop, x2: ptsBot[k].x, y2: ptsBot[k].y, stroke: "var(--p2)", "stroke-width": 2 }, v, 1);
              NB.mk("line", { x1: ptsBot[k].x, y1: ptsBot[k].y, x2: ptsBot[next].x, y2: ptsBot[next].y, stroke: "var(--p2)", "stroke-width": 2 }, v, 1);
              NB.mk("circle", { cx: ptsBot[k].x, cy: ptsBot[k].y, r: 4, fill: "#e91e63" }, v, 2);
          }
          NB.mk("circle", { cx: cx, cy: cyTop, r: 4, fill: "#e91e63" }, v, 2);
      }

      var startX = 260, y1 = 70, y2 = 120, y3 = 170;
      var faces = isPrism ? n + 2 : n + 1;
      var verts = isPrism ? n * 2 : n + 1;
      var edges = isPrism ? n * 3 : n * 2;
      
      NB.t(v, startX, y1, "面數：", { z: 18, c: "#333", b: 1 });
      NB.t(v, startX+130, y1, (isPrism ? n+" + 2" : n+" + 1") + " = " + faces, { z: 20, c: "var(--p1)", b: 1 });
      NB.t(v, startX, y2, "頂點數：", { z: 18, c: "#333", b: 1 });
      NB.t(v, startX+130, y2, (isPrism ? n+" \u00D7 2" : n+" + 1") + " = " + verts, { z: 20, c: "#e91e63", b: 1 });
      NB.t(v, startX, y3, "邊數：", { z: 18, c: "#333", b: 1 });
      NB.t(v, startX+130, y3, (isPrism ? n+" \u00D7 3" : n+" \u00D7 2") + " = " + edges, { z: 20, c: "var(--p2)", b: 1 });

      eq.innerHTML = '利用底邊的數量 N = ' + n + '，套入算式推導出構成要素的數量！';
    }
    draw();
  }
});