/* 五上 第十章 柱體、錐體和球 10.3：面與面的關係 */
NB.unit({
  title: "面與面的關係",
  ref: "五上・第十章 柱體、錐體和球・10.3 面與面的關係",
  q: "在長方體中，相鄰的面和相對的面有什麼關係？",
  steps: [
    "在柱體中，面與面有兩種常見的關係：",
    "1. 【互相平行】：像天花板和地板一樣，永遠不會相交。例如：上下兩個底面。",
    "2. 【互相垂直】：像牆壁和地板一樣，夾角剛好是 90 度。例如：底面與側面。"
  ],
  ch: { 
    q: "長方體的「上面」和「前面」是什麼關係？", 
    a: "互相垂直", 
    h: "它們相鄰並交於一條邊，夾角是 90 度直角。" 
  },
  tool: function(b, eq) {
    var dragHint = NB.h('<div style="margin-bottom:10px; color:#e91e63; font-weight:bold; font-size:16px;">✨ 3D 透視模式：你可以拖曳旋轉長方體，從各個角度觀察面與面的關係 ✨</div>');
    b.appendChild(dragHint);

    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var btns = [NB.h('<button class="pen on">互相平行的面 (相對)</button>'), NB.h('<button class="pen">互相垂直的面 (相鄰)</button>')];
    var currentMode = 0; 
    
    btns.forEach(function(btn, i) {
      btn.onclick = function() { btns.forEach(function(el){ el.classList.remove('on'); }); btn.classList.add('on'); currentMode = i; draw(); };
      btnRow.appendChild(btn);
    });
    b.appendChild(btnRow);
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center; touch-action:none;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, sans-serif";
    v.style.cursor = "grab";

    var theta = Math.PI / 6, phi = -Math.PI / 6;
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
      var cx = 250, cy = 130;
      var w = 100, h = 60, d = 80; // 長方體的寬、高、深

      // 8 個頂點座標 (以中心為原點)
      var nodes = [
          {x: -w, y: h, z: -d}, {x: w, y: h, z: -d}, {x: w, y: h, z: d}, {x: -w, y: h, z: d}, // 上底 4 點
          {x: -w, y: -h, z: -d}, {x: w, y: -h, z: -d}, {x: w, y: -h, z: d}, {x: -w, y: -h, z: d}  // 下底 4 點
      ];

      // 6 個面定義 (頂點索引)
      var faces = [
          { id: [0, 1, 2, 3], name: "上面", color: "var(--p1)" },
          { id: [7, 6, 5, 4], name: "下面", color: "var(--p2)" },
          { id: [0, 4, 5, 1], name: "前面", color: "var(--p1)" },
          { id: [2, 6, 7, 3], name: "後面", color: "#74b9ff" },
          { id: [3, 7, 4, 0], name: "左面", color: "#ff7675" },
          { id: [1, 5, 6, 2], name: "右面", color: "#ffeaa7" }
      ];

      var pNodes = nodes.map(function(nd) {
          var y1 = nd.y * Math.cos(phi) - nd.z * Math.sin(phi);
          var z1 = nd.y * Math.sin(phi) + nd.z * Math.cos(phi);
          var x2 = nd.x * Math.cos(theta) + z1 * Math.sin(theta);
          var z2 = -nd.x * Math.sin(theta) + z1 * Math.cos(theta);
          return { x: cx + x2, y: cy - y1, z: z2 };
      });

      var faceData = faces.map(function(f, idx) {
          var p = f.id.map(function(i){ return pNodes[i]; });
          var avgZ = p.reduce(function(s, pt){ return s + pt.z; }, 0) / p.length;
          
          // 高亮邏輯
          var isHighlighted = false;
          if (currentMode === 0) { // 平行 (上面與下面)
              if (idx === 0 || idx === 1) isHighlighted = true;
          } else { // 垂直 (上面與前面)
              if (idx === 0 || idx === 2) isHighlighted = true;
          }

          return { pts: p, z: avgZ, name: f.name, color: f.color, high: isHighlighted };
      });

      faceData.sort(function(a, b){ return a.z - b.z; });
      var zOrder = 1;

      faceData.forEach(function(f) {
          var ptsStr = f.pts.map(function(pt){ return pt.x+","+pt.y; }).join(" ");
          var fillC = f.high ? f.color : "#f8fafc";
          var fillOp = f.high ? "0.85" : "0.2";
          var strC = f.high ? f.color : "#94a3b8";
          var strW = f.high ? 3 : 1.5;

          NB.mk("polygon", { points: ptsStr, fill: fillC, "fill-opacity": fillOp, stroke: strC, "stroke-width": strW, "stroke-linejoin": "round" }, v, zOrder++);
      });

      if (currentMode === 0) {
          eq.innerHTML = '長方體的<b>上面</b>與<b>下面</b>永遠不會相交，它們是<b style="color:var(--p1)">互相平行</b>的面！';
      } else {
          eq.innerHTML = '長方體的<b>上面</b>與<b>前面</b>相鄰，夾角剛好是直角，它們是<b style="color:var(--p1)">互相垂直</b>的面！';
      }
    }
    draw();
  }
});