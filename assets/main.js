/* ===== INTRO: Hoa hạt Galaxy (thay thư) → Tỏa hoa như ban đầu ===== */
(() => {
  const canvas = document.getElementById("loveCanvas");
  const ctx = canvas.getContext("2d");
  const hint = document.getElementById("galaxyHint");

  // ---- Galaxy particles (thay cho envelope) ----
  const N = 14000;
  let W, H, DPR, CX, CY, S;
  const backgroundStars = Array.from({ length: 220 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: Math.random() < 0.08 ? 1.8 : 0.5 + Math.random() * 0.9,
    phase: Math.random() * Math.PI * 2,
    speed: 0.0007 + Math.random() * 0.0018,
    alpha: 0.25 + Math.random() * 0.6
  }));

  const tx = new Float32Array(N), ty = new Float32Array(N);
  const x = new Float32Array(N), y = new Float32Array(N);
  const size = new Float32Array(N), phase = new Float32Array(N);
  const base = new Float32Array(N);
  const hue = new Uint8Array(N);

  const TAU = Math.PI * 2, rnd = Math.random;
  const A0 = -Math.PI / 2;
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;

  const LAYERS = [
    { n: 8, off: 0, L: 1.00, W: 0.30, curl: 0.06, w: 0.23, hue: 0, a: 0.85 },
    { n: 8, off: Math.PI / 8, L: 0.82, W: 0.27, curl: -0.05, w: 0.185, hue: 0, a: 0.8 },
    { n: 8, off: 0, L: 0.62, W: 0.22, curl: 0.05, w: 0.15, hue: 1, a: 0.95 },
    { n: 5, off: Math.PI / 5, L: 0.42, W: 0.17, curl: -0.04, w: 0.11, hue: 0, a: 1.0 }
  ];
  const petalW = (u, Ww) => Ww * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.7)), 0.9);

  function petalPoint(Ly, mode) {
    const k = Math.floor(rnd() * Ly.n);
    const ang = A0 + Ly.off + k * TAU / Ly.n;
    const side = rnd() < 0.5 ? -1 : 1;
    const u = rnd();
    const w = petalW(u, Ly.W);
    let v;
    if (mode === 0) v = side * w;
    else if (mode === 1) v = (rnd() * 2 - 1) * w * 0.95;
    else if (rnd() < 0.5) v = 0;
    else v = side * w * 0.5 * (0.6 + 0.4 * u);
    v += Ly.curl * u * u * u;
    const x0 = u * Ly.L, c = Math.cos(ang), s = Math.sin(ang);
    return [x0 * c - v * s, x0 * s + v * c];
  }

  function pickLayer() {
    let r = rnd(), acc = 0;
    for (const Ly of LAYERS) { acc += Ly.w; if (r < acc) return Ly; }
    return LAYERS[LAYERS.length - 1];
  }

  const STAMENS = 28;
  const stamenLen = k => 0.27 + 0.07 * (0.5 + 0.5 * Math.sin(k * 2.3));

  function build() {
    for (let i = 0; i < N; i++) {
      const g = rnd();
      let px, py, j = 0, h = 0, al = 0.8;
      if (g < 0.655) {
        const Ly = pickLayer();
        const m = rnd();
        const mode = m < 0.62 ? 0 : m < 0.84 ? 1 : 2;
        [px, py] = petalPoint(Ly, mode);
        if (mode === 0) { h = Ly.hue; al = Ly.a * (0.6 + rnd() * 0.4); j = 0.0045; }
        else if (mode === 1) { h = 1; al = 0.10 + rnd() * 0.14; j = 0.0; }
        else { h = Ly.hue; al = 0.35 + rnd() * 0.3; j = 0.003; }
      } else if (g < 0.735) {
        const th = rnd() * TAU, r = 0.18 + Math.pow(rnd(), 1.6) * 0.55;
        px = Math.cos(th) * r; py = Math.sin(th) * r;
        h = 1; al = Math.max(0.1, 0.6 - r * 0.7);
      } else if (g < 0.815) {
        const k = Math.floor(rnd() * STAMENS), th = A0 + k * TAU / STAMENS + 0.12;
        const r = 0.19 + rnd() * (stamenLen(k) - 0.19);
        const t = (r - 0.19) / (stamenLen(k) - 0.19 + 1e-6);
        const a2 = th + 0.18 * t * t;
        px = Math.cos(a2) * r; py = Math.sin(a2) * r;
        h = 2; al = 0.35 + 0.35 * t; j = 0.0015;
      } else if (g < 0.845) {
        const k = Math.floor(rnd() * STAMENS), th = A0 + k * TAU / STAMENS + 0.12 + 0.18;
        const r = stamenLen(k);
        px = Math.cos(th) * r + gauss() * 0.011; py = Math.sin(th) * r + gauss() * 0.011;
        h = 2; al = 0.9 + rnd() * 0.1;
      } else if (g < 0.945) {
        const n = Math.floor(rnd() * 420), r = 0.17 * Math.sqrt(n / 420), th = n * 2.39996;
        px = Math.cos(th) * r; py = Math.sin(th) * r;
        h = 2; al = 0.75 + rnd() * 0.25; j = 0.002;
      } else if (g < 0.975) {
        const th = rnd() * TAU, r = 0.19 + gauss() * 0.005;
        px = Math.cos(th) * r; py = Math.sin(th) * r;
        h = 0; al = 1;
      } else {
        const th = rnd() * TAU, r = 1.0 + Math.pow(rnd(), 1.5) * 0.35;
        px = Math.cos(th) * r; py = Math.sin(th) * r;
        h = rnd() < 0.5 ? 0 : 1; al = 0.15 + rnd() * 0.3;
      }
      tx[i] = px + gauss() * j;
      ty[i] = py + gauss() * j;
      hue[i] = h; base[i] = al;
      size[i] = 0.6 + rnd() * 1.0;
      phase[i] = rnd() * TAU;
      x[i] = CX; y[i] = CY;
    }
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    CX = W / 2; CY = H * 0.46;
    S = Math.min(W * 0.38, H * 0.30);
  }

  function flowerPos(i, now) {
    const ang = now * 0.00012;
    const breath = 1 + 0.025 * Math.sin(now * 0.0016);
    const c = Math.cos(ang), s = Math.sin(ang);
    const j = 1.2 * Math.sin(now * 0.002 + phase[i]);
    const fx = (tx[i] * c - ty[i] * s) * S * breath + j;
    const fy = (tx[i] * s + ty[i] * c) * S * breath + Math.cos(now * 0.0023 + phase[i]) * 1.2;
    return [CX + fx, CY + fy];
  }

  // ---- Hiệu ứng tỏa bông hoa (GIỮ NGUYÊN như bản gốc) ----
  const flowers = [];
  const flowerImages = [];
  for (let i = 1; i <= 8; i++) {
    const img = new Image();
    img.src = `images/flower${i}.webp`;
    flowerImages.push(img);
  }

  function createFlower(index, leftSide) {
    const ring = Math.floor(index / 40);
    const pos = index % 40;
    const side = leftSide ? 1 : -1;
    const angle =
      (leftSide ? -Math.PI / 2 : Math.PI / 2) +
      side * (pos / 40) * Math.PI * 2 +
      (Math.random() - 0.5) * 0.08;
    const radius =
      Math.max(W, H) * (0.05 + ring * 0.12 + Math.random() * 0.08);
    flowers.push({
      tx: Math.cos(angle) * radius,
      ty: Math.sin(angle) * radius,
      img: flowerImages[Math.floor(Math.random() * flowerImages.length)],
      start: performance.now(),
      dur: 800 + Math.random() * 150,
      rot: (Math.random() - 0.5) * 50,
      spin: (Math.random() - 0.5) * 120,
      drop: H + 300 + Math.random() * 300,
    });
  }

  // galaxy → burst → waiting → dropping → done
  let state = "galaxy";
  let dropStart = 0;
  let galaxyFade = false;
  let galaxyFadeStart = 0;
  let canSecondClick = false; // chặn click lọt từ lần 1
  const COLORS = ["rgba(236,228,255,", "rgba(170,120,255,", "rgba(255,236,170,"];
  const easeOut = t => 1 - (1 - t) * (1 - t);
  const easeIn = t => t * t;

  function startBurst() {
    galaxyFade = true;
    galaxyFadeStart = performance.now();
    canSecondClick = false;
    hint.classList.remove("show");
    hint.style.pointerEvents = "none";

    let left = 0, right = 0;
    const timer = setInterval(() => {
      for (let i = 0; i < 3 && left < 300; i++) { createFlower(left, true); left++; }
      for (let i = 0; i < 3 && right < 300; i++) { createFlower(right, false); right++; }
      if (left >= 300 && right >= 300) {
        clearInterval(timer);
        // DỪNG — chờ bấm lần 2 (KHÔNG tự rơi)
        state = "waiting";
        hint.textContent = "Tiếp nào";
        setTimeout(() => {
          canSecondClick = true;
          hint.classList.add("show");
          hint.style.pointerEvents = "auto";
        }, 700);
      }
    }, 33);
  }

  function startDrop() {
    if (state !== "waiting" || !canSecondClick) return;
    canSecondClick = false;
    hint.classList.remove("show");
    hint.style.pointerEvents = "none";
    state = "dropping";
    dropStart = performance.now();

    // Phát nhạc từ lần click thứ 2 (khi hoa rơi) — lặp lại
    const audio = document.getElementById("audio");
    if (audio) {
      audio.currentTime = 0;
      audio.loop = true; // lặp lại
      const p = audio.play();
      if (p && typeof p.catch === "function") p.catch(function () { });
    }

    setTimeout(() => {
      state = "done";
      const intro = document.querySelector(".love-intro");
      if (intro) {
        intro.style.transition = "opacity 0.8s ease-out";
        intro.style.opacity = "0";
        intro.style.pointerEvents = "none";
      }
      setTimeout(() => {
        const content = document.getElementById("content");
        content.style.display = "flex";
        requestAnimationFrame(() => {
          content.classList.add("show");
          if (typeof window.initKhung === "function") window.initKhung();
        });
      }, 500);
    }, 1800);
  }

  function handleClick(e) {
    if (e) e.stopPropagation();
    if (state === "galaxy") {
      state = "burst";
      startBurst();
    } else if (state === "waiting" && canSecondClick) {
      startDrop();
    }
  }

  function frame(now) {
    if (state === "done") return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Distant stars behind the flower-shaped galaxy.
    ctx.globalCompositeOperation = "lighter";
    for (const star of backgroundStars) {
      const twinkle = 0.55 + 0.45 * Math.sin(now * star.speed + star.phase);
      ctx.globalAlpha = star.alpha * twinkle;
      ctx.fillStyle = star.size > 1.5 ? "#d9f5ff" : "#c9d5ff";
      ctx.beginPath();
      ctx.arc(star.x * W, star.y * H, star.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // Galaxy flower
    let gAlpha = 1;
    if (galaxyFade) gAlpha = Math.max(0, 1 - (now - galaxyFadeStart) / 800);
    if (gAlpha > 0.01) {
      for (let i = 0; i < N; i++) {
        const p = flowerPos(i, now);
        x[i] = p[0]; y[i] = p[1];
      }
      ctx.globalCompositeOperation = "lighter";
      const gr = S * 0.45;
      const gg = ctx.createRadialGradient(CX, CY, 0, CX, CY, gr * 2.2);
      gg.addColorStop(0, `rgba(150,100,255,${0.30 * gAlpha})`);
      gg.addColorStop(1, "rgba(150,100,255,0)");
      ctx.fillStyle = gg;
      ctx.fillRect(CX - gr * 2.2, CY - gr * 2.2, gr * 4.4, gr * 4.4);
      for (let h = 0; h < 3; h++) {
        ctx.fillStyle = COLORS[h] + "1)";
        for (let i = 0; i < N; i++) {
          if (hue[i] !== h) continue;
          ctx.globalAlpha = base[i] * gAlpha;
          ctx.fillRect(x[i], y[i], size[i], size[i]);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    // Bông hoa ảnh (tỏa hoa)
    if (flowers.length > 0) {
      for (let i = 0; i < flowers.length; i++) {
        const f = flowers[i];
        let fx, fy, scale, alpha, rot;
        if (state === "dropping" || state === "done") {
          const p = Math.min(1, (now - dropStart) / 1800);
          const ee = easeIn(p);
          fx = CX + f.tx;
          fy = CY + f.ty + ee * f.drop;
          scale = 1;
          alpha = 1 - p;
          rot = f.rot + ((now - f.start) / 1000) * f.spin;
        } else {
          const p = easeOut(Math.min(1, (now - f.start) / f.dur));
          fx = CX + p * f.tx;
          fy = CY + p * f.ty;
          scale = p;
          alpha = Math.min(1.2 * p, 0.92);
          rot = f.rot + ((now - f.start) / 1000) * f.spin;
        }
        if (alpha <= 0) continue;
        const img = f.img;
        if (!img.complete) continue;
        const w = 380, hh = 800;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.scale(scale * 0.8, scale * 0.8);
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, -w / 2, -hh / 2, w, hh);
        ctx.restore();
      }
    }

    requestAnimationFrame(frame);
  }

  addEventListener("resize", () => { if (state !== "done") resize(); });
  // Không gắn document click — tránh double-fire làm hoa tự rơi
  canvas.addEventListener("click", handleClick);
  hint.addEventListener("click", handleClick);

  resize();
  build();
  setTimeout(() => {
    hint.textContent = "Nhấn vào màn hình đi";
    hint.classList.add("show");
    hint.style.pointerEvents = "auto";
  }, 1000);
  requestAnimationFrame(frame);
})();


/* ===== KHUNG JS ===== */
window.initKhung = function () {
  if (window._khungStarted) return;
  window._khungStarted = true;

  var $ = function (id) { return document.getElementById(id) };

  var CONFIG = {
    n1: "Vân ✿ My", n2: "Dương ✿ Phương",
    date: "2026-10-20",
    t1: "Gửi hội bạn thân",
    t2: "Mừng ngày 20/10",
    led: "#ffc878",
    zoom: 1, offX: 0, offY: 0
  };

  var MASK = ["0111001110", "1111111111", "1111111111", "0111111110", "0011111100", "0001111000", "0000110000"];
  var S = 64, COLS = 10, ROWS = 7, photo = "", H, V;

  function edge(x0, y0, x1, y1, sg) {
    var dx = x1 - x0, dy = y1 - y0, nx = -dy * sg, ny = dx * sg;
    function p(t, k) { return (x0 + dx * t + nx * k).toFixed(1) + " " + (y0 + dy * t + ny * k).toFixed(1) }
    return "L" + p(.37, 0) + " C" + p(.37, .10) + " " + p(.28, .12) + " " + p(.28, .20) + " C" + p(.28, .32) + " " + p(.72, .32) + " " + p(.72, .20) + " C" + p(.72, .12) + " " + p(.63, .10) + " " + p(.63, 0) + " L" + x1 + " " + y1 + " ";
  }

  var pieceCount = 0;
  var assembled = false;
  var isOpeningGalaxy = false;

  function countPieces() {
    var n = 0, i, j;
    for (i = 0; i < ROWS; i++) for (j = 0; j < COLS; j++) if (MASK[i][j] === "1") n++;
    return n;
  }

  function onAssembleDone() {
    if (assembled) return;
    assembled = true;
    var hint = $("holdHint");
    if (hint) {
      hint.classList.add("show");
      setTimeout(function () { hint.classList.remove("show"); }, 1350);
    }
  }

  function shuffle() {
    var i, j; H = []; V = [];
    for (i = 0; i <= ROWS; i++) { H[i] = []; for (j = 0; j < COLS; j++) H[i][j] = Math.random() < .5 ? 1 : -1 }
    for (i = 0; i < ROWS; i++) { V[i] = []; for (j = 0; j <= COLS; j++) V[i][j] = Math.random() < .5 ? 1 : -1 }
    assembled = false;
    render();
  }

  function render() {
    var W = COLS * S, Hh = ROWS * S, z = CONFIG.zoom, iw = W * z, ih = Hh * z;
    var ix = (W - iw) / 2 + CONFIG.offX / 100 * W, iy = (Hh - ih) / 2 + CONFIG.offY / 100 * Hh;
    var out = '<defs><pattern id="ph" patternUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + Hh + '">' +
      '<rect width="' + W + '" height="' + Hh + '" fill="#d4506e"/>' +
      (photo ? '<image href="' + photo + '" x="' + ix + '" y="' + iy + '" width="' + iw + '" height="' + ih + '" preserveAspectRatio="xMidYMid slice"/>' : '') +
      '</pattern>' +
      '<linearGradient id="sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>';

    pieceCount = countPieces();
    var order = [], cnt = 0, k;
    for (k = 0; k < pieceCount; k++) order.push(k);
    for (k = pieceCount - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)), t = order[k]; order[k] = order[r]; order[r] = t; }

    for (var i = 0; i < ROWS; i++) for (var j = 0; j < COLS; j++) {
      if (MASK[i][j] !== "1") continue;
      var x = j * S, y = i * S;
      var d = "M" + x + " " + y + " " + edge(x, y, x + S, y, H[i][j]) + edge(x + S, y, x + S, y + S, -V[i][j + 1]) + edge(x + S, y + S, x, y + S, -H[i + 1][j]) + edge(x, y + S, x, y, V[i][j]) + "Z";
      // Khoảng bay ngắn hơn → mượt, ít lag
      var ang = Math.random() * Math.PI * 2, dist = 180 + Math.random() * 160;
      out += '<g class="pc" style="--dx:' + (Math.cos(ang) * dist).toFixed(0) + 'px;--dy:' + (Math.sin(ang) * dist).toFixed(0) + 'px;--rot:' + (Math.random() * 240 - 120).toFixed(0) + 'deg;--i:' + order[cnt++] + '">' +
        '<path d="' + d + '" fill="url(#ph)" stroke="rgba(255,255,255,.92)" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="' + d + '" fill="url(#sh)"/></g>';
    }
    $("pz").setAttribute("viewBox", "-20 -20 " + (W + 40) + " " + (Hh + 40));
    $("pz").innerHTML = out;

    // Thời gian ghép xong ≈ delay max + duration animation
    // delay = (pieceCount-1)*0.035s, anim = 0.55s
    var doneMs = Math.ceil((pieceCount - 1) * 35 + 550 + 80);
    setTimeout(onAssembleDone, doneMs);
  }

  function calendar() {
    var dt = new Date(CONFIG.date + "T00:00:00");
    if (isNaN(dt)) dt = new Date();
    var y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
    $("mon").textContent = dt.toLocaleDateString("en-US", { month: "long" }) + " " + y;
    var first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    var h = "SMTWTFS".split("").map(function (c) { return "<b>" + c + "</b>" }).join("");
    for (var k = 0; k < first; k++) h += "<span></span>";
    for (var n = 1; n <= days; n++) h += '<span' + (n === d ? ' class="on"' : '') + '>' + n + '</span>';
    $("cal").innerHTML = h;
  }

  $("n1").textContent = CONFIG.n1; $("n2").textContent = CONFIG.n2;
  $("t1").textContent = CONFIG.t1; $("t2").textContent = CONFIG.t2;
  document.querySelector(".gold").style.setProperty("--led", CONFIG.led + "b3");

  var el = $("anh"), started = false;
  function start() {
    if (started) return;
    started = true;
    if (el.naturalWidth > 0) photo = el.getAttribute("src");
    shuffle();
  }
  calendar();
  el.addEventListener("load", start);
  el.addEventListener("error", start);
  if (el.complete) start();
  setTimeout(start, 1500);

  var puzzle = $("pzwrap");
  function openNextScene() {
    if (!assembled || isOpeningGalaxy) return;
    if (typeof window.openSphereGallery !== "function") {
      console.error("Photo sphere gallery is unavailable.");
      return;
    }
    isOpeningGalaxy = true;
    var content = document.getElementById("content");
    if (content) {
      content.style.transition = "opacity .5s ease";
      content.style.opacity = "0";
    }
    setTimeout(function () {
      if (content) {
        content.style.display = "none";
        content.style.pointerEvents = "none";
      }
      window.openSphereGallery();
    }, 500);
  }
  puzzle.setAttribute("role", "button");
  puzzle.setAttribute("tabindex", "0");
  puzzle.addEventListener("click", openNextScene);
  puzzle.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openNextScene();
    }
  });
};
