/* ==========================================================================
   scene.js  -  The cinematic 3D background (Three.js)
   --------------------------------------------------------------------------
   What you see:
   1. A full-screen shader: deep-blue sound-wave ripples that morph into a
      glowing perspective net of lines as you scroll.
   2. A faceted glass crystal with orbiting light arcs (the hero object).
   3. Drifting particle dust that reacts to the mouse (parallax).
   If WebGL is not available, the CSS fallback background is used instead.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var canvas = document.getElementById('bg-canvas');

  if (!canvas || typeof THREE === 'undefined') {
    root.classList.add('no-webgl');
    return;
  }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    root.classList.add('no-webgl');
    return;
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isSmall = window.matchMedia('(max-width: 768px)').matches;
  var isTouch = 'ontouchstart' in window;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 1.75));
  renderer.autoClear = false;
  renderer.setClearColor(0x020619, 1);

  /* ---------- 1. Background shader (ripples -> grid) ---------- */
  var bgScene = new THREE.Scene();
  var bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  var bgMat = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uMix: { value: 0 },
      uAspect: { value: 1 },
      uCenter: { value: new THREE.Vector2(0.3, 0.0) },
      uMouse: { value: new THREE.Vector2(0, 0) }
    },
    vertexShader: [
      'varying vec2 vUv;',
      'void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
    ].join('\n'),
    fragmentShader: [
      'precision highp float;',
      'varying vec2 vUv;',
      'uniform float uTime; uniform float uMix; uniform float uAspect;',
      'uniform vec2 uCenter; uniform vec2 uMouse;',
      'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }',
      'float gridLine(float v, float w){ float f = abs(fract(v) - 0.5); return smoothstep(0.5 - w, 0.5, f); }',
      'void main(){',
      '  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);',
      '  vec2 c = uCenter + uMouse * 0.035;',
      '  float d = length(p - c);',
      '  vec3 deep = vec3(0.006, 0.016, 0.10);',
      '  vec3 mid  = vec3(0.02, 0.13, 0.62);',
      '  vec3 hi   = vec3(0.20, 0.62, 1.00);',
      /* ripples */
      '  float wave = sin(d * 24.0 - uTime * 1.15);',
      '  float band = smoothstep(-0.25, 0.95, wave);',
      '  float fall = exp(-d * 1.05);',
      '  vec3 rip = mix(deep, mid, band * fall * 1.5);',
      '  rip += hi * pow(max(wave, 0.0), 7.0) * fall * 0.28;',
      '  rip += vec3(0.08, 0.28, 0.95) * exp(-d * 3.2) * 0.55;',
      /* net of lines */
      '  float t = uTime * 0.04;',
      '  float a = dot(p, normalize(vec2(1.0, 0.55))) * 5.2 + t;',
      '  float b = dot(p, normalize(vec2(-1.0, 0.72))) * 5.2 - t;',
      '  float g = clamp(gridLine(a, 0.018) + gridLine(b, 0.018), 0.0, 1.0);',
      '  float glow = 0.35 + 0.65 * exp(-length(p - c) * 0.9);',
      '  vec3 grid = deep * 1.6 + vec3(0.02, 0.07, 0.42) * glow;',
      '  grid += vec3(0.18, 0.46, 1.0) * g * 0.42 * glow;',
      '  float streak = 1.0 - smoothstep(0.0, 0.014, abs(dot(p, vec2(-0.6, 0.8)) - sin(uTime * 0.18) * 0.9));',
      '  grid += hi * streak * 0.28;',
      '  vec3 col = mix(rip, grid, smoothstep(0.0, 1.0, uMix));',
      /* vignette + dither */
      '  vec2 v = vUv - 0.5;',
      '  col *= 1.0 - dot(v, v) * 1.15;',
      '  col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 120.0;',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n')
  });
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat));

  /* ---------- 2. Main 3D scene ---------- */
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  /* glowing glass material (fresnel rim) */
  function glassMaterial(opacity) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uOpacity: { value: opacity } },
      vertexShader: [
        'varying vec3 vN; varying vec3 vV;',
        'void main(){',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  vN = normalize(normalMatrix * normal);',
        '  vV = normalize(-mv.xyz);',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vN; varying vec3 vV;',
        'uniform float uOpacity;',
        'void main(){',
        '  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);',
        '  vec3 col = mix(vec3(0.05, 0.22, 0.95), vec3(0.40, 0.90, 1.0), f);',
        '  float a = (0.10 + f * 0.85) * uOpacity;',
        '  gl_FragColor = vec4(col * a * 1.7, a);',
        '}'
      ].join('\n')
    });
  }

  var hero = new THREE.Group();
  scene.add(hero);

  var crystalGeo = new THREE.IcosahedronGeometry(1.35, 1);
  if (crystalGeo.index) crystalGeo = crystalGeo.toNonIndexed();
  crystalGeo.computeVertexNormals(); // flat normals = faceted glass look
  var crystalMat = glassMaterial(1);
  var crystal = new THREE.Mesh(crystalGeo, crystalMat);
  hero.add(crystal);

  var edgeMat = new THREE.LineBasicMaterial({
    color: 0x6fd0ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending
  });
  var edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.35, 1)), edgeMat);
  hero.add(edges);

  var coreMat = glassMaterial(1.4);
  var core = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), coreMat);
  hero.add(core);

  var tintedMats = [crystalMat, coreMat];
  var cyanBasic = [];

  function makeRing(radius, arc, tilt) {
    var g = new THREE.Group();
    var m = new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    var arcMesh = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012, 8, 160, arc), m);
    var spark = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), m);
    spark.position.set(Math.cos(arc) * radius, Math.sin(arc) * radius, 0);
    g.add(arcMesh, spark);
    g.rotation.set(tilt[0], tilt[1], tilt[2]);
    cyanBasic.push(m);
    return g;
  }
  var ringA = makeRing(2.15, Math.PI * 1.35, [1.1, 0.3, 0]);
  var ringB = makeRing(2.6, Math.PI * 0.95, [-0.5, 0.9, 0.4]);
  hero.add(ringA, ringB);

  /* small orbiting shards for depth */
  var shards = [];
  var shardMat = new THREE.MeshBasicMaterial({ color: 0x9ae0ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
  cyanBasic.push(shardMat);
  for (var i = 0; i < 6; i++) {
    var s = new THREE.Mesh(new THREE.OctahedronGeometry(0.06 + Math.random() * 0.05, 0), shardMat);
    s.userData = {
      r: 1.9 + Math.random() * 1.2,
      speed: 0.15 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 1.6
    };
    hero.add(s);
    shards.push(s);
  }

  /* particle dust */
  function dotTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(160,215,255,0.55)');
    g.addColorStop(1, 'rgba(160,215,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  var tex = dotTexture();

  function makeDust(count, size, opacity) {
    var pos = new Float32Array(count * 3);
    for (var j = 0; j < count; j++) {
      pos[j * 3] = (Math.random() - 0.5) * 30;
      pos[j * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[j * 3 + 2] = -12 + Math.random() * 18;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      size: size, map: tex, transparent: true, opacity: opacity, depthWrite: false,
      blending: THREE.AdditiveBlending, sizeAttenuation: true, color: 0xa8d8ff
    });
    var pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return pts;
  }
  var dustFine = makeDust(isSmall ? 500 : 1300, 0.09, 0.85);
  var dustBig = makeDust(isSmall ? 40 : 110, 0.28, 0.5);

  /* ---------- 3. Sizing ---------- */
  var layout = { x: 2.4, y: 0, scale: 1 };

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    var aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    bgMat.uniforms.uAspect.value = aspect;

    if (aspect > 1.15) {
      layout.x = Math.min(3.3, aspect * 1.18); // lines up with the ripple centre (70% across)
      layout.y = 0.05;
      layout.scale = 1;
    } else {
      layout.x = 0;
      layout.y = 1.2; // lines up with the ripple centre (30% down) on phones
      layout.scale = aspect < 0.7 ? 0.72 : 0.9;
    }
    if (reduceMotion) frame(0);
  }

  /* ---------- 4. Mouse + scroll + loop ---------- */
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!isTouch) {
    window.addEventListener('pointermove', function (e) {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
  }

  var smoothP = 0;
  var clock = new THREE.Clock();
  var running = true;
  var HALF = 5.8; // maps world units to the shader's screen space

  function frame(forcedTime) {
    var t = typeof forcedTime === 'number' ? forcedTime : clock.getElapsedTime();

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    var prog = Math.min(window.scrollY / (window.innerHeight * 0.95), 1);
    smoothP += (prog - smoothP) * (reduceMotion ? 1 : 0.07);
    var p = smoothP;

    /* hero object: drifts away + dims as you leave the hero */
    var px = layout.x + (layout.x === 0 ? 0 : p * 0.9);
    var py = layout.y + p * (layout.x === 0 ? 1.2 : -0.6) + Math.sin(t * 0.8) * 0.08;
    hero.position.set(px + mouse.x * 0.25, py + mouse.y * 0.15, -p * 1.5);
    var sc = layout.scale * (1 - p * 0.42);
    hero.scale.setScalar(sc);
    hero.rotation.y = t * 0.25 + mouse.x * 0.6;
    hero.rotation.x = Math.sin(t * 0.4) * 0.18 - mouse.y * 0.35;

    var op = 1 - p * 0.72;
    for (var m = 0; m < tintedMats.length; m++) {
      tintedMats[m].uniforms.uOpacity.value = (m === 0 ? 1 : 1.4) * op;
    }
    edgeMat.opacity = 0.55 * op;
    for (var k = 0; k < cyanBasic.length; k++) cyanBasic[k].opacity = 0.9 * op;

    core.rotation.y = -t * 0.9;
    core.rotation.x = t * 0.6;
    ringA.rotation.z = t * 0.45;
    ringB.rotation.z = -t * 0.35;

    for (var n = 0; n < shards.length; n++) {
      var d = shards[n].userData;
      var a = t * d.speed + d.phase;
      shards[n].position.set(Math.cos(a) * d.r, Math.sin(a * 0.9) * d.r * 0.55 + d.tilt, Math.sin(a) * d.r * 0.6);
      shards[n].rotation.x = t;
      shards[n].rotation.y = t * 0.7;
    }

    /* camera dolly + parallax */
    camera.position.x = mouse.x * 0.45;
    camera.position.y = mouse.y * 0.3;
    camera.position.z = 7 - p * 1.4;
    camera.lookAt(0, 0, 0);

    dustFine.rotation.y = t * 0.012 + mouse.x * 0.05;
    dustFine.rotation.x = mouse.y * 0.03;
    dustFine.position.y = p * 1.5;
    dustBig.rotation.y = t * 0.02 + mouse.x * 0.09;
    dustBig.position.y = p * 2.4;

    /* background shader follows the hero object */
    var u = bgMat.uniforms;
    u.uTime.value = t;
    u.uMix.value = p;
    u.uMouse.value.set(mouse.x, mouse.y);
    u.uCenter.value.set(hero.position.x / HALF, hero.position.y / HALF);

    /* When the background video is playing, draw only the 3D objects on a
       transparent canvas. Otherwise draw the shader background too. */
    var videoOn = root.classList.contains('has-video');
    if (videoOn) { renderer.setClearColor(0x000000, 0); }
    else { renderer.setClearColor(0x020619, 1); }
    renderer.clear();
    if (!videoOn) {
      renderer.render(bgScene, bgCam);
      renderer.clearDepth();
    }
    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    frame();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  resize();

  if (reduceMotion) {
    frame(4); // one calm still frame, no animation
    window.addEventListener('scroll', function () { frame(4); }, { passive: true });
  } else {
    loop();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; }
      else if (!running) { running = true; clock.getDelta(); loop(); }
    });
  }

  root.classList.add('webgl-ready');
})();
