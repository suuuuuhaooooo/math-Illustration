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
    var dragHint = NB.h('<div style="margin-bottom:10px; color:#e91e63; font-weight:bold; font-size:16px;">✨ 3D 透視模式：你可以拖曳旋轉左方的立體圖形，親自數數看頂點喔！</div>');
    b.appendChild(dragHint);

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
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center; touch-action:none;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, sans-serif";
    v.style.cursor = "grab";

    var theta = Math.PI / 8, phi = -Math.PI / 6;
    var isDragging = false, lastX = 0, lastY = 0;
    
    v.onmousedown = function(e) { isDragging = true; lastX = e.clientX; lastY = e.clientY; v.style.cursor = "grabbing"; };
    window.addEventListener('mousemove', function(e) {
        if(!isDragging || !v.isConnected) return;
        theta -= (e.clientX - lastX) * 0.015; phi -= (e.clientY - lastY) * 0.015;
        if(phi > Math.PI/2) phi = Math.PI/2; if(phi < -Math.PI/2) phi = -Math.PI/2;
        lastX = e.clientX; lastY = e.clientY; draw();
    });
    window.addEventListener('mouseup', function(){ isDragging = false; v.style.cursor = "grab"; });
    v.addEventListener('touchstart', function(e) { isDragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; });
    window.addEventListener('touchmove', function(e) {
        if(!isDragging || !v.isConnected) return;
        theta -= (e.touches[0].clientX - lastX) * 0.015; phi -= (e.touches[0].clientY - lastY) * 0.015;
        if(phi > Math.PI/2) phi = Math.PI/2; if(phi < -Math.PI/2) phi = -Math.PI/2;
        lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; e.preventDefault(); draw();
    }, {passive: false});
    window.addEventListener('touchend', function(){ isDragging = false; });

    function draw() {
      v.innerHTML = ""; 
      var n = currentN;
      var isPrism = (currentType === 0);
      var name = (n===3?"三":n===4?"四":n===5?"五":"六") + (isPrism ? "角柱" : "角錐");
      
      var cx = 130, cy = 130, h = 60, r = 60;
      var nodes = [], faces = [];
      var baseAngles = [];
      for(var i=0; i<n; i++){ baseAngles.push(i * 2 * Math.PI / n - Math.PI/2); }

      if (isPrism) {
          for(var i=0; i<n; i++) nodes.push({x: r*Math.cos(baseAngles[i]), y: h, z: r*Math.sin(baseAngles[i])});
          for(var i=0; i<n; i++) nodes.push({x: r*Math.cos(baseAngles[i]), y: -h, z: r*Math.sin(baseAngles[i])});
          faces.push({ id: Array.from({length:n}, (_,i)=>i).reverse(), isBase: true }); 
          faces.push({ id: Array.from({length:n}, (_,i)=>n+i), isBase: true }); 
          for(var i=0; i<n; i++) faces.push({ id: [i, (i+1)%n, n+(i+1)%n, n+i], isBase: false }); 
      } else {
          nodes.push({x: 0, y: h, z: 0});
          for(var i=0; i<n; i++) nodes.push({x: r*Math.cos(baseAngles[i]), y: -h, z: r*Math.sin(baseAngles[i])});
          faces.push({ id: Array.from({length:n}, (_,i)=>i+1), isBase: true }); 
          for(var i=0; i<n; i++) faces.push({ id: [0, i+1, (i+1)%n + 1], isBase: false }); 
      }

      var pNodes = nodes.map(function(nd) {
          var y1 = nd.y * Math.cos(phi) - nd.z * Math.sin(phi);
          var z1 = nd.y * Math.sin(phi) + nd.z * Math.cos(phi);
          var x2 = nd.x * Math.cos(theta) + z1 * Math.sin(theta);
          var z2 = -nd.x * Math.sin(theta) + z1 * Math.cos(theta);
          return { x: cx + x2, y: cy - y1, z: z2 };
      });

      var faceData = faces.map(function(f) {
          var p = f.id.map(function(idx){ return pNodes[idx]; });
          var avgZ = p.reduce(function(s, pt){ return s + pt.z; }, 0) / p.length;
          var orig = f.id.map(function(idx){ return nodes[idx]; });
          var u = {x: orig[1].x-orig[0].x, y: orig[1].y-orig[0].y, z: orig[1].z-orig[0].z};
          var vecV = {x: orig[2].x-orig[1].x, y: orig[2].y-orig[1].y, z: orig[2].z-orig[1].z};
          var nx = u.y*vecV.z - u.z*vecV.y, ny = u.z*vecV.x - u.x*vecV.z, nz = u.x*vecV.y - u.y*vecV.x;
          var y1 = ny * Math.cos(phi) - nz * Math.sin(phi);
          var z1 = ny * Math.sin(phi) + nz * Math.cos(phi);
          var projNZ = -nx * Math.sin(theta) + z1 * Math.cos(theta);
          return { pts: p, z: avgZ, isFront: projNZ > 0, isBase: f.isBase };
      });

      faceData.sort(function(a, b){ return a.z - b.z; });
      var zOrder = 1;
      
      faceData.forEach(function(f) {
          var ptsStr = f.pts.map(function(pt){ return pt.x+","+pt.y; }).join(" ");
          var fillC = f.isBase ? "var(--p1)" : "#e0f2fe";
          var fillOp = f.isFront ? (f.isBase ? "0.8" : "0.9") : (f.isBase ? "0.3" : "0.1");
          var strC = f.isBase ? "var(--p1)" : "var(--p2)";
          var strW = f.isFront ? 2 : 1.5;
          var dash = f.isFront ? "" : "4,4";
          NB.mk("polygon", { points: ptsStr, fill: fillC, "fill-opacity": fillOp, stroke: strC, "stroke-width": strW, "stroke-dasharray": dash, "stroke-linejoin": "round" }, v, zOrder++);
      });

      // 畫顯眼的頂點 (紅色圓圈)
      pNodes.forEach(function(pt) {
          NB.mk("circle", { cx: pt.x, cy: pt.y, r: 5, fill: "#e91e63" }, v, zOrder++);
      });

      var startX = 260, y1 = 80, y2 = 130, y3 = 180;
      var facesCount = isPrism ? n + 2 : n + 1;
      var vertsCount = isPrism ? n * 2 : n + 1;
      var edgesCount = isPrism ? n * 3 : n * 2;
      
      NB.t(v, startX, y1, "面數：", { z: 18, c: "#333", b: 1 });
      NB.t(v, startX+130, y1, (isPrism ? n+" + 2" : n+" + 1") + " = " + facesCount, { z: 20, c: "var(--p1)", b: 1 });
      NB.t(v, startX, y2, "頂點數：", { z: 18, c: "#333", b: 1 });
      NB.t(v, startX+130, y2, (isPrism ? n+" \u00D7 2" : n+" + 1") + " = " + vertsCount, { z: 20, c: "#e91e63", b: 1 });
      NB.t(v, startX, y3, "邊數：", { z: 18, c: "#333", b: 1 });
      NB.t(v, startX+130, y3, (isPrism ? n+" \u00D7 3" : n+" \u00D7 2") + " = " + edgesCount, { z: 20, c: "var(--p2)", b: 1 });

      eq.innerHTML = '這是一顆可以旋轉的【<b>' + name + '</b>】。<br>利用底邊的數量 N = ' + n + '，套入規律算算看！';
    }
    draw();
  }
});