/* 五上 第十章 柱體、錐體和球 10.1：柱體和錐體的分類與命名 */
NB.unit({
  title: "柱體和錐體的分類與命名",
  ref: "五上・第十章 柱體、錐體和球・10.1 柱體和錐體的分類與命名",
  q: "立體圖形是怎麼命名的呢？",
  steps: [
    "立體圖形的命名規則是：【底面形狀】 + 【柱體或錐體】",
    "先看側面：上下直直的一樣粗，是「柱體」；往上尖尖的，是「錐體」。",
    "再看底面：底面是三角形叫「三角」，是四邊形叫「四角」，是圓形叫「圓」。",
    "組合起來：例如底面是圓形，又是尖的，就叫作「圓錐」。"
  ],
  ch: { 
    q: "底面是五邊形，且有上下兩個底面的圖形叫什麼？", 
    a: "五角柱", 
    h: "五邊形 -> 五角，兩個底面 -> 柱體。" 
  },
  tool: function(b, eq) {
    var dragHint = NB.h('<div style="margin-bottom:10px; color:#e91e63; font-weight:bold; font-size:16px;">已啟動 3D 引擎！請用滑鼠按住下方圖形，自由拖曳旋轉</div>');
    b.appendChild(dragHint);

    var row1 = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var row2 = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center; border-top:1px dashed #ccc; padding-top:10px;"></div>');
    
    var typeMode = 0; // 0: 柱, 1: 錐
    var baseMode = 0; // 0: 三角, 1: 四角, 2: 圓
    
    var tBtns = [NB.h('<button class="pen on">柱體 (上下兩底面)</button>'), NB.h('<button class="pen">錐體 (尖尖一頂點)</button>')];
    var bBtns = [NB.h('<button class="pen on">三角形底面</button>'), NB.h('<button class="pen">四邊形底面</button>'), NB.h('<button class="pen">圓形底面</button>')];
    
    tBtns.forEach(function(btn, i) {
      btn.onclick = function() { tBtns.forEach(function(el){ el.classList.remove('on'); }); btn.classList.add('on'); typeMode = i; draw(); };
      row1.appendChild(btn);
    });
    bBtns.forEach(function(btn, i) {
      btn.onclick = function() { bBtns.forEach(function(el){ el.classList.remove('on'); }); btn.classList.add('on'); baseMode = i; draw(); };
      row2.appendChild(btn);
    });
    b.appendChild(row1); b.appendChild(row2);
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center; touch-action:none;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, sans-serif";
    v.style.cursor = "grab";

    // 核心 3D 引擎變數
    var theta = Math.PI / 6; // 水平旋轉 (Yaw)
    var phi = -Math.PI / 8;  // 垂直旋轉 (Pitch)
    var isDragging = false, lastX = 0, lastY = 0;

    function handleDown(x, y) { isDragging = true; lastX = x; lastY = y; v.style.cursor = "grabbing"; }
    function handleMove(x, y) {
        if(!isDragging || !v.isConnected) return;
        theta -= (x - lastX) * 0.015;
        phi -= (y - lastY) * 0.015;
        // 限制垂直翻轉角度，避免頭下腳上錯亂
        if(phi > Math.PI/2) phi = Math.PI/2;
        if(phi < -Math.PI/2) phi = -Math.PI/2;
        lastX = x; lastY = y;
        draw();
    }
    function handleUp() { isDragging = false; v.style.cursor = "grab"; }

    v.onmousedown = function(e) { handleDown(e.clientX, e.clientY); };
    window.addEventListener('mousemove', function(e) { handleMove(e.clientX, e.clientY); });
    window.addEventListener('mouseup', handleUp);
    v.addEventListener('touchstart', function(e) { handleDown(e.touches[0].clientX, e.touches[0].clientY); });
    window.addEventListener('touchmove', function(e) { handleMove(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, {passive: false});
    window.addEventListener('touchend', handleUp);

    function draw() {
      v.innerHTML = ""; 
      var cx = 250, cy = 130, h = 60, r = 70;
      var sides = (baseMode === 0) ? 3 : (baseMode === 1 ? 4 : 24); // 圓形用24邊形模擬
      var baseName = ["三角", "四角", "圓"][baseMode];
      var typeName = ["柱", "錐"][typeMode];
      var fullName = baseName + typeName;

      var nodes = [];
      var faces = [];
      var baseAngles = [];
      for(var i=0; i<sides; i++){ baseAngles.push(i * 2 * Math.PI / sides + (sides===4 ? Math.PI/4 : 0)); }

      // 建立 3D 幾何節點
      if (typeMode === 0) { // 柱體
          for(var i=0; i<sides; i++) nodes.push({x: r*Math.cos(baseAngles[i]), y: h, z: r*Math.sin(baseAngles[i])});
          for(var i=0; i<sides; i++) nodes.push({x: r*Math.cos(baseAngles[i]), y: -h, z: r*Math.sin(baseAngles[i])});
          faces.push({ id: Array.from({length:sides}, (_,i)=>i).reverse(), isBase: true }); // 上底面
          faces.push({ id: Array.from({length:sides}, (_,i)=>sides+i), isBase: true }); // 下底面
          for(var i=0; i<sides; i++) faces.push({ id: [i, (i+1)%sides, sides+(i+1)%sides, sides+i], isBase: false }); // 側面
      } else { // 錐體
          nodes.push({x: 0, y: h, z: 0}); // 頂點
          for(var i=0; i<sides; i++) nodes.push({x: r*Math.cos(baseAngles[i]), y: -h, z: r*Math.sin(baseAngles[i])});
          faces.push({ id: Array.from({length:sides}, (_,i)=>i+1), isBase: true }); // 底面
          for(var i=0; i<sides; i++) faces.push({ id: [0, i+1, (i+1)%sides + 1], isBase: false }); // 側面
      }

      // 3D 矩陣投影計算
      var pNodes = nodes.map(function(n) {
          var y1 = n.y * Math.cos(phi) - n.z * Math.sin(phi);
          var z1 = n.y * Math.sin(phi) + n.z * Math.cos(phi);
          var x2 = n.x * Math.cos(theta) + z1 * Math.sin(theta);
          var z2 = -n.x * Math.sin(theta) + z1 * Math.cos(theta);
          return { x: cx + x2, y: cy - y1, z: z2 };
      });

      // 判斷面相對於鏡頭的方向 (法向量計算)
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

      // 畫家演算法 (遠的先畫，近的後畫)
      faceData.sort(function(a, b){ return a.z - b.z; });
      var zOrder = 1;
      
      faceData.forEach(function(f) {
          var ptsStr = f.pts.map(function(pt){ return pt.x+","+pt.y; }).join(" ");
          var isCylinder = (sides === 24);
          var isSide = !f.isBase;
          var fillC = f.isBase ? "var(--p1)" : "#e0f2fe";
          var fillOp = f.isFront ? (f.isBase ? "0.85" : "0.9") : (f.isBase ? "0.3" : "0.1");
          if (isCylinder && isSide) fillOp = f.isFront ? "0.8" : "0.1";
          var strC = f.isBase ? "var(--p1)" : "var(--p2)";
          var strW = (isCylinder && isSide) ? 0.3 : (f.isFront ? 2 : 1.5);
          var dash = f.isFront ? "" : "4,4";

          NB.mk("polygon", { points: ptsStr, fill: fillC, "fill-opacity": fillOp, stroke: strC, "stroke-width": strW, "stroke-dasharray": dash, "stroke-linejoin": "round" }, v, zOrder++);
      });

      NB.t(v, 250, 245, fullName, { z: zOrder++, c: "var(--p1)", b: 1 });
      eq.innerHTML = '底面形狀是 <b style="color:var(--p1)">' + baseName + '形</b>，側面特徵是 <b style="color:var(--p2)">' + typeName + '體</b>。<br>組合起來就是：<b>' + fullName + '</b>！';
    }
    draw();
  }
});
