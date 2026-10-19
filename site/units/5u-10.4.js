/* 五上 第十章 柱體、錐體和球 10.4：柱體和錐體的展開圖 */
NB.unit({
  title: "柱體和錐體的展開圖",
  ref: "五上・第十章 柱體、錐體和球・10.4 柱體和錐體的展開圖",
  q: "把立體圖形沿著邊剪開平鋪，會變成什麼樣子？",
  steps: [
    "把立體圖形剪開平鋪的圖形，叫作「展開圖」。",
    "1. 角柱的展開圖：側面會展開成數個長方形，上下各有一個全等的多邊形底面。",
    "2. 圓柱的展開圖：側面會展開成 1 個大長方形，上下各有一個全等的圓形底面。"
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
    var sBtns = [NB.h('<button class="pen on">立體圖</button>'), NB.h('<button class="pen">展開圖</button>')];
    var currentType = 0; // 0: 三角, 1: 圓
    var currentView = 0; // 0: 3D, 1: 2D
    
    tBtns.forEach(function(btn, i) {
      btn.onclick = function() { tBtns.forEach(function(el){ el.classList.remove('on'); }); btn.classList.add('on'); currentType = i; draw(); };
      topRow.appendChild(btn);
    });
    sBtns.forEach(function(btn, i) {
      btn.onclick = function() { sBtns.forEach(function(el){ el.classList.remove('on'); }); btn.classList.add('on'); currentView = i; draw(); };
      botRow.appendChild(btn);
    });
    b.appendChild(topRow); b.appendChild(botRow);
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, sans-serif";

    function draw() {
      v.innerHTML = ""; 
      
      if (currentView === 0) { // 3D 立體圖
          var cx = 250, cyTop = 60, cyBot = 180, rX = 60, rY = 20;
          if (currentType === 0) { // 三角柱
              var ptsT = [], ptsB = [];
              for(var i=0; i<3; i++){
                  var px = cx + rX * Math.cos(-Math.PI/2 + i*2*Math.PI/3);
                  var py = cyTop + rY * Math.sin(-Math.PI/2 + i*2*Math.PI/3);
                  ptsT.push({x: px, y: py}); ptsB.push({x: px, y: py+(cyBot-cyTop)});
              }
              for(var j=0; j<3; j++){
                  var next = (j+1)%3;
                  if (j===0 || j===1) NB.mk("polygon", { points: ptsT[j].x+","+ptsT[j].y+" "+ptsT[next].x+","+ptsT[next].y+" "+ptsB[next].x+","+ptsB[next].y+" "+ptsB[j].x+","+ptsB[j].y, fill: "var(--p2)", "fill-opacity":"0.4", stroke: "var(--p2)", "stroke-width": 2, "stroke-linejoin":"round" }, v, 1);
              }
              NB.mk("polygon", { points: ptsT.map(function(p){return p.x+","+p.y}).join(" "), fill: "var(--p1)", "fill-opacity": "0.8", stroke: "var(--p1)", "stroke-width": 2 }, v, 2);
              NB.mk("polygon", { points: ptsB.map(function(p){return p.x+","+p.y}).join(" "), fill: "var(--p1)", "fill-opacity": "0.8", stroke: "var(--p1)", "stroke-width": 2 }, v, 2);
              eq.innerHTML = '三角柱的立體外觀，上下是兩個三角形，旁邊包著三個長方形。';
          } else { // 圓柱
              NB.mk("path", { d: "M "+(cx-rX)+" "+cyTop+" L "+(cx-rX)+" "+cyBot+" A "+rX+" "+rY+" 0 0 0 "+(cx+rX)+" "+cyBot+" L "+(cx+rX)+" "+cyTop, fill: "var(--p2)", "fill-opacity":"0.4", stroke: "var(--p2)", "stroke-width": 3 }, v, 1);
              NB.mk("ellipse", { cx: cx, cy: cyTop, rx: rX, ry: rY, fill: "var(--p1)", "fill-opacity": "0.8", stroke: "var(--p1)", "stroke-width": 3 }, v, 2);
              NB.mk("ellipse", { cx: cx, cy: cyBot, rx: rX, ry: rY, fill: "var(--p1)", "fill-opacity": "0.8", stroke: "var(--p1)", "stroke-width": 3 }, v, 2);
              eq.innerHTML = '圓柱的立體外觀，上下是兩個圓形，旁邊是一圈平滑的曲面。';
          }
      } else { // 2D 展開圖
          var cx = 250, cy = 130;
          if (currentType === 0) { // 三角柱展開
              var w = 50, h = 100, th = 40;
              // 中間三個長方形 (側面)
              NB.mk("rect", { x: cx-w*1.5, y: cy-h/2, width: w, height: h, fill: "var(--p2)", "fill-opacity": "0.4", stroke: "#fff", "stroke-width": 2 }, v, 1);
              NB.mk("rect", { x: cx-w/2, y: cy-h/2, width: w, height: h, fill: "var(--p2)", "fill-opacity": "0.4", stroke: "#fff", "stroke-width": 2 }, v, 1);
              NB.mk("rect", { x: cx+w/2, y: cy-h/2, width: w, height: h, fill: "var(--p2)", "fill-opacity": "0.4", stroke: "#fff", "stroke-width": 2 }, v, 1);
              // 上下三角形
              NB.mk("polygon", { points: (cx-w/2)+","+(cy-h/2)+" "+(cx+w/2)+","+(cy-h/2)+" "+cx+","+(cy-h/2-th), fill: "var(--p1)", "fill-opacity": "0.8", stroke: "#fff", "stroke-width": 2 }, v, 2);
              NB.mk("polygon", { points: (cx-w/2)+","+(cy+h/2)+" "+(cx+w/2)+","+(cy+h/2)+" "+cx+","+(cy+h/2+th), fill: "var(--p1)", "fill-opacity": "0.8", stroke: "#fff", "stroke-width": 2 }, v, 2);
              eq.innerHTML = '三角柱剪開後，側面變成 3 個長方形，上下各 1 個三角形底面。';
          } else { // 圓柱展開
              var w = 180, h = 80, r = 30;
              // 側面大長方形
              NB.mk("rect", { x: cx-w/2, y: cy-h/2, width: w, height: h, fill: "var(--p2)", "fill-opacity": "0.4", stroke: "var(--p2)", "stroke-width": 2 }, v, 1);
              // 上下圓形
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