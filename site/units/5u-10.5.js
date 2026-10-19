/* 五上 第十章 柱體、錐體和球 10.5：球 */
NB.unit({
  title: "球",
  ref: "五上・第十章 柱體、錐體和球・10.5 球",
  q: "把一顆球切開，它的「<span class='hl'>剖面</span>」會是什麼形狀？",
  steps: [
    "1. 球體的表面沒有任何平平的面，全部都是圓滑的。",
    "2. 球的中心點叫作「球心」，從球心到表面任意一點的距離都一樣長，稱為「半徑」。",
    "3. 不管從哪個方向、哪個高度切開球體，剖面「一定都是圓形」。",
    "4. 當切割面剛好「通過球心」時，切出來的圓會是最大的！"
  ],
  ch: { 
    q: "把一顆西瓜（當作完美的球體）切一刀，切面會是正方形嗎？", 
    a: "不會，是圓形", 
    h: "球體的任何平切面都是圓形。" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">拖曳滑桿改變「切割刀」的高度，觀察藍色剖面的大小變化：</div>');
    b.appendChild(desc);
    
    var slider = NB.slider(b, "切割高度", 0, 75, 1, 0, "", function(){ draw() });
    b.appendChild(slider.container); // 確保滑桿正確掛載
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, sans-serif";

    function draw() {
      v.innerHTML = ""; 
      var cx = 250, cy = 130, R = 90; 
      var cutY = slider.v; 
      
      NB.mk("circle", { cx: cx, cy: cy, r: R, fill: "#f8fafc", stroke: "#cbd5e1", "stroke-width": 3 }, v, 1);
      NB.mk("circle", { cx: cx, cy: cy, r: 4, fill: "#e91e63" }, v, 3);
      NB.t(v, cx-30, cy+6, "球心", { z: 14, c: "#e91e63", b: 1 });
      
      NB.mk("ellipse", { cx: cx, cy: cy, rx: R, ry: R*0.3, fill: "none", stroke: "#cbd5e1", "stroke-width": 2, "stroke-dasharray": "4,4" }, v, 2);

      var cutRadius = Math.sqrt(R*R - cutY*cutY);
      var currentCy = cy - cutY; 
      
      NB.mk("ellipse", { cx: cx, cy: currentCy, rx: cutRadius, ry: cutRadius*0.3, fill: "var(--p1)", "fill-opacity": "0.6", stroke: "var(--p1)", "stroke-width": 3 }, v, 4);
      NB.mk("line", { x1: cx, y1: currentCy, x2: cx + cutRadius, y2: currentCy, stroke: "#ffffff", "stroke-width": 2 }, v, 5);
      NB.mk("circle", { cx: cx, cy: currentCy, r: 3, fill: "#ffffff" }, v, 6); 

      NB.mk("line", { x1: cx - R - 20, y1: currentCy, x2: cx - R - 10, y2: currentCy, stroke: "var(--p1)", "stroke-width": 2 }, v, 5);

      if (cutY === 0) {
          eq.innerHTML = '現在切割刀剛好「<b>通過球心</b>」！<br>此時切出來的圓形剖面是<b style="color:var(--p1)">最大</b>的。';
      } else {
          eq.innerHTML = '無論從哪裡切，剖面一定都是<b style="color:var(--p1)">圓形</b>。<br>距離球心越遠（高度越高），切出來的圓就越小！';
      }
    }
    draw();
  }
});