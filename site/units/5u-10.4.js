/* 五上 第十章 柱體、錐體和球 10.4：柱體和錐體的展開圖 */
NB.unit({
  title: "柱體和錐體的展開圖",
  ref: "五上・第十章 柱體、錐體和球・10.4 柱體和錐體的展開圖",
  q: "把立體圖形沿著邊剪開平鋪，會變成什麼樣子？",
  steps: [
    "把立體圖形剪開平鋪的圖形，叫作「展開圖」。",
    "角柱的展開圖：側面會展開成數個長方形，上下各有一個全等的多邊形底面。",
    "圓柱的展開圖：側面會展開成 1 個大長方形，上下各有一個全等的圓形底面。"
  ],
  ch: { 
    q: "圓柱展開後的「大長方形」，它的長度跟什麼有關？", 
    a: "圓形底面的圓周長", 
    h: "長方形的長剛好可以繞底面一圈。" 
  },
  tool: function(b, eq) {
    var topRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var botRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center; border-top:1px dashed #ccc; padding-top:10px;"></div>');
    
    var tBtns = [NB.h('<button class="pen on">三角柱</button>'), NB.h('<button class="pen">圓柱</button>')];
    var sBtns = [NB.h('<button class="pen on">3D 立體圖 (可旋轉)</button>'), NB.h('<button class="pen">2D 展開圖</button>')];
    var currentType = 0; // 0: 三角, 1: 圓
    var currentView = 0; // 0: 3D, 1: 2D
    
    tBtns.forEach(function(btn, i) {
      btn.onclick = function() { tBtns.forEach(function(el){ el.classList.remove('on'); }); btn.classList.add('on'); currentType = i; draw(); };
      topRow.appendChild(btn);
    });
    sBtns.forEach(function(btn, i) {
      btn.onclick = function() { 
          sBtns.forEach(function(el){ el.classList.remove('on'); }); 
          btn.classList.add('on'); 
          currentView = i; 
          v.style.cursor = (i === 0) ? "grab" : "default";
          draw(); 
      };
      botRow.appendChild(btn);
    });
    b.appendChild(topRow); b.appendChild(botRow);
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center; touch-action:none;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, sans-serif";
    v.style.cursor = "grab";

    var theta = Math.PI / 6, phi = -Math.PI / 6;
    var isDragging = false, lastX = 0, lastY = 0;
    
    v.onmousedown = function(e) { if(currentView!==0)return; isDragging = true; lastX = e.clientX; lastY = e.clientY; v.style.cursor = "grabbing"; };
    window.addEventListener('mousemove', function(e) {
        if(!isDragging || !v.isConnected || currentView!==0) return;
        theta -= (e.clientX - lastX) * 0.015; phi -= (e.clientY - lastY) * 0.015;
        if(phi > Math.PI/2) phi = Math.PI/2; if(phi < -Math.PI/2) phi = -Math.PI/2;
        lastX = e.clientX; lastY = e.clientY; draw();
    });
    window.addEventListener('mouseup', function(){ isDragging = false; if(currentView===0) v.style.cursor = "grab"; });

    function draw() {
      v.innerHTML = ""; 
      
      if (currentView === 0) { // 3D 旋轉模式
          var cx = 250, cy = 130, h = 60, r = 60;
          var sides = (currentType === 0) ? 3 : 24;
          var nodes = [], faces = [];
          var baseAngles = [];
          for(var i=0; i<sides; i++){ baseAngles.push(i * 2 * Math.PI / sides); }

          for(var i=0; i<sides; i++) nodes.push({x: r*Math.cos(baseAngles[i]), y: h, z: r*Math.sin(baseAngles[i])});
          for(var i=0; i<sides; i++) nodes.push({x: r*Math.cos(baseAngles[i]), y: -h, z: r*Math.sin(baseAngles[i])});
          faces.push({ id: Array.from({length:sides}, (_,i)=>i).reverse(), isBase: true }); 
          faces.push({ id: Array.from({length:sides}, (_,i)=>sides+i), isBase: true }); 
          for(var i=0; i<sides; i++) faces.push({ id: [i, (i+1)%sides, sides+(i+1)%sides, sides+i], isBase: false }); 

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
              var fillC = f.isBase ? "var(--p1)" : "var(--p2)";
              var fillOp = f.isFront ? "0.8" : "0.2";
              NB.mk("polygon", { points: ptsStr, fill: fillC, "fill-opacity": fillOp, stroke: "#fff", "stroke-width": 1.5, "stroke-linejoin": "round" }, v, zOrder++);
          });

          eq.innerHTML = (currentType === 0 ? '三角柱' : '圓柱') + '的 3D 立體外觀，試著用滑鼠旋轉它看看！';
          
      } else { // 2D 展開圖
          var cx = 250, cy = 130;
          if (currentType === 0) { 
              var w = 50, h = 100, th = 40;
              NB.mk("rect", { x: cx-w*1.5, y: cy-h/2, width: w, height: h, fill: "var(--p2)", "fill-opacity": "0.4", stroke: "#fff", "stroke-width": 2 }, v, 1);
              NB.mk("rect", { x: cx-w/2, y: cy-h/2, width: w, height: h, fill: "var(--p2)", "fill-opacity": "0.4", stroke: "#fff", "stroke-width": 2 }, v, 1);
              NB.mk("rect", { x: cx+w/2, y: cy-h/2, width: w, height: h, fill: "var(--p2)", "fill-opacity": "0.4", stroke: "#fff", "stroke-width": 2 }, v, 1);
              NB.mk("polygon", { points: (cx-w/2)+","+(cy-h/2)+" "+(cx+w/2)+","+(cy-h/2)+" "+cx+","+(cy-h/2-th), fill: "var(--p1)", "fill-opacity": "0.8", stroke: "#fff", "stroke-width": 2 }, v, 2);
              NB.mk("polygon", { points: (cx-w/2)+","+(cy+h/2)+" "+(cx+w/2)+","+(cy+h/2)+" "+cx+","+(cy+h/2+th), fill: "var(--p1)", "fill-opacity": "0.8", stroke: "#fff", "stroke-width": 2 }, v, 2);
              eq.innerHTML = '三角柱剪開後，側面變成 3 個長方形，上下各 1 個三角形底面。';
          } else { 
              var w = 180, h = 80, r = 30;
              NB.mk("rect", { x: cx-w/2, y: cy-h/2, width: w, height: h, fill: "var(--p2)", "fill-opacity": "0.4", stroke: "var(--p2)", "stroke-width": 2 }, v, 1);
              NB.mk("circle", { cx: cx, cy: cy-h/2-r, r: r, fill: "var(--p1)", "fill-opacity": "0.8", stroke: "none" }, v, 2);
              NB.mk("circle", { cx: cx, cy: cy+h/2+r, r: r, fill: "var(--p1)", "fill-opacity": "0.8", stroke: "none" }, v, 2);
              NB.mk("line", { x1: cx-w/2, y1: cy+h/2+10, x2: cx+w/2, y2: cy+h/2+10, stroke: "var(--p1)", "stroke-width": 2, "stroke-dasharray":"4,4" }, v, 3);
              NB.t(v, cx, cy+h/2+25, "長度剛好等於圓周長", { z: 14, c: "var(--p1)", b: 1 });
              eq.innerHTML = '圓柱剪開後，側面變成 1 個大長方形，上下各 1 個圓形底面。';
          }
      }
    }
    draw();
  }
});
