/* 五上 第十章 柱體、錐體和球 10.1：柱體和錐體的分類與命名 */
NB.unit({
  title: "柱體和錐體的分類與命名",
  ref: "五上・第十章 柱體、錐體和球・10.1 柱體和錐體的分類與命名",

  q: "立體圖形是怎麼命名的呢？",

  steps: [
    "立體圖形可以依照底面形狀，以及柱體或錐體來命名。",
    "柱體有上下兩個形狀、大小相同的底面；錐體有一個底面，側面會聚集到同一個頂點。",
    "底面是三角形，稱為三角；底面是四邊形，稱為四角；底面是圓形，稱為圓。",
    "例如，底面是圓形且有一個尖頂的立體圖形，稱為圓錐。"
  ],

  ch: {
    q: "底面是五邊形，且有上下兩個底面的圖形叫什麼？",
    a: "五角柱",
    h: "五邊形稱為五角形，有上下兩個底面的這種立體圖形是柱體。"
  },

  tool: function(b, eq) {

    /* =====================================
       1. 操作說明
    ===================================== */
    var dragHint = NB.h(
      '<div style="' +
        'margin-bottom:10px;' +
        'color:var(--p1);' +
        'font-weight:bold;' +
        'font-size:14px;' +
        'text-align:center;' +
      '">' +
        '按住圖形拖曳，即可旋轉觀察立體形狀。' +
      '</div>'
    );

    b.appendChild(dragHint);

    /* =====================================
       2. 分類按鈕
    ===================================== */
    var row1 = NB.h(
      '<div style="' +
        'margin-bottom:10px;' +
        'display:flex;' +
        'flex-wrap:wrap;' +
        'gap:8px;' +
        'justify-content:center;' +
      '"></div>'
    );

    var row2 = NB.h(
      '<div style="' +
        'margin-bottom:10px;' +
        'display:flex;' +
        'flex-wrap:wrap;' +
        'gap:8px;' +
        'justify-content:center;' +
        'border-top:1px dashed var(--soft);' +
        'padding-top:10px;' +
      '"></div>'
    );

    var typeMode = 0;
    var baseMode = 0;

    var tBtns = [
      NB.h('<button type="button" class="pen on">柱體</button>'),
      NB.h('<button type="button" class="pen">錐體</button>')
    ];

    var bBtns = [
      NB.h('<button type="button" class="pen on">三角形底面</button>'),
      NB.h('<button type="button" class="pen">四邊形底面</button>'),
      NB.h('<button type="button" class="pen">圓形底面</button>')
    ];

    function updateButtons(buttons, activeIndex) {
      buttons.forEach(function(btn, i) {
        btn.classList.toggle("on", i === activeIndex);
      });
    }

    tBtns.forEach(function(btn, i) {
      btn.addEventListener("click", function() {
        typeMode = i;
        updateButtons(tBtns, typeMode);
        scheduleDraw();
      });

      row1.appendChild(btn);
    });

    bBtns.forEach(function(btn, i) {
      btn.addEventListener("click", function() {
        baseMode = i;
        updateButtons(bBtns, baseMode);
        scheduleDraw();
      });

      row2.appendChild(btn);
    });

    b.appendChild(row1);
    b.appendChild(row2);

    /* =====================================
       3. SVG 畫布
    ===================================== */
    var st = NB.h(
      '<div class="stage" style="' +
        'background:var(--paper);' +
        'border:1px solid var(--soft);' +
        'border-radius:8px;' +
        'margin-top:10px;' +
        'width:100%;' +
        'overflow:hidden;' +
      '"></div>'
    );

    b.appendChild(st);

    var v = NB.svg(st, 500, 280);

    v.style.display = "block";
    v.style.width = "100%";
    v.style.height = "auto";
    v.style.aspectRatio = "500 / 280";
    v.style.cursor = "grab";
    v.style.touchAction = "none";
    v.style.userSelect = "none";
    v.style.webkitUserSelect = "none";

    v.setAttribute("viewBox", "0 0 500 280");
    v.setAttribute("preserveAspectRatio", "xMidYMid meet");

    /* =====================================
       4. 旋轉參數
    ===================================== */
    var theta = Math.PI / 6;
    var phi = -Math.PI / 8;

    var isDragging = false;
    var lastX = 0;
    var lastY = 0;
    var activePointerId = null;

    /* 限制每個畫面更新週期最多重繪一次 */
    var drawPending = false;
    var destroyed = false;

    function scheduleDraw() {
      if (drawPending || destroyed) return;

      drawPending = true;

      requestAnimationFrame(function() {
        drawPending = false;

        if (destroyed || !v.isConnected) return;

        draw();
      });
    }

    function handleDown(x, y) {
      isDragging = true;
      lastX = x;
      lastY = y;
      v.style.cursor = "grabbing";
    }

    function handleMove(x, y) {
      if (!isDragging || destroyed || !v.isConnected) {
        return;
      }

      theta -= (x - lastX) * 0.012;
      phi -= (y - lastY) * 0.012;

      /* 限制垂直旋轉角度 */
      phi = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, phi)
      );

      lastX = x;
      lastY = y;

      scheduleDraw();
    }

    function handleUp() {
      isDragging = false;
      activePointerId = null;
      v.style.cursor = "grab";
    }

    /* =====================================
       5. 統一使用 Pointer Events
       適用滑鼠、觸控螢幕及觸控筆
    ===================================== */
    v.addEventListener("pointerdown", function(e) {
      if (e.pointerType === "mouse" && e.button !== 0) {
        return;
      }

      e.preventDefault();

      activePointerId = e.pointerId;

      handleDown(e.clientX, e.clientY);

      try {
        v.setPointerCapture(e.pointerId);
      } catch (err) {}
    });

    v.addEventListener("pointermove", function(e) {
      if (!isDragging || e.pointerId !== activePointerId) {
        return;
      }

      e.preventDefault();

      handleMove(e.clientX, e.clientY);
    });

    v.addEventListener("pointerup", function(e) {
      if (e.pointerId === activePointerId) {
        handleUp();
      }
    });

    v.addEventListener("pointercancel", function(e) {
      if (e.pointerId === activePointerId) {
        handleUp();
      }
    });

    v.addEventListener("lostpointercapture", function() {
      handleUp();
    });

    /* =====================================
       6. 產生立體圖形
    ===================================== */
    function draw() {
      if (destroyed || !v.isConnected) return;

      /* 清除上一幀的 SVG 元素 */
      while (v.firstChild) {
        v.removeChild(v.firstChild);
      }

      var cx = 250;
      var cy = 130;
      var h = 60;
      var r = 70;

      var sides = baseMode === 0
        ? 3
        : baseMode === 1
          ? 4
          : 48;

      var baseName = ["三角", "四角", "圓"][baseMode];
      var typeName = ["柱", "錐"][typeMode];
      var fullName = baseName + typeName;

      var nodes = [];
      var faces = [];
      var baseAngles = [];

      for (var i = 0; i < sides; i++) {
        baseAngles.push(
          i * 2 * Math.PI / sides +
          (sides === 4 ? Math.PI / 4 : 0)
        );
      }

      /* -----------------------------
         建立柱體或錐體的頂點與面
      ----------------------------- */
      if (typeMode === 0) {

        /* 柱體：上下兩個底面 */
        for (var i = 0; i < sides; i++) {
          nodes.push({
            x: r * Math.cos(baseAngles[i]),
            y: h,
            z: r * Math.sin(baseAngles[i])
          });
        }

        for (var i = 0; i < sides; i++) {
          nodes.push({
            x: r * Math.cos(baseAngles[i]),
            y: -h,
            z: r * Math.sin(baseAngles[i])
          });
        }

        faces.push({
          id: Array.from(
            { length: sides },
            function(_, i) { return i; }
          ).reverse(),
          isBase: true
        });

        faces.push({
          id: Array.from(
            { length: sides },
            function(_, i) { return sides + i; }
          ),
          isBase: true
        });

        for (var i = 0; i < sides; i++) {
          faces.push({
            id: [
              i,
              (i + 1) % sides,
              sides + (i + 1) % sides,
              sides + i
            ],
            isBase: false
          });
        }

      } else {

        /* 錐體：一個頂點與一個底面 */
        nodes.push({
          x: 0,
          y: h,
          z: 0
        });

        for (var i = 0; i < sides; i++) {
          nodes.push({
            x: r * Math.cos(baseAngles[i]),
            y: -h,
            z: r * Math.sin(baseAngles[i])
          });
        }

        faces.push({
          id: Array.from(
            { length: sides },
            function(_, i) { return i + 1; }
          ),
          isBase: true
        });

        for (var i = 0; i < sides; i++) {
          faces.push({
            id: [
              0,
              i + 1,
              (i + 1) % sides + 1
            ],
            isBase: false
          });
        }
      }

      /* -----------------------------
         3D 旋轉與投影
      ----------------------------- */
      var cosPhi = Math.cos(phi);
      var sinPhi = Math.sin(phi);
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);

      var pNodes = nodes.map(function(n) {
        var y1 = n.y * cosPhi - n.z * sinPhi;
        var z1 = n.y * sinPhi + n.z * cosPhi;

        var x2 = n.x * cosTheta + z1 * sinTheta;
        var z2 = -n.x * sinTheta + z1 * cosTheta;

        return {
          x: cx + x2,
          y: cy - y1,
          z: z2
        };
      });

      /* -----------------------------
         判斷各面的朝向
      ----------------------------- */
      var faceData = faces.map(function(f) {
        var p = f.id.map(function(idx) {
          return pNodes[idx];
        });

        var avgZ = p.reduce(function(sum, pt) {
          return sum + pt.z;
        }, 0) / p.length;

        var orig = f.id.map(function(idx) {
          return nodes[idx];
        });

        var u = {
          x: orig[1].x - orig[0].x,
          y: orig[1].y - orig[0].y,
          z: orig[1].z - orig[0].z
        };

        var vecV = {
          x: orig[2].x - orig[1].x,
          y: orig[2].y - orig[1].y,
          z: orig[2].z - orig[1].z
        };

        var nx = u.y * vecV.z - u.z * vecV.y;
        var ny = u.z * vecV.x - u.x * vecV.z;
        var nz = u.x * vecV.y - u.y * vecV.x;

        var rotatedY = ny * cosPhi - nz * sinPhi;
        var rotatedZ = ny * sinPhi + nz * cosPhi;

        var projectedNZ =
          -nx * sinTheta + rotatedZ * cosTheta;

        return {
          pts: p,
          z: avgZ,
          isFront: projectedNZ > 0,
          isBase: f.isBase
        };
      });

      /* 遠的面先畫，近的面後畫 */
      faceData.sort(function(a, b) {
        return a.z - b.z;
      });

      /* -----------------------------
         繪製各個面
      ----------------------------- */
      faceData.forEach(function(f) {
        var ptsStr = f.pts.map(function(pt) {
          return pt.x + "," + pt.y;
        }).join(" ");

        var isRound = sides > 4;
        var isSide = !f.isBase;

        var fillC = f.isBase
          ? "var(--p1)"
          : "#e0f2fe";

        var fillOp = f.isFront
          ? (f.isBase ? "0.85" : "0.9")
          : (f.isBase ? "0.3" : "0.1");

        if (isRound && isSide) {
          fillOp = f.isFront ? "0.8" : "0.1";
        }

        var strC = f.isBase
          ? "var(--p1)"
          : "var(--p2)";

        var strW = isRound && isSide
          ? 0.5
          : (f.isFront ? 2 : 1.5);

        var dash = f.isFront ? "" : "4,4";

        NB.mk("polygon", {
          points: ptsStr,
          fill: fillC,
          "fill-opacity": fillOp,
          stroke: strC,
          "stroke-width": strW,
          "stroke-dasharray": dash,
          "stroke-linejoin": "round"
        }, v);
      });

      /* -----------------------------
         名稱標籤
      ----------------------------- */
      NB.t(
        v,
        250,
        245,
        fullName,
        {
          c: "var(--p1)",
          b: 1
        }
      );

      eq.innerHTML =
        '底面形狀是 <b style="color:var(--p1)">' +
        baseName +
        '形</b>，立體類型是 <b style="color:var(--p2)">' +
        typeName +
        '體</b>。<br>' +
        '組合起來就是：<b>' +
        fullName +
        '</b>！';
    }

    /* =====================================
       7. 初次繪圖
    ===================================== */
    draw();
  }
});
