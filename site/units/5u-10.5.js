
/* 五上 第十章 柱體、錐體和球 10.5：球 */
NB.unit({
  title: "球",
  ref: "五上・第十章 柱體、錐體和球・10.5 球",

  q: "把一顆球切開，它的「<span class='hl'>剖面</span>」會是什麼形狀？",

  steps: [
    "球體的表面都是曲面，沒有平平的面。",
    "球的中心點叫作「球心」。",
    "用平面切開球體，觀察切面，可以發現切面是圓形。",
    "當切割平面通過球心時，切出的圓最大。切割位置越靠近球面，切面上的圓就越小。"
  ],

  ch: {
    q: "球被平面切開時，切面最接近哪一種形狀？（輸入 1＝圓形，2＝正方形）",
    a: 1,
    h: "想一想切開西瓜時，切開的面是什麼形狀？"
  },

  tool: function(b, eq) {

    /* =====================================
       1. 互動說明
    ===================================== */
    var desc = document.createElement("div");

    desc.style.cssText =
      "margin-bottom:8px;" +
      "text-align:center;" +
      "color:var(--text-gray);" +
      "font-size:14px;";

    desc.textContent =
      "拖曳滑桿移動切割平面，也可以用手指或滑鼠旋轉球體。";

    b.appendChild(desc);

    /* =====================================
       2. 建立滑桿
       NB.slider 會自動將滑桿加入 b
    ===================================== */
    var slider = NB.slider(
      b,
      "切割位置（離球心的距離）",
      0,
      100,
      1,
      0,
      "%",
      function() {
        updateCut();
      }
    );

    /* =====================================
       3. 建立 3D 畫布
    ===================================== */
    var stage = NB.h(
      '<div class="sphere3d-stage" style="' +
        'position:relative;' +
        'width:100%;' +
        'height:320px;' +
        'margin-top:10px;' +
        'overflow:hidden;' +
        'border-radius:12px;' +
        'background:var(--paper);' +
        'border:1px solid var(--soft);' +
        'touch-action:none;' +
        '"></div>'
    );

    b.appendChild(stage);

    var hint = document.createElement("div");

    hint.style.cssText =
      "position:absolute;" +
      "left:10px;" +
      "top:10px;" +
      "padding:5px 9px;" +
      "border-radius:6px;" +
      "background:var(--paper);" +
      "color:var(--text-gray);" +
      "font-size:12px;" +
      "pointer-events:none;";

    hint.textContent = "3D 球體・可旋轉";

    stage.appendChild(hint);

    var status = document.createElement("div");

    status.style.cssText =
      "padding:10px 8px;" +
      "margin-top:8px;" +
      "text-align:center;" +
      "line-height:1.8;" +
      "border-radius:8px;" +
      "background:var(--paper);" +
      "color:var(--ink);";

    b.appendChild(status);

    /* =====================================
       4. 教學用 3D 模型設定
    ===================================== */
    var R = 1.25;

    var renderer = null;
    var scene = null;
    var camera = null;
    var model = null;
    var sphere = null;
    var sphereLines = null;
    var cutPlane = null;
    var cutDisk = null;
    var centerPoint = null;
    var rendererReady = false;
    var startX = 0;
    var startY = 0;
    var dragging = false;
    var rotX = -0.25;
    var rotY = 0.55;
    var zoom = 4.3;
    var disposed = false;

    /* =====================================
       5. 顯示教學文字
    ===================================== */
    function updateText() {
      var d = Number(slider.v);

      if (!Number.isFinite(d)) {
        d = 0;
      }

      d = Math.max(0, Math.min(100, d));

      if (d === 0) {
        status.innerHTML =
          "<b>切割平面通過球心</b><br>" +
          "切面上的圓最大。";

        eq.innerHTML =
          "切割平面通過「<b>球心</b>」！<br>" +
          "觀察 3D 模型，可以發現這時的剖面圓最大。";

      } else if (d === 100) {
        status.innerHTML =
          "<b>切割平面到達球面</b><br>" +
          "切面上的圓縮小成一個點。";

        eq.innerHTML =
          "切割平面到達球面時，剖面縮小成一個點。<br>" +
          "繼續觀察切割位置改變時，剖面大小的變化。";

      } else {
        status.innerHTML =
          "<b>切割平面離球心 " + d + "%</b><br>" +
          "切面仍是圓形，而且比通過球心時小。";

        eq.innerHTML =
          "切割平面沒有通過球心。<br>" +
          "切面仍是圓形，但比通過球心時小。<br>" +
          "切割位置越靠近球面，剖面圓越小。";
      }
    }

    /* =====================================
       6. 更新切割平面
    ===================================== */
    function updateCut() {
      updateText();

      if (!rendererReady) {
        return;
      }

      var d = Math.max(
        0,
        Math.min(100, Number(slider.v) || 0)
      );

      /* 切割位置由球心逐漸移向上方球面 */
      var y = R * d / 100;

      cutPlane.position.y = y;

      /*
       * 只用幾何圖形呈現剖面大小，
       * 不向學生顯示平方根或其他進階公式。
       */
      var radius = Math.sqrt(
        Math.max(0, R * R - y * y)
      );

      model.remove(cutDisk);

      if (radius > 0.005) {
        var diskGeometry = new THREE.CircleGeometry(
          radius,
          64
        );

        var diskMaterial = new THREE.MeshBasicMaterial({
          color: 0xffc857,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
          depthWrite: false
        });

        cutDisk = new THREE.Mesh(
          diskGeometry,
          diskMaterial
        );

        /* 圓盤朝向水平切割平面 */
        cutDisk.rotation.x = -Math.PI / 2;
        cutDisk.position.set(0, y + 0.008, 0);
        cutDisk.renderOrder = 3;

        model.add(cutDisk);

      } else {
        cutDisk = new THREE.Mesh(
          new THREE.SphereGeometry(0.035, 16, 12),
          new THREE.MeshBasicMaterial({
            color: 0xffc857
          })
        );

        cutDisk.position.set(0, y, 0);
        model.add(cutDisk);
      }

      renderer.render(scene, camera);
    }

    /* =====================================
       7. 建立 3D 場景
    ===================================== */
    function init3D() {
      if (disposed || rendererReady) {
        return;
      }

      if (!window.THREE) {
        showError(
          "3D 模型載入失敗，請確認網路連線後重新整理。"
        );
        return;
      }

      try {
        scene = new THREE.Scene();

        scene.background = new THREE.Color(
          getComputedStyle(stage).backgroundColor ||
          "#ffffff"
        );

        camera = new THREE.PerspectiveCamera(
          45,
          1,
          0.1,
          100
        );

        camera.position.set(0, 0, zoom);

        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true
        });

        renderer.setPixelRatio(
          Math.min(window.devicePixelRatio || 1, 2)
        );

        renderer.setSize(
          stage.clientWidth || 500,
          stage.clientHeight || 320
        );

        renderer.domElement.style.cssText =
          "display:block;width:100%;height:100%;";

        renderer.domElement.setAttribute(
          "aria-label",
          "可旋轉的球體剖面 3D 模型"
        );

        stage.insertBefore(
          renderer.domElement,
          hint
        );

        /* 球體及切割平面共用一個旋轉群組 */
        model = new THREE.Group();
        scene.add(model);

        /* 球體表面 */
        sphere = new THREE.Mesh(
          new THREE.SphereGeometry(R, 64, 48),
          new THREE.MeshPhongMaterial({
            color: 0x8fc9f2,
            transparent: true,
            opacity: 0.48,
            shininess: 65,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );

        sphere.renderOrder = 1;
        model.add(sphere);

        /* 球面網格，協助觀察立體形狀 */
        sphereLines = new THREE.LineSegments(
          new THREE.WireframeGeometry(
            new THREE.SphereGeometry(R, 24, 16)
          ),
          new THREE.LineBasicMaterial({
            color: 0x5795c4,
            transparent: true,
            opacity: 0.3
          })
        );

        sphereLines.renderOrder = 2;
        model.add(sphereLines);

        /* 球心 */
        centerPoint = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 16, 12),
          new THREE.MeshBasicMaterial({
            color: 0xe91e63
          })
        );

        centerPoint.position.set(0, 0, 0);
        model.add(centerPoint);

        /* 切割平面：半透明方形 */
        cutPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(
            R * 2.6,
            R * 2.6
          ),
          new THREE.MeshBasicMaterial({
            color: 0xf06292,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );

        cutPlane.rotation.x = -Math.PI / 2;
        cutPlane.renderOrder = 2;
        model.add(cutPlane);

        /* 柔和燈光 */
        scene.add(
          new THREE.AmbientLight(0xffffff, 1.5)
        );

        var light = new THREE.DirectionalLight(
          0xffffff,
          2
        );

        light.position.set(3, 4, 5);
        scene.add(light);

        /* 初始視角 */
        model.rotation.x = rotX;
        model.rotation.y = rotY;

        rendererReady = true;

        updateCut();
        resize();

      } catch (err) {
        console.error("10.5 3D 初始化錯誤：", err);

        showError(
          "目前無法顯示 3D 模型，請確認瀏覽器支援 WebGL。"
        );
      }
    }

    /* =====================================
       8. 畫面尺寸調整
    ===================================== */
    function resize() {
      if (!rendererReady || disposed) {
        return;
      }

      var w = stage.clientWidth || 500;
      var h = stage.clientHeight || 320;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      renderer.render(scene, camera);
    }

    /* =====================================
       9. 滑鼠與觸控旋轉
    ===================================== */
    stage.addEventListener("pointerdown", function(e) {
      if (!rendererReady) return;

      dragging = true;
      startX = e.clientX;
      startY = e.clientY;

      try {
        stage.setPointerCapture(e.pointerId);
      } catch (err) {}

    });

    stage.addEventListener("pointermove", function(e) {
      if (!dragging || !rendererReady) return;

      var dx = e.clientX - startX;
      var dy = e.clientY - startY;

      startX = e.clientX;
      startY = e.clientY;

      rotY += dx * 0.008;
      rotX += dy * 0.008;

      rotX = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, rotX)
      );

      model.rotation.x = rotX;
      model.rotation.y = rotY;

      renderer.render(scene, camera);
    });

    function stopDrag() {
      dragging = false;
    }

    stage.addEventListener("pointerup", stopDrag);
    stage.addEventListener("pointercancel", stopDrag);
    stage.addEventListener("lostpointercapture", stopDrag);

    /* 滾輪縮放 */
    stage.addEventListener("wheel", function(e) {
      if (!rendererReady) return;

      e.preventDefault();

      zoom += e.deltaY * 0.003;
      zoom = Math.max(2.8, Math.min(7, zoom));

      camera.position.z = zoom;
      renderer.render(scene, camera);

    }, { passive: false });

    /* =====================================
       10. 錯誤提示
    ===================================== */
    function showError(message) {
      var msg = document.createElement("div");

      msg.style.cssText =
        "padding:24px 12px;" +
        "text-align:center;" +
        "color:var(--text-gray);" +
        "line-height:1.8;";

      msg.textContent = message;

      stage.appendChild(msg);
    }

    /* =====================================
       11. 載入 Three.js
       不需修改 core.js
    ===================================== */
    function loadThree() {
      if (window.THREE) {
        init3D();
        return;
      }

      var existing = document.querySelector(
        'script[data-nb-threejs="r128"]'
      );

      if (existing) {
        existing.addEventListener("load", init3D, {
          once: true
        });

        existing.addEventListener("error", function() {
          showError("3D 函式庫載入失敗，請檢查網路連線。");
        }, { once: true });

        return;
      }

      var script = document.createElement("script");

      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

      script.async = true;
      script.dataset.nbThreejs = "r128";

      script.onload = init3D;

      script.onerror = function() {
        showError(
          "無法載入 3D 函式庫，請確認網路連線後重新整理。"
        );
      };

      document.head.appendChild(script);
    }

    /* 螢幕尺寸改變時重新調整 */
    if (typeof ResizeObserver !== "undefined") {
      var observer = new ResizeObserver(resize);
      observer.observe(stage);
    } else {
      window.addEventListener("resize", resize);
    }

    /* 初次顯示 */
    updateText();
    loadThree();
  }
});
