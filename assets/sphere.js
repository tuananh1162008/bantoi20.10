/**
 * Quả cầu ảnh (CSS3D Sphere Gallery) — tách từ cricle/index.html
 * Giữ lib: three (CDN), tween, TrackballControls, CSS3DRenderer
 * Gọi window.openSphereGallery() để hiện quả cầu
 */
(function () {
  var sphereReady = false;
  var normalizedImageCache = {};
  var sphereActive = false;

  var DEFAULT_IMAGES = [
    "images/anh/1792249510527_498492874585012897_8132075415164140944_f776cca49ef785473842dcbceaae0f55.jpg",
    "images/anh/1792519421097_498492874585012897_8132075415164140944_372ba039c4ebff17ed2ffd2294fcaf6e.jpg",
    "images/anh/1792525705309_498492874585012897_8132075415164140944_3bd29a05a68698ac6ed8d7c24697d887.jpg",
    "images/anh/1792519515385_498492874585012897_8132075415164140944_2f28fbef61eee7bd9d0ad96536cf36a2.jpg",
    "images/anh/1792520744886_498492874585012897_8132075415164140944_0e503b84e9ee7f2f4505f124b577d522.jpg",
    "images/anh/1792520774791_498492874585012897_8132075415164140944_bda86407eedb86a68f8099a050b7b52e.jpg"
  ];

  function normalizeImage(url, size) {
    if (normalizedImageCache[url]) return Promise.resolve(normalizedImageCache[url]);
    return new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        try {
          var canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          var ctx = canvas.getContext("2d");
          var ratio = Math.max(size / img.width, size / img.height);
          var w = img.width * ratio;
          var h = img.height * ratio;
          ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
          var dataUrl = canvas.toDataURL("image/jpeg", 0.92);
          normalizedImageCache[url] = dataUrl;
          resolve(dataUrl);
        } catch (e) {
          resolve(url);
        }
      };
      img.onerror = function () { resolve(url); };
      img.src = url;
    });
  }

  function transformSphere(objects, targets, duration, renderer, scene, camera) {
    if (typeof TWEEN === "undefined") return;
    TWEEN.removeAll();
    for (var i = 0; i < objects.length; i++) {
      var object = objects[i];
      var target = targets[i];
      new TWEEN.Tween(object.position)
        .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();
      new TWEEN.Tween(object.rotation)
        .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();
    }
    new TWEEN.Tween({})
      .to({}, duration * 2)
      .onUpdate(function () { renderer.render(scene, camera); })
      .start();
  }

  async function initSphereGallery() {
    if (sphereReady) {
      showSphere();
      return;
    }
    // Hiện ngay để user thấy đang vào cầu
    showSphere();
    sphereReady = true;

    var container = document.getElementById("sphere-container");
    if (!container) {
      console.error("Thiếu #sphere-container");
      return;
    }

    var images = DEFAULT_IMAGES.slice();
    if (window.Heartlove && window.Heartlove.data && window.Heartlove.data.images) {
      images = window.Heartlove.data.images;
    }

    var ua = navigator.userAgent || "";
    var isInApp = /Zalo|FBAN|FBAV|Instagram|Line|MicroMessenger/i.test(ua);
    var isMob = window.innerWidth < 768;

    var gridN;
    if (isInApp) {
      gridN = isMob ? 6 : 7;
    } else {
      gridN = isMob ? 8 : 12;
    }

    var cellList = [];
    for (var row = 0; row < gridN; row++) {
      var phiRow = Math.PI * (row + 0.5) / gridN;
      var nCols = Math.max(1, Math.round(2 * gridN * Math.sin(phiRow)));
      for (var col = 0; col < nCols; col++) {
        cellList.push({ phi: phiRow, theta: 2 * Math.PI * col / nCols });
      }
    }

    var totalItems = cellList.length;
    var personArray = [];
    for (var i = 0; i < totalItems; i++) {
      personArray.push({ image: images[i % images.length] });
    }

    var uniqueImages = [];
    for (var k = 0; k < personArray.length; k++) {
      if (uniqueImages.indexOf(personArray[k].image) === -1) {
        uniqueImages.push(personArray[k].image);
      }
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var normalizeSize = Math.round((isMob ? 220 : 200) * dpr);
    var normalizedResults = await Promise.all(uniqueImages.map(function (url) {
      return normalizeImage(url, normalizeSize);
    }));
    var normalizedMap = {};
    for (var k = 0; k < uniqueImages.length; k++) {
      normalizedMap[uniqueImages[k]] = normalizedResults[k];
    }

    if (typeof THREE === "undefined" || !THREE.CSS3DRenderer || !THREE.CSS3DObject) {
      console.error("Thiếu THREE / CSS3DRenderer");
      return;
    }
    if (typeof TWEEN === "undefined") {
      console.error("Thiếu TWEEN");
      return;
    }

    var sCamera, sScene, sRenderer, sControls;
    var objects = [];
    var targets = { sphere: [], sphereIn: [], rising: [] };
    var clickState = 0;
    var isAnimating = false;
    var risingAnim = false;

    sCamera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    sCamera.position.z = 3000;
    sScene = new THREE.Scene();

    for (var i = 0; i < personArray.length; i++) {
      var element = document.createElement("div");
      element.className = "element";
      element.style.backgroundColor = "transparent";
      var img = document.createElement("img");
      img.src = normalizedMap[personArray[i].image] || personArray[i].image;
      element.appendChild(img);
      var object = new THREE.CSS3DObject(element);
      object.position.x = Math.random() * 4000 - 2000;
      object.position.y = Math.random() * 4000 - 2000;
      object.position.z = Math.random() * 4000 - 2000;
      sScene.add(object);
      objects.push(object);
    }

    var vector = new THREE.Vector3();
    var spherical = new THREE.Spherical();
    var sphereRadius = isMob ? 540 : 800;

    for (var i = 0, l = objects.length; i < l; i++) {
      var phi = cellList[i].phi;
      var theta = cellList[i].theta;
      var target = new THREE.Object3D();
      spherical.set(sphereRadius, phi, theta);
      target.position.setFromSpherical(spherical);
      target.up.set(0, 1, 0);
      vector.copy(target.position).multiplyScalar(2);
      target.lookAt(vector);
      targets.sphere.push(target);
    }

    for (var i = 0, l = objects.length; i < l; i++) {
      var phi = cellList[i].phi;
      var theta = cellList[i].theta;
      var target = new THREE.Object3D();
      spherical.set(sphereRadius, phi, theta);
      target.position.setFromSpherical(spherical);
      target.up.set(0, 1, 0);
      target.lookAt(new THREE.Vector3(0, 0, 0));
      targets.sphereIn.push(target);
    }

    var risingCount = 15;
    var risingCols = 3;
    var risingSpacing = 280;
    for (var i = 0, l = objects.length; i < l; i++) {
      var target = new THREE.Object3D();
      if (i < risingCount) {
        var col = i % risingCols;
        var row = Math.floor(i / risingCols);
        target.position.x = (col - 1) * risingSpacing;
        target.position.y = -1500 + row * risingSpacing;
        target.position.z = 0;
      } else {
        target.position.x = 0;
        target.position.y = -99999;
        target.position.z = 0;
      }
      target.rotation.x = 0;
      target.rotation.y = 0;
      target.rotation.z = 0;
      targets.rising.push(target);
    }

    sRenderer = new THREE.CSS3DRenderer();
    sRenderer.setSize(window.innerWidth, window.innerHeight);
    sRenderer.domElement.style.position = "absolute";
    container.appendChild(sRenderer.domElement);

    sControls = new THREE.OrbitControls(sCamera, sRenderer.domElement);
    sControls.enableDamping = true;
    sControls.dampingFactor = 0.08;
    sControls.rotateSpeed = 0.5;
    sControls.minDistance = 500;
    sControls.maxDistance = 6000;
    sControls.addEventListener("change", function () { sRenderer.render(sScene, sCamera); });

    showSphere();
    transformSphere(objects, targets.sphere, 2000, sRenderer, sScene, sCamera);

    // Ảnh CSS3D không chặn touch — để xoay + tap nhận trên renderer
    for (var ei = 0; ei < objects.length; ei++) {
      if (objects[ei].element) {
        objects[ei].element.style.pointerEvents = "none";
      }
    }

    function advanceSphere() {
      if (isAnimating || !sphereActive) return;
      isAnimating = true;
      sControls.enabled = false;

      if (clickState === 0) {
        var insideZ = isMob ? 180 : 0;
        transformSphere(objects, targets.sphereIn, 1500, sRenderer, sScene, sCamera);
        new TWEEN.Tween(sCamera.position)
          .to({ x: 0, y: 0, z: insideZ }, 2000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function () { sRenderer.render(sScene, sCamera); })
          .onComplete(function () {
            clickState = 1;
            isAnimating = false;
            sControls.minDistance = 0;
            sControls.enabled = true;
          })
          .start();
      } else if (clickState === 1) {
        transformSphere(objects, targets.rising, 2000, sRenderer, sScene, sCamera);
        new TWEEN.Tween(sCamera.position)
          .to({ x: 0, y: 0, z: 1500 }, 2000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function () { sRenderer.render(sScene, sCamera); })
          .onComplete(function () {
            clickState = 3;
            isAnimating = false;
            sControls.minDistance = 200;
            sControls.enabled = true;
            risingAnim = true;
            if (typeof window.showEnvelope === "function") window.showEnvelope();
          })
          .start();
      } else {
        if (typeof window.hideEnvelope === "function") window.hideEnvelope();
        risingAnim = false;
        transformSphere(objects, targets.sphere, 1500, sRenderer, sScene, sCamera);
        new TWEEN.Tween(sCamera.position)
          .to({ x: 0, y: 0, z: 3000 }, 2000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function () { sRenderer.render(sScene, sCamera); })
          .onComplete(function () {
            clickState = 0;
            isAnimating = false;
            sControls.minDistance = 500;
            sControls.enabled = true;
          })
          .start();
      }
    }

    // Tap (không kéo) trên mobile + desktop → bước tiếp theo
    var tapDown = false;
    var tapMoved = false;
    var tapX = 0, tapY = 0;
    var TAP_SLOP = 14; // px — dung sai ngón tay
    var lastAdvanceAt = 0;

    function onTapStart(e) {
      if (!sphereActive || isAnimating) return;
      var t = (e.touches && e.touches[0]) ? e.touches[0] : e;
      if (!t || t.clientX == null) return;
      tapDown = true;
      tapMoved = false;
      tapX = t.clientX;
      tapY = t.clientY;
    }
    function onTapMove(e) {
      if (!tapDown) return;
      var t = (e.touches && e.touches[0]) ? e.touches[0] : e;
      if (!t || t.clientX == null) return;
      if (Math.abs(t.clientX - tapX) > TAP_SLOP || Math.abs(t.clientY - tapY) > TAP_SLOP) {
        tapMoved = true;
      }
    }
    function onTapEnd(e) {
      if (!tapDown) return;
      tapDown = false;
      // Multi-touch (pinch) — bỏ qua
      if (e.touches && e.touches.length > 0) return;
      if (tapMoved) return;
      // Chặn double-fire pointer + touch trên cùng 1 lần chạm
      var now = Date.now();
      if (now - lastAdvanceAt < 400) return;
      lastAdvanceAt = now;
      advanceSphere();
    }

    var sphereDom = sRenderer.domElement;
    // Ưu tiên Pointer Events; fallback touch cho máy cũ
    if (window.PointerEvent) {
      sphereDom.addEventListener("pointerdown", onTapStart, { passive: true });
      sphereDom.addEventListener("pointermove", onTapMove, { passive: true });
      sphereDom.addEventListener("pointerup", onTapEnd, { passive: true });
      sphereDom.addEventListener("pointercancel", function () { tapDown = false; }, { passive: true });
    } else {
      sphereDom.addEventListener("touchstart", onTapStart, { passive: true });
      sphereDom.addEventListener("touchmove", onTapMove, { passive: true });
      sphereDom.addEventListener("touchend", onTapEnd, { passive: true });
      sphereDom.addEventListener("mousedown", onTapStart);
      sphereDom.addEventListener("mousemove", onTapMove);
      sphereDom.addEventListener("mouseup", onTapEnd);
    }

    // Reset to sphere khi đóng thư
    window.resetToSphere = function () {
      if (typeof window.hideEnvelope === "function") window.hideEnvelope();
      risingAnim = false;
      transformSphere(objects, targets.sphere, 1500, sRenderer, sScene, sCamera);
      new TWEEN.Tween(sCamera.position)
        .to({ x: 0, y: 0, z: 3000 }, 2000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(function () { sRenderer.render(sScene, sCamera); })
        .onComplete(function () {
          clickState = 0;
          isAnimating = false;
          sControls.minDistance = 500;
        })
        .start();
    };

    function animateSphere() {
      requestAnimationFrame(animateSphere);
      if (!sphereActive) return;
      if (risingAnim) {
        for (var i = 0; i < 15 && i < objects.length; i++) {
          objects[i].position.y += 0.8;
        }
        sScene.rotation.y = 0;
      } else {
        sScene.rotation.y += 0.002;
      }
      TWEEN.update();
      sControls.update();
      sRenderer.render(sScene, sCamera);
    }
    animateSphere();

    window.addEventListener("resize", function () {
      if (!sCamera || !sRenderer) return;
      sCamera.aspect = window.innerWidth / window.innerHeight;
      sCamera.updateProjectionMatrix();
      sRenderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  function showSphere() {
    sphereActive = true;
    var container = document.getElementById("sphere-container");
    if (container) {
      container.style.display = "block";
      container.setAttribute("aria-hidden", "false");
      requestAnimationFrame(function () {
        container.classList.add("active");
      });
    }
    // Đảm bảo nhạc vẫn chạy khi vào quả cầu.
    var a = document.getElementById("audio");
    if (a) {
      a.loop = true;
      if (a.paused) {
        var p = a.play();
        if (p && typeof p.catch === "function") p.catch(function () {});
      }
    }
  }

  function hideSphere() {
    sphereActive = false;
    var container = document.getElementById("sphere-container");
    if (container) {
      container.classList.remove("active");
      setTimeout(function () {
        if (!sphereActive) container.style.display = "none";
      }, 1500);
    }
  }

  window.openSphereGallery = function () {
    try {
      // Hiện container ngay (tránh trắng màn nếu load ảnh chậm)
      showSphere();
      initSphereGallery().catch(function (err) {
        console.error("[Sphere] init error:", err);
        showSphere();
      });
    } catch (err) {
      console.error("[Sphere] open error:", err);
      showSphere();
    }
  };
  window.hideSphereGallery = hideSphere;
  window.isSphereActive = function () { return sphereActive; };
})();
