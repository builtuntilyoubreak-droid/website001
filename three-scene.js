/* ===== The Event Originators — Elegant Particle Scene ===== */
/* Soft floating particles with warm tones — no wireframes */
(function () {
    'use strict';

    var canvas = document.getElementById('heroCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 18);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    /* ---- Soft warm lighting ---- */
    scene.add(new THREE.AmbientLight(0xfdf8f4, 0.8));
    var warmLight = new THREE.PointLight(0xc06b48, 1.5, 60);
    warmLight.position.set(-8, 5, 8);
    scene.add(warmLight);
    var goldLight = new THREE.PointLight(0xc5a55a, 1.2, 60);
    goldLight.position.set(10, -3, 6);
    scene.add(goldLight);
    var roseLight = new THREE.PointLight(0xdb7093, 0.9, 60);
    roseLight.position.set(0, 7, -8);
    scene.add(roseLight);

    /* ---- Floating organic spheres (soft, frosted) ---- */
    var group = new THREE.Group();
    scene.add(group);

    var palette = [0xd4956b, 0xc5a55a, 0xdb7093, 0xf4c2c2, 0xe8d5a3, 0xc06b48];

    var shapes = [];

    function makeOrb(radius, color, x, y, z) {
        var geom = new THREE.SphereGeometry(radius, 32, 32);
        var mat = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.1,
            roughness: 0.6,
            transparent: true,
            opacity: 0.0
        });
        var mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, y, z);
        mesh.userData = {
            floatSpeed: 0.2 + Math.random() * 0.4,
            floatPhase: Math.random() * Math.PI * 2,
            baseY: y,
            baseX: x,
            amp: 0.4 + Math.random() * 0.6,
            targetOpacity: 0.2 + Math.random() * 0.25
        };
        group.add(mesh);
        shapes.push(mesh);
        return mesh;
    }

    // Create soft floating orbs scattered around
    makeOrb(1.8, palette[0], -6, 3, -4);
    makeOrb(1.2, palette[1], 7, -2, -3);
    makeOrb(2.2, palette[2], 5, 4, -6);
    makeOrb(0.9, palette[3], -4, -3, -2);
    makeOrb(1.5, palette[4], -8, 1, -5);
    makeOrb(1.0, palette[5], 3, -4, -4);
    makeOrb(2.5, palette[0], 9, 2, -8);
    makeOrb(0.7, palette[2], -3, 5, -3);
    makeOrb(1.3, palette[3], -9, -1, -6);
    makeOrb(0.8, palette[1], 6, 5, -5);

    /* ---- Soft particle field (warm tones, like floating dust in sunlight) ---- */
    var particleCount = 800;
    var positions = new Float32Array(particleCount * 3);
    var colors = new Float32Array(particleCount * 3);

    var c1 = new THREE.Color(0xd4956b);
    var c2 = new THREE.Color(0xc5a55a);
    var c3 = new THREE.Color(0xdb7093);
    var c4 = new THREE.Color(0xf4c2c2);

    for (var p = 0; p < particleCount; p++) {
        var r = 5 + Math.random() * 20;
        var theta = Math.random() * Math.PI * 2;
        var phi = Math.acos((Math.random() * 2) - 1);
        positions[p * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[p * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[p * 3 + 2] = r * Math.cos(phi);

        var mix = Math.random();
        var col = mix < 0.25 ? c1 : (mix < 0.5 ? c2 : (mix < 0.75 ? c3 : c4));
        colors[p * 3] = col.r;
        colors[p * 3 + 1] = col.g;
        colors[p * 3 + 2] = col.b;
    }

    var particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var particleMat = new THREE.PointsMaterial({
        size: 0.06,
        vertexColors: true,
        transparent: true,
        opacity: 0.0,
        sizeAttenuation: true,
        blending: THREE.NormalBlending,
        depthWrite: false
    });
    var particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    /* ---- Mouse parallax (gentle) ---- */
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('mousemove', function (e) {
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    });
    window.addEventListener('touchmove', function (e) {
        if (e.touches[0]) {
            mouse.tx = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.ty = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
        }
    }, { passive: true });

    /* ---- Scroll influence ---- */
    var scrollY = 0;
    window.addEventListener('scroll', function () { scrollY = window.scrollY || 0; }, { passive: true });

    /* ---- Resize ---- */
    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    }
    window.addEventListener('resize', onResize);

    /* ---- Animate ---- */
    var clock = new THREE.Clock();
    var revealStart = 0;
    var revealed = false;

    function revealScene() {
        if (revealed) return;
        revealed = true;
        revealStart = clock.getElapsedTime();
    }
    window.addEventListener('teo:ready', revealScene);
    setTimeout(revealScene, 2200);

    function animate() {
        requestAnimationFrame(animate);
        var t = clock.getElapsedTime();

        // smooth mouse
        mouse.x += (mouse.tx - mouse.x) * 0.03;
        mouse.y += (mouse.ty - mouse.y) * 0.03;

        // very gentle camera parallax
        camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.02;
        camera.position.y += (-mouse.y * 0.8 - camera.position.y) * 0.02;
        camera.position.z = 18 + Math.min(scrollY / window.innerHeight, 1) * 4;
        camera.lookAt(0, 0, 0);

        // shapes float gently
        for (var s = 0; s < shapes.length; s++) {
            var n = shapes[s];
            n.position.y = n.userData.baseY + Math.sin(t * n.userData.floatSpeed + n.userData.floatPhase) * n.userData.amp;
            n.position.x = n.userData.baseX + Math.cos(t * n.userData.floatSpeed * 0.7 + n.userData.floatPhase) * n.userData.amp * 0.5;
        }
        group.rotation.y = t * 0.015 + mouse.x * 0.1;

        // reveal opacity ramp (slow and elegant)
        if (revealed) {
            var progress = Math.min((clock.getElapsedTime() - revealStart) / 2.5, 1);
            var ease = 1 - Math.pow(1 - progress, 3);
            particleMat.opacity = 0.5 * ease;
            for (var k = 0; k < shapes.length; k++) {
                shapes[k].material.opacity = shapes[k].userData.targetOpacity * ease;
            }
        }

        // particles drift slowly
        particles.rotation.y = t * 0.008;
        particles.rotation.x = t * 0.004;

        // gentle light pulsing
        warmLight.intensity = 1.3 + Math.sin(t * 0.6) * 0.3;
        goldLight.intensity = 1.0 + Math.cos(t * 0.5) * 0.2;

        renderer.render(scene, camera);
    }
    animate();
})();
