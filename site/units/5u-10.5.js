
/* 五上 第十章 柱體、錐體和球 10.5：球 */
NB.unit({
  title: "球",
  ref: "五上・第十章 柱體、錐體和球・10.5 球",

  q: "把一顆球切開，它的「<span class='hl'>剖面</span>」會是什麼形狀？",

  steps: [
    "球體的表面沒有平平的面，整個表面都是曲面。",
    "球的中心點叫作「球心」，從球心到球面任意一點的距離都一樣長，稱為「半徑」。",
    "用平面切開球體，切面會是圓形（特殊情況下，切面與球相切，只有一個點）。",
    "當切割平面通過球心時，切出的圓最大，這個圓的半徑就是球的半徑。"
  ],

  ch: {
    q: "把一顆西瓜（當作完美的球體）切一刀，切面會是正方形嗎？",
    a: "不會，是圓形",
    h: "球體被平面切開時，切面是圓形。"
  },

  tool: function(b, eq) {

    /* 互動說明 */
    var desc = document.createElement("div");

    desc.style.marginBottom = "6px";
    desc.style.color = "var(--text-gray)";
    desc.style.textAlign = "center";
    
    desc.textContent =
      "拖曳滑桿，改變切割平面與球心的距離，觀察剖面大小。";
    
    b.appendChild(desc);

    /* 切割距離：0 到半徑 */
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

    b.appendChild(slider.container);

    /* 繪圖區 */
    var st = NB.h(
      '<div class="stage" style="' +
      'background:var(--paper);' +
      'border-radius:8px;' +
      'margin-top:8px;' +
      'text-align:center;' +
      'overflow:hidden;' +
      '"></div>'
    );

    b.appendChild(st);

    var v = NB.svg(st, 500, 260);
    v.style.fontFamily = "system-ui, -apple-system, sans-serif";
    v.style.maxWidth = "100%";
    v.style.height = "auto";

    function draw() {

      v.innerHTML = "";

      var cx = 250;
      var cy = 125;

      /* 確保讀取到有效的滑桿數值 */
      var d = Number(slider.v);

      if (!Number.isFinite(d)) {
        d = 0;
      }

      d = Math.max(0, Math.min(R, d));

      /* 球心到切割平面的距離 */
      var cutRadius = Math.sqrt(
        Math.max(0, R * R - d * d)
      );

      /*
       * 示意圖採用球的正面投影。
       * 切割平面平行於畫面，距球心 d。
       * 因此切面圓心位於球心上方 d 的位置。
       */

      var cutCy = cy - d;

      /* 球體輪廓 */
      NB.mk("circle", {
        cx: cx,
        cy: cy,
        r: R,
        fill: "#f8fafc",
        stroke: "#94a3b8",
        "stroke-width": 3
      }, v, 1);

      /* 球體赤道：虛線表示球面上的參考線 */
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
        cx + 9,
        cy + 17,
        "球心",
        {
          z: 13,
          c: "#e91e63",
          b: 1
        }
      );

      /* 球心至切割平面的距離 d */
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
          cx + 10,
          (cy + cutCy) / 2,
          "距離 d",
          {
            z: 12,
            c: "#64748b"
          }
        );
      }

      /*
       * 剖面圓的透視示意。
       * 正面觀看時，圓形以橢圓呈現立體感。
       * rx 是實際剖面半徑，ry 為視覺透視縮短。
       */
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

        NB.t(
          v,
          cx + cutRadius / 2,
          cutCy - 8,
          "剖面半徑",
          {
            z: 11,
            c: "var(--p1)",
            b: 1
          }
        );

      } else {

        /* 切割面與球相切時，剖面縮小為一個點 */
        NB.mk("circle", {
          cx: cx,
          cy: cutCy,
          r: 4,
          fill: "var(--p1)"
        }, v, 4);
      }

      /* 顯示切割平面位置 */
      NB.mk("line", {
        x1: cx - R - 12,
        y1: cutCy,
        x2: cx - cutRadius,
        y2: cutCy,
        stroke: "var(--p1)",
        "stroke-width": 2,
        "stroke-dasharray": "4,4"
      }, v, 5);

      /* 更新下方文字 */
      if (d === 0) {

        eq.innerHTML =
          '切割平面通過「<b>球心</b>」！<br>' +
          '切出的剖面圓最大，半徑等於球的半徑 ' +
          '<b style="color:var(--p1)">R = ' + R + '</b>。';

      } else if (d === R) {

        eq.innerHTML =
          '切割平面剛好與球面相切。<br>' +
          '剖面縮小成一個點，圓的半徑為 <b>0</b>。';

      } else {

        eq.innerHTML =
          '切割平面離球心 ' +
          '<b style="color:var(--p1)">d = ' + d + '</b>。<br>' +
          '剖面仍是圓形，半徑為 ' +
          '<b style="color:var(--p1)">' +
          '√(R² − d²) = ' + cutRadius.toFixed(1) +
          '</b>。<br>' +
          '離球心越遠，剖面圓越小。';
      }
    }

    draw();
  }
});
