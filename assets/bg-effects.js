/**
 * Background Effects – soft starlight, drifting flowers, and rose-gold fireworks
 * Lấy từ cricle/enhanced-effects.js, chỉ giữ phần nền
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.module.js';

const isMobile = window.innerWidth < 768;

let scene, camera, renderer;
let staticStars, galaxy;
const photoSprites = [];
let fireworks = [];
let isInitialized = false;
let photosActive = window.__letterPhotosActive === true;
let effectsOpacity = 1;
let effectsStartTime = 0;
const EFFECTS_FADE_DURATION = 800;

window.setBackgroundPhotosActive = function (active) {
    photosActive = Boolean(active);
    window.__letterPhotosActive = photosActive;
    for (const photo of photoSprites) {
        if (photosActive) placePhotoAtEntry(photo, true);
        photo.material.opacity = photosActive ? photo.userData.baseOpacity * effectsOpacity : 0;
    }
};

function initBgEffects() {
    if (isInitialized) return;
    isInitialized = true;

    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'effects-overlay';
    overlayCanvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        background: transparent;
    `;
    document.body.insertBefore(overlayCanvas, document.body.firstChild);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 10, 65);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        canvas: overlayCanvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    createStarfield();
    createGalaxy();
    createPhotoField();

    effectsStartTime = Date.now();
    animateEffects();
    window.addEventListener('resize', onWindowResize);
}

function createStarfield() {
    const vertices = [];
    for (let i = 0; i < 2400; i++) {
        vertices.push(
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000
        );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffd9e6,
        size: 0.65,
        transparent: true,
        opacity: 0.45
    });
    staticStars = new THREE.Points(geometry, material);
    scene.add(staticStars);
}

function createGalaxy() {
    const particleCount = isMobile ? 7000 : 11000;
    const vertices = [];
    const colors = [];
    const maxRadius = 80;
    const spin = 1;

    const innerColor = new THREE.Color(0xffc1d2);
    const midColor = new THREE.Color(0xf28eaa);
    const outerColor = new THREE.Color(0xd9a86c);

    for (let i = 0; i < particleCount; i++) {
        const r = Math.pow(Math.random(), 1.5) * maxRadius;
        const angle = Math.random() * Math.PI * 2;
        const spinAngle = r * spin * 0.05;
        const x = Math.cos(angle + spinAngle) * r;
        const y = (Math.random() - 0.5) * 1.5;
        const z = Math.sin(angle + spinAngle) * r;
        vertices.push(x, y, z);

        const t = r / maxRadius;
        let color;
        if (t < 0.5) {
            color = innerColor.clone().lerp(midColor, t * 2);
        } else {
            color = midColor.clone().lerp(outerColor, (t - 0.5) * 2);
        }
        const variation = 0.06;
        color.r += (Math.random() - 0.5) * variation;
        color.g += (Math.random() - 0.5) * variation;
        color.b += (Math.random() - 0.5) * variation;
        colors.push(color.r, color.g, color.b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.16,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.32,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    galaxy = new THREE.Points(geometry, material);
    galaxy.position.y = -20;
    scene.add(galaxy);
}

function createPhotoField() {
    const loader = new THREE.TextureLoader();
    const count = isMobile ? 9 : 14;
    const photoPaths = [
        "./images/anh/1792249510527_498492874585012897_8132075415164140944_f776cca49ef785473842dcbceaae0f55.jpg",
        "./images/anh/1792519421097_498492874585012897_8132075415164140944_372ba039c4ebff17ed2ffd2294fcaf6e.jpg",
        "./images/anh/1792525705309_498492874585012897_8132075415164140944_3bd29a05a68698ac6ed8d7c24697d887.jpg",
        "./images/anh/1792519515385_498492874585012897_8132075415164140944_2f28fbef61eee7bd9d0ad96536cf36a2.jpg",
        "./images/anh/1792520744886_498492874585012897_8132075415164140944_0e503b84e9ee7f2f4505f124b577d522.jpg",
        "./images/anh/1792520774791_498492874585012897_8132075415164140944_bda86407eedb86a68f8099a050b7b52e.jpg"
    ];
    const photoCount = photoPaths.length;
    for (let i = 0; i < photoCount; i++) {
        loader.load(
            photoPaths[i],
            (loadedTexture) => {
                loadedTexture.colorSpace = THREE.SRGBColorSpace;
                for (let j = i; j < count; j += photoCount) {
                    const baseOpacity = 0.38 + Math.random() * 0.2;
                    const material = new THREE.SpriteMaterial({
                        map: loadedTexture,
                        transparent: true,
                        opacity: photosActive ? baseOpacity * effectsOpacity : 0,
                        depthWrite: false
                    });
                    const photo = new THREE.Sprite(material);
                    const height = 9 + Math.random() * 5;
                    const aspectRatio = loadedTexture.image.width / loadedTexture.image.height;
                    photo.scale.set(height * aspectRatio, height, 1);
                    photo.userData = {
                        baseOpacity,
                        speed: 0.18 + Math.random() * 0.12,
                        sway: Math.random() * Math.PI * 2,
                        direction: Math.random() < 0.5 ? -1 : 1
                    };
                    photo.position.z = -18 + Math.random() * 34;
                    placePhotoAtEntry(photo, true);
                    photoSprites.push(photo);
                    scene.add(photo);
                }
            },
            undefined,
            (error) => console.error(`Unable to load ${photoPaths[i]}.`, error)
        );
    }
}

function getPhotoTravelBounds(photo) {
    const distance = camera.position.z - photo.position.z;
    const halfHeight = distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return { halfWidth: halfHeight * camera.aspect, halfHeight };
}

function placePhotoAtEntry(photo, stagger = false) {
    const { halfWidth, halfHeight } = getPhotoTravelBounds(photo);
    const direction = photo.userData.direction;
    const margin = photo.scale.x * 0.6;
    const entryX = -direction * (halfWidth + margin);
    photo.position.x = stagger
        ? entryX + direction * Math.random() * halfWidth * 1.5
        : entryX;
    photo.position.y = (Math.random() * 2 - 1) * halfHeight * 0.82;
}

class Firework {
    constructor(scene) {
        this.scene = scene;
        this.isDead = false;
        const startX = (Math.random() - 0.5) * 40;
        const startY = 20 + Math.random() * 30;
        const startZ = (Math.random() - 0.5) * 20;
        this.createExplosion(new THREE.Vector3(startX, startY, startZ));
    }

    createExplosion(position) {
        const particleCount = 80;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const colors = [0xffa6c1, 0xf26d96, 0xffd58a];
        const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);
            positions.push(position.x, position.y, position.z);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const speed = 0.12 + Math.random() * 0.2;
            velocities.push({
                x: Math.sin(phi) * Math.cos(theta) * speed,
                y: Math.sin(phi) * Math.sin(theta) * speed,
                z: Math.cos(phi) * speed
            });
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        this.mesh = new THREE.LineSegments(geometry, material);
        this.mesh.userData = { velocities, life: 1.0, drag: 0.96 };
        this.scene.add(this.mesh);
    }

    update() {
        if (this.isDead) return;
        const positions = this.mesh.geometry.attributes.position.array;
        const velocities = this.mesh.userData.velocities;
        const gravity = -0.005;
        const drag = this.mesh.userData.drag;

        this.mesh.userData.life -= 0.012;
        this.mesh.material.opacity = this.mesh.userData.life;

        for (let i = 0; i < velocities.length; i++) {
            velocities[i].x *= drag;
            velocities[i].y *= drag;
            velocities[i].z *= drag;
            velocities[i].y += gravity;

            const headIdx = i * 6;
            const tailIdx = i * 6 + 3;

            positions[tailIdx] += (positions[headIdx] - positions[tailIdx]) * 0.15;
            positions[tailIdx + 1] += (positions[headIdx + 1] - positions[tailIdx + 1]) * 0.15;
            positions[tailIdx + 2] += (positions[headIdx + 2] - positions[tailIdx + 2]) * 0.15;

            positions[headIdx] += velocities[i].x;
            positions[headIdx + 1] += velocities[i].y;
            positions[headIdx + 2] += velocities[i].z;
        }

        this.mesh.geometry.attributes.position.needsUpdate = true;

        if (this.mesh.userData.life <= 0) {
            this.isDead = true;
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}

function setEffectsOpacity(opacity) {
    if (staticStars && staticStars.material) {
        staticStars.material.opacity = 0.45 * opacity;
    }
    if (galaxy && galaxy.material) {
        galaxy.material.opacity = 0.32 * opacity;
    }
    for (const photo of photoSprites) {
        photo.material.opacity = photosActive ? photo.userData.baseOpacity * opacity : 0;
    }
}

function animateEffects() {
    requestAnimationFrame(animateEffects);

    const time = Date.now() * 0.0005;
    const now = Date.now();

    if (effectsOpacity < 1 && effectsStartTime > 0) {
        const elapsed = now - effectsStartTime;
        effectsOpacity = Math.min(1, elapsed / EFFECTS_FADE_DURATION);
        setEffectsOpacity(effectsOpacity);
    }

    if (photosActive) {
        for (const photo of photoSprites) {
            const direction = photo.userData.direction;
            photo.position.x += direction * photo.userData.speed;
            photo.position.y += Math.sin(time + photo.userData.sway) * 0.018;
            if (Math.abs(photo.position.x) > getPhotoTravelBounds(photo).halfWidth + photo.scale.x * 0.6) {
                placePhotoAtEntry(photo);
            }
        }
    }

    if (galaxy) {
        galaxy.rotation.y += 0.0003;
    }

    if (Math.random() < 0.002) {
        fireworks.push(new Firework(scene));
    }
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        if (fireworks[i].isDead) fireworks.splice(i, 1);
    }

    if (renderer) {
        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Tự chạy khi load
setTimeout(initBgEffects, 80);
