(() => {
  const canvas = document.getElementById("scene-canvas");
  const countLabel = document.getElementById("gallery-count");
  const dialog = document.getElementById("photo-dialog");
  const dialogPhoto = document.getElementById("dialog-photo");
  const dialogCaption = document.getElementById("dialog-caption");
  const musicPlayer = document.getElementById("music-player");
  const musicToggle = document.getElementById("music-toggle");
  const photoList = [
    { src: "../images/anh/1792249510527_498492874585012897_8132075415164140944_f776cca49ef785473842dcbceaae0f55.jpg", caption: "Một khoảnh khắc thật dịu dàng" },
    { src: "../images/anh/1792519421097_498492874585012897_8132075415164140944_372ba039c4ebff17ed2ffd2294fcaf6e.jpg", caption: "Mong ngày nào cũng có niềm vui" },
    { src: "../images/anh/1792525705309_498492874585012897_8132075415164140944_3bd29a05a68698ac6ed8d7c24697d887.jpg", caption: "Mỗi ngày đều rạng rỡ theo cách riêng" },
    { src: "../images/anh/1792519515385_498492874585012897_8132075415164140944_2f28fbef61eee7bd9d0ad96536cf36a2.jpg", caption: "Lưu giữ những điều mình yêu quý" },
    { src: "../images/anh/1792520744886_498492874585012897_8132075415164140944_0e503b84e9ee7f2f4505f124b577d522.jpg", caption: "Chúc những ước mơ đều nở hoa" },
    { src: "../images/anh/1792520774791_498492874585012897_8132075415164140944_bda86407eedb86a68f8099a050b7b52e.jpg", caption: "Gửi bạn thật nhiều thương mến" }
  ];

  if (!(canvas instanceof HTMLCanvasElement) || typeof THREE === "undefined") {
    throw new Error("Không thể khởi tạo hiệu ứng 3D: thiếu canvas hoặc thư viện Three.js.");
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 18);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const gallery = new THREE.Group();
  gallery.position.x = window.innerWidth < 760 ? -2 : Math.min(2.6, window.innerWidth / 600);
  scene.add(gallery);

  const cards = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const clock = new THREE.Clock();
  const imageLoader = new THREE.TextureLoader();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activePhoto = 0;
  let pointerDown = null;
  let dragging = false;
  let autoRotate = true;
  let lastPointerX = 0;
  let rotationVelocity = 0;
  let targetRotation = 0;

  if (window.innerWidth <= 760 && musicPlayer && musicToggle) {
    musicPlayer.classList.add("is-collapsed");
    musicToggle.textContent = "+";
    musicToggle.setAttribute("aria-expanded", "false");
    musicToggle.setAttribute("aria-label", "Mở trình phát");
  }

  const roundedRect = (context, x, y, width, height, radius) => {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  };

  function makeCardTexture(image, caption) {
    const cardCanvas = document.createElement("canvas");
    cardCanvas.width = 560;
    cardCanvas.height = 700;
    const context = cardCanvas.getContext("2d");
    if (!context) throw new Error("Không thể tạo khung ảnh 3D.");

    context.shadowColor = "rgba(16, 6, 18, .28)";
    context.shadowBlur = 22;
    context.shadowOffsetY = 12;
    roundedRect(context, 6, 6, 548, 688, 18);
    context.fillStyle = "#fffaf3";
    context.fill();
    context.shadowColor = "transparent";

    const photoX = 24;
    const photoY = 24;
    const photoWidth = 512;
    const photoHeight = 560;
    const imageRatio = image.width / image.height;
    const frameRatio = photoWidth / photoHeight;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.width;
    let sourceHeight = image.height;

    if (imageRatio > frameRatio) {
      sourceWidth = image.height * frameRatio;
      sourceX = (image.width - sourceWidth) / 2;
    } else {
      sourceHeight = image.width / frameRatio;
      sourceY = (image.height - sourceHeight) / 2;
    }

    context.save();
    roundedRect(context, photoX, photoY, photoWidth, photoHeight, 10);
    context.clip();
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, photoX, photoY, photoWidth, photoHeight);
    context.restore();

    context.fillStyle = "#bb8591";
    context.font = "italic 26px Georgia, serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(caption, 280, 630, 500);

    const texture = new THREE.CanvasTexture(cardCanvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  function createPhotoCard(photo, index) {
    imageLoader.load(
      photo.src,
      (imageTexture) => {
        const image = imageTexture.image;
        const texture = makeCardTexture(image, photo.caption);
        imageTexture.dispose();

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true
        });
        const card = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 4.38), material);
        const angle = (index / photoList.length) * Math.PI * 2;
        const radius = window.innerWidth < 760 ? 5.8 : 6.7;
        card.position.set(Math.sin(angle) * radius, Math.sin(angle * 2) * 0.26, Math.cos(angle) * radius);
        card.rotation.y = angle;
        card.userData.angle = angle;
        card.userData.photoIndex = index;
        gallery.add(card);
        cards.push(card);
      },
      undefined,
      (error) => console.error(`Không thể tải ảnh ${photo.src}:`, error)
    );
  }

  photoList.forEach(createPhotoCard);

  const ambientLight = new THREE.AmbientLight(0xffd9e4, 1.7);
  scene.add(ambientLight);
  const keyLight = new THREE.PointLight(0xffc2cf, 34, 34);
  keyLight.position.set(-5, 6, 9);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0x9570b4, 22, 28);
  rimLight.position.set(6, -3, -8);
  scene.add(rimLight);

  const starGeometry = new THREE.BufferGeometry();
  const starCount = 750;
  const starPositions = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);

  for (let index = 0; index < starCount; index += 1) {
    starPositions[index * 3] = (Math.random() - 0.5) * 46;
    starPositions[index * 3 + 1] = (Math.random() - 0.5) * 30;
    starPositions[index * 3 + 2] = -5 - Math.random() * 30;
    starSizes[index] = 0.5 + Math.random() * 1.8;
  }

  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0xffe6d9, size: 0.045, transparent: true, opacity: 0.72 })
  );
  scene.add(stars);

  function makePetalTexture() {
    const petalCanvas = document.createElement("canvas");
    petalCanvas.width = 64;
    petalCanvas.height = 64;
    const context = petalCanvas.getContext("2d");
    if (!context) throw new Error("Không thể tạo cánh hoa.");

    const gradient = context.createRadialGradient(32, 32, 3, 32, 32, 29);
    gradient.addColorStop(0, "rgba(255,238,220,.94)");
    gradient.addColorStop(0.5, "rgba(237,164,184,.82)");
    gradient.addColorStop(1, "rgba(190,106,142,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(32, 32, 15, 27, 0, 0, Math.PI * 2);
    context.fill();
    return new THREE.CanvasTexture(petalCanvas);
  }

  const petalTexture = makePetalTexture();
  const petals = [];
  const petalCount = reducedMotion ? 20 : 65;

  for (let index = 0; index < petalCount; index += 1) {
    const material = new THREE.SpriteMaterial({
      map: petalTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.35 + Math.random() * 0.55
    });
    const petal = new THREE.Sprite(material);
    const size = 0.18 + Math.random() * 0.36;
    petal.scale.set(size, size * (1.15 + Math.random() * 0.6), 1);
    petal.position.set(
      (Math.random() - 0.5) * 23,
      (Math.random() - 0.5) * 15,
      2 - Math.random() * 20
    );
    petal.userData.speed = 0.25 + Math.random() * 0.55;
    petal.userData.sway = Math.random() * Math.PI * 2;
    petal.userData.swaySpeed = 0.25 + Math.random() * 0.45;
    scene.add(petal);
    petals.push(petal);
  }

  function setActivePhoto(index) {
    const nextPhoto = (index + photoList.length) % photoList.length;
    let steps = ((nextPhoto - activePhoto + photoList.length / 2) % photoList.length + photoList.length) % photoList.length - photoList.length / 2;
    targetRotation -= steps * (Math.PI * 2 / photoList.length);
    rotationVelocity = 0;
    autoRotate = false;
  }

  document.getElementById("photo-previous")?.addEventListener("click", () => {
    setActivePhoto(activePhoto - 1);
  });

  document.getElementById("photo-next")?.addEventListener("click", () => {
    setActivePhoto(activePhoto + 1);
  });

  document.getElementById("photo-dialog-close")?.addEventListener("click", () => dialog.close());

  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  canvas.addEventListener("pointerdown", (event) => {
    pointerDown = { x: event.clientX, y: event.clientY };
    lastPointerX = event.clientX;
    dragging = true;
    autoRotate = false;
    rotationVelocity = 0;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging || !pointerDown) return;
    const difference = event.clientX - lastPointerX;
    targetRotation += difference * 0.006;
    rotationVelocity = difference * 0.0004;
    lastPointerX = event.clientX;
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!pointerDown) return;
    const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    dragging = false;
    pointerDown = null;

    if (moved > 8 || cards.length === 0) return;
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const [clickedCard] = raycaster.intersectObjects(cards);
    if (!clickedCard) return;

    const index = clickedCard.object.userData.photoIndex;
    setActivePhoto(index);
    dialogPhoto.src = photoList[index].src;
    dialogPhoto.alt = photoList[index].caption;
    dialogCaption.textContent = photoList[index].caption;
    dialog.showModal();
  });

  canvas.addEventListener("pointercancel", () => {
    dragging = false;
    pointerDown = null;
  });

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.position.z = width < 760 ? 21 : 18;
    gallery.position.x = width < 760 ? -2 : Math.min(2.6, width / 600);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
  }

  window.addEventListener("resize", resize);

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    if (!dragging) {
      if (autoRotate) targetRotation += reducedMotion ? 0 : 0.045 * delta;
      targetRotation += rotationVelocity;
      rotationVelocity *= 0.92;
    }

    gallery.rotation.y += (targetRotation - gallery.rotation.y) * Math.min(1, delta * 2.5);
    gallery.rotation.x = Math.sin(elapsed * 0.18) * 0.045;

    let frontIndex = 0;
    let frontness = -Infinity;
    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index];
      const facingCamera = Math.cos(card.userData.angle + gallery.rotation.y);
      const scale = 0.88 + Math.max(0, facingCamera) * 0.12;
      card.scale.setScalar(scale);
      if (facingCamera > frontness) {
        frontIndex = card.userData.photoIndex;
        frontness = facingCamera;
      }
    }

    activePhoto = frontIndex;
    countLabel.textContent = `${String(activePhoto + 1).padStart(2, "0")} / ${String(photoList.length).padStart(2, "0")}`;

    for (const petal of petals) {
      petal.position.y -= petal.userData.speed * delta;
      petal.position.x += Math.sin(elapsed * petal.userData.swaySpeed + petal.userData.sway) * delta * 0.2;
      petal.material.rotation += delta * 0.18;

      if (petal.position.y < -9) {
        petal.position.y = 9;
        petal.position.x = (Math.random() - 0.5) * 23;
      }
    }

    stars.rotation.y = elapsed * 0.002;
    renderer.render(scene, camera);
  }

  animate();
})();
