
/* 五上 第十章 柱體、錐體和球 10.5：球 */
NB.unit({
  title: "球",
  ref: "五上・第十章 柱體、錐體和球・10.5 球",

  q: "把一顆球切開，它的「<span class='hl'>剖面</span>」會是什麼形狀？",

  steps: [
    "球體的表面沒有平平的面，整個表面都是曲面。",
    "球的中心點叫作「球心」，從球心到球面任意一點的距離都一樣長，稱為「半徑」。",
    "用平面切開球體，切面會是圓形；如果切割平面與球面相切，則切面退化成一個點。",
    "當切割平面通過球心時，切出的圓最大，這個圓的半徑就是球的半徑。"
  ],

  ch: {
    q: "把一顆西瓜（當作完美的球體）切一刀，切面會是正方形嗎？",
    a: "不會，是圓形",
    h: "球體被平面切開時，切面是圓形。"
  },

  tool: function(b, eq) {
    /* ==============================
       1. 互動說明
    ============================== */
    var desc = document.createElement("div");

    desc.style.marginBottom = "6px";
    desc.style.color = "var(--text-gray)";
    desc.style.textAlign = "center";
    desc.textContent =
      "拖曳滑桿，改變切割平面與球心的距離，觀察剖面大小。";

    b.appendChild(desc);

    /* ==============================
       2. 建立滑桿
       注意：NB.slider 會自動將滑桿加入 b
       回傳值是 { el, v }，不是 { container, v }
    ============================== */
    var R = 85;

    var slider = NB.slider(
      b,
      "切割距離（離球心）",
      0,
      R,
      1,
      0,
      "",
      function() {
        draw();
      }
    );

    /* 不要再寫 b.appendChild(slider.container) */

    /* ==============================
       3. 建立繪圖區
    ============================== */
    var st = NB.h(
      '<div class="stage" style="' +
        'background:var(--paper);' +
        'border-radius:8px;' +
        'margin-top:8px;' +
        'text-align:center;' +
        'overflow:hidden;' +
        'width:100%;' +
        'box-sizing:border-box;' +
      '"></div>'
    );

    b.appendChild(st);

    var v = NB.svg(st, 500, 280);

    v.style.fontFamily =
      "system-ui, -apple-system, sans-serif";
    v.style.display = "block";
    v.style.width = "100%";
    v.style.maxWidth = "100%";
    v.style.height = "auto";
    v.style.boxSizing = "border-box";

    /* ==============================
       4. 繪圖函式
    ============================== */
    function draw() {
      v.innerHTML = "";

      var cx = 250;
      var cy = 135;

      /* 讀取滑桿數值 */
      var d = Number(slider.v);

      if (!Number.isFinite(d)) {
        d = 0;
      }

      d = Math.max(0, Math.min(R, d));

      /* 剖面圓半徑：r = √(R² - d²) */
      var cutRadius = Math.sqrt(
        Math.max(0, R * R - d * d)
      );

      /* 切割平面位置 */
      var cutCy = cy - d;

      /* ------------------------------
         球體外框
      ------------------------------ */
      NB.mk("circle", {
        cx: cx,
        cy: cy,
        r: R,
        fill: "#f8fafc",
        stroke: "#94a3b8",
        "stroke-width": 3
      }, v, 1);

      /* 球體赤道參考線 */
      NB.mk("ellipse", {
        cx: cx,
        cy: cy,
        rx: R,
        ry: R * 0.3,
        fill: "none",
        stroke: "#cbd5e1",
        "stroke-width": 1.5,
        "stroke-dasharray": "5,5"
      }, v, 2);

      /* 球心 */
      NB.mk("circle", {
        cx: cx,
        cy: cy,
        r: 4,
        fill: "#e91e63"
      }, v, 3);

      NB.t(
        v,
        cx + 12,
        cy + 18,
        "球心",
        {
          z: 13,
          c: "#e91e63",
          b: 1
        }
      );

      /* ------------------------------
         球心至切割平面的距離
      ------------------------------ */
      if (d > 0) {
        NB.mk("line", {
          x1: cx,
          y1: cy,
          x2: cx,
          y2: cutCy,
          stroke: "#64748b",
          "stroke-width": 2,
          "stroke-dasharray": "4,4"
        }, v, 3);

        NB.t(
          v,
          cx + 36,
          (cy + cutCy) / 2,
          "距離 d",
          {
            z: 12,
            c: "#64748b"
          }
        );
      }

      /* ------------------------------
         剖面圓
         使用橢圓呈現立體透視效果
      ------------------------------ */
      if (cutRadius > 0.01) {
        NB.mk("ellipse", {
          cx: cx,
          cy: cutCy,
          rx: cutRadius,
          ry: cutRadius * 0.3,
          fill: "var(--p1)",
          "fill-opacity": 0.65,
          stroke: "var(--p1)",
          "stroke-width": 2.5
        }, v, 4);

        /* 剖面半徑 */
        NB.mk("line", {
          x1: cx,
          y1: cutCy,
          x2: cx + cutRadius,
          y2: cutCy,
          stroke: "#ffffff",
          "stroke-width": 2
        }, v, 5);

        NB.mk("circle", {
          cx: cx,
          cy: cutCy,
          r: 3,
          fill: "#ffffff"
        }, v, 6);

        /* 半徑標籤：依剖面大小調整位置 */
        var labelX = cx + cutRadius / 2;
        var labelY = cutCy - Math.max(
          8,
          cutRadius * 0.3 + 8
        );

        NB.t(
          v,
          labelX,
          labelY,
          "剖面半徑",
          {
            z: 11,
            c: "var(--p1)",
            b: 1
          }
        );
      } else {
        /* 相切時，剖面縮小成一個點 */
        NB.mk("circle", {
          cx: cx,
          cy: cutCy,
          r: 4,
          fill: "var(--p1)"
        }, v, 4);
      }

      /* ------------------------------
         切割平面示意線
      ------------------------------ */
      var planeLeft = cx - R - 12;
      var planeRight = cx + R + 12;

      NB.mk("line", {
        x1: planeLeft,
        y1: cutCy,
        x2: planeRight,
        y2: cutCy,
        stroke: "var(--p1)",
        "stroke-width": 1.5,
        "stroke-dasharray": "5,5",
        opacity: 0.8
      }, v, 1);

      /* ------------------------------
         下方文字說明
      ------------------------------ */
      if (d === 0) {
        eq.innerHTML =
          '切割平面通過「<b>球心</b>」！<br>' +
          '切出的剖面圓最大，半徑等於球的半徑。<br>' +
          '<b style="color:var(--p1)">剖面半徑 = R = ' +
          R +
          '</b>';

      } else if (d === R) {
        eq.innerHTML =
          '切割平面與球面相切。<br>' +
          '剖面縮小成一個點，半徑為 ' +
          '<b style="color:var(--p1)">0</b>。';

      } else {
        eq.innerHTML =
          '切割平面離球心 ' +
          '<b style="color:var(--p1)">d = ' +
          d +
          '</b>。<br>' +
          '剖面仍是圓形，半徑為：<br>' +
          '<b style="color:var(--p1)">' +
          'r = √(R² − d²) = ' +
          cutRadius.toFixed(1) +
          '</b><br>' +
          '離球心越遠，剖面圓越小。';
      }
    }

    /* 初次載入立即繪圖 */
    draw();
  }
});
