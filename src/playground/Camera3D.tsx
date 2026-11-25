import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* A 3D instant camera modelled closely after the "Misty White" reference photos (without branding),
 * hanging in the air above the meadow and seen from the photos' "main view".
 *
 * Key geometric details matched to the reference photos:
 * - Accurate 1.14:1 body proportions (W=13.6, H=11.9) with soft top corners and flat-sitting bottom corners
 * - Sculpted elliptical-dome left grip (LatheGeometry scaled to an asymmetric oval) extending flush to
 *   the bottom edge and wrapping with vertical grooves around the front, left flank, and rear swell
 * - Circular shutter button tilted (~34°) on the grip's domed upper shoulder
 * - Concave beveled viewfinder pocket molded directly into the front shell
 * - Flush stadium-shaped dark top panel with recessed film slot
 * - Pale-champagne translucent flash housing wrapping a bright chrome reflector
 * - 4-step lens barrel with planar-UV ribbed faceplate and a circular lens window that displays a
 *   miniature preview of the project currently being printed. */

export type CameraHandle = {
  shutter: () => void;
  slotPoint: () => { x: number; y: number } | null;
};

type Props = {
  body: string;
  label: string;
  className?: string;
  /** Thumbnail image URL of the project currently being printed (shown in the lens circle). */
  previewImage?: string;
  /** Called when the camera model is clicked or tapped. */
  onActivate?: () => void;
  /** Cursor tag shown while hovering the model. */
  activateLabel?: string;
  /** When true the render loop is suspended (e.g. a modal dialog covers the camera). */
  paused?: boolean;
};

// Procedural vertical grip grooves + subtle battery-door seam for the LatheGeometry grip.
// Lathe UV: u=0/1 is +Z (front), u=0.25 is +X (inner valley), u=0.5 is -Z (back), u=0.75 is -X (left flank).
// v runs 0 (bottom) -> 1 (top dome apex); rib cutoff at y=0.65 is at v = 32/48.
function gripTextures() {
  const w = 1024;
  const h = 512;

  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = w;
  colorCanvas.height = h;
  const cg = colorCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bg = bumpCanvas.getContext("2d")!;

  // Smooth base (top dome & unribbed inner valley stay smooth)
  cg.fillStyle = "#ffffff";
  cg.fillRect(0, 0, w, h);
  bg.fillStyle = "#cccccc";
  bg.fillRect(0, 0, w, h);

  const ribTopV = 32 / 48; // y = 0.65
  const ribTopPy = Math.round((1 - ribTopV) * h);
  const ribBotPy = Math.round(h * 0.965);

  // Subtle horizontal trim crease where the ribs start
  cg.fillStyle = "rgba(0,0,0,0.08)";
  cg.fillRect(0, ribTopPy - 2, w, 3);
  bg.fillStyle = "#7a7a7a";
  bg.fillRect(0, ribTopPy - 2, w, 3);

  // Vertical grooves across the front (u in [0..0.15] and [0.85..1]), left flank (0.62..0.85),
  // and back thumb-rest (0.40..0.62), skipping the inner valley inside the body (0.15..0.40).
  const numGrooves = 48;
  for (let i = 0; i < numGrooves; i++) {
    const u = (i + 0.5) / numGrooves;
    if (u > 0.145 && u < 0.4) continue;

    // Under the shutter button (around u = 0 or u = 1), curve the groove tops smoothly downward
    const distFromFront = Math.min(u, 1 - u);
    const btnDrop = distFromFront < 0.08 ? Math.cos((distFromFront / 0.08) * (Math.PI / 2)) * 22 : 0;
    const startPy = ribTopPy + 3 + btnDrop;
    const len = ribBotPy - startPy;
    if (len <= 0) continue;

    const gx = u * w;
    const gw = 5.5;
    cg.fillStyle = "rgba(0,0,0,0.085)";
    cg.fillRect(gx - gw / 2, startPy, gw, len);
    cg.fillStyle = "rgba(255,255,255,0.22)";
    cg.fillRect(gx + gw / 2, startPy, 2, len);

    bg.fillStyle = "#363636";
    bg.fillRect(gx - gw / 2, startPy, gw, len);
  }

  // Crisp vertical battery-door seam on the outer left flank (around u = 0.72)
  const seamX = 0.72 * w;
  cg.fillStyle = "rgba(0,0,0,0.14)";
  cg.fillRect(seamX, ribTopPy - 18, 2.5, ribBotPy - ribTopPy + 18);
  bg.fillStyle = "#222222";
  bg.fillRect(seamX, ribTopPy - 18, 2.5, ribBotPy - ribTopPy + 18);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.anisotropy = 4;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.anisotropy = 4;

  return { map, bumpMap };
}

// High-res planar-mapped ribbed lens faceplate (color + bump), matching the close-up filter photos.
function lensFaceTextures() {
  const size = 1024;
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.49;

  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cg = colorCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bg = bumpCanvas.getContext("2d")!;

  cg.fillStyle = "#1a1a1e";
  cg.fillRect(0, 0, size, size);
  bg.fillStyle = "#c8c8c8";
  bg.fillRect(0, 0, size, size);

  const grooves = 44;
  const step = (R * 2) / grooves;
  const grooveW = Math.max(3, step * 0.28);
  for (let i = 0; i <= grooves; i++) {
    const gx = cx - R + i * step;
    cg.fillStyle = "#0e0e11";
    cg.fillRect(gx - grooveW / 2, 0, grooveW, size);
    cg.fillStyle = "rgba(255,255,255,0.035)";
    cg.fillRect(gx + grooveW / 2, 0, 1.5, size);

    bg.fillStyle = "#2b2b2b";
    bg.fillRect(gx - grooveW / 2, 0, grooveW, size);
  }

  // Smooth un-ribbed zones around cutouts (normalized to faceplate radius = 3.55 in 3D)
  const scale = R / 3.55;
  const maskCircle = (x: number, y: number, r: number) => {
    const px = cx + x * scale;
    const py = cy - y * scale;
    const pr = r * scale;
    cg.fillStyle = "#19191d";
    cg.beginPath();
    cg.arc(px, py, pr, 0, Math.PI * 2);
    cg.fill();
    bg.fillStyle = "#b8b8b8";
    bg.beginPath();
    bg.arc(px, py, pr, 0, Math.PI * 2);
    bg.fill();
  };

  maskCircle(0, 0, 1.42);
  maskCircle(2.04, 0.02, 0.68);

  const maskPill = (x: number, y: number, w: number, h: number) => {
    const px = cx + x * scale;
    const py = cy - y * scale;
    const pw = w * scale;
    const ph = h * scale;
    for (const [ctx, fill] of [
      [cg, "#19191d"],
      [bg, "#b8b8b8"],
    ] as const) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(px - pw / 2, py - ph / 2, pw, ph, pw / 2);
      ctx.fill();
    }
  };
  maskPill(-2.1, 0, 0.8, 1.36);

  for (const [ctx, fill] of [
    [cg, "#19191d"],
    [bg, "#b8b8b8"],
  ] as const) {
    ctx.strokeStyle = fill;
    ctx.lineWidth = 0.6 * scale;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, 2.48 * scale, (26 * Math.PI) / 180, (64 * Math.PI) / 180);
    ctx.stroke();
  }

  for (const [ctx, fill] of [
    [cg, "#19191d"],
    [bg, "#c0c0c0"],
  ] as const) {
    ctx.strokeStyle = fill;
    ctx.lineWidth = 0.24 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, R - 0.1 * scale, 0, Math.PI * 2);
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = 4;
  return { map, bumpMap };
}

// Flash window: fine fresnel lens grid over a bright reflector, clipped to a stadium silhouette.
function flashTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 256, 96);
  g.save();
  g.beginPath();
  g.roundRect(8, 8, 240, 80, 40);
  g.clip();
  const tube = g.createLinearGradient(0, 26, 0, 70);
  tube.addColorStop(0, "rgba(255,255,255,0)");
  tube.addColorStop(0.5, "rgba(255,255,250,0.42)");
  tube.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = tube;
  g.fillRect(8, 24, 240, 48);
  g.strokeStyle = "rgba(130,132,115,0.42)";
  g.lineWidth = 1.4;
  for (let x = 14; x < 244; x += 6) {
    g.beginPath();
    g.moveTo(x, 8);
    g.lineTo(x, 88);
    g.stroke();
  }
  g.strokeStyle = "rgba(130,132,115,0.28)";
  g.lineWidth = 1.2;
  for (let y = 18; y < 80; y += 10) {
    g.beginPath();
    g.moveTo(8, y);
    g.lineTo(248, y);
    g.stroke();
  }
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Paint a square cover-cropped project thumbnail onto a circular canvas texture.
function drawPreviewToCanvas(img: HTMLImageElement, canvas: HTMLCanvasElement) {
  const s = canvas.width;
  const g = canvas.getContext("2d")!;
  g.clearRect(0, 0, s, s);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const side = Math.min(iw, ih);
  const sx = (iw - side) / 2;
  const sy = (ih - side) / 2;
  g.drawImage(img, sx, sy, side, side, 0, 0, s, s);
  // Subtle inner optical vignette so it sits naturally inside the dark circular bezel
  const vig = g.createRadialGradient(s / 2, s / 2, s * 0.25, s / 2, s / 2, s * 0.52);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.32)");
  g.fillStyle = vig;
  g.fillRect(0, 0, s, s);
}

// CCW rounded rectangle with independent top/bottom corner radii (flat bottom corners, softer top).
function asymmetricRoundedRect(w: number, h: number, rTL: number, rTR: number, rBR: number, rBL: number) {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  s.moveTo(-hw + rBL, -hh);
  s.lineTo(hw - rBR, -hh);
  s.absarc(hw - rBR, -hh + rBR, rBR, -Math.PI / 2, 0, false);
  s.lineTo(hw, hh - rTR);
  s.absarc(hw - rTR, hh - rTR, rTR, 0, Math.PI / 2, false);
  s.lineTo(-hw + rTL, hh);
  s.absarc(-hw + rTL, hh - rTL, rTL, Math.PI / 2, Math.PI, false);
  s.lineTo(-hw, -hh + rBL);
  s.absarc(-hw + rBL, -hh + rBL, rBL, Math.PI, Math.PI * 1.5, false);
  return s;
}

// CW rounded rectangle Path (used as a cutout hole in an outer CCW Shape).
function cwRoundedHole(cx: number, cy: number, w: number, h: number, r: number) {
  const p = new THREE.Path();
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  p.moveTo(x0 + r, y0);
  p.absarc(x0 + r, y0 + r, r, -Math.PI / 2, -Math.PI, true);
  p.lineTo(x0, y1 - r);
  p.absarc(x0 + r, y1 - r, r, Math.PI, Math.PI / 2, true);
  p.lineTo(x1 - r, y1);
  p.absarc(x1 - r, y1 - r, r, Math.PI / 2, 0, true);
  p.lineTo(x1, y0 + r);
  p.absarc(x1 - r, y0 + r, r, 0, -Math.PI / 2, true);
  return p;
}

function stadiumShape(w: number, h: number) {
  const r = Math.min(w, h) / 2;
  return asymmetricRoundedRect(w, h, r, r, r, r);
}

function arcTrackShape(radius: number, halfWidth: number, startAngle: number, endAngle: number) {
  const s = new THREE.Shape();
  const rOut = radius + halfWidth;
  const rIn = radius - halfWidth;
  s.absarc(0, 0, rOut, startAngle, endAngle, false);
  s.absarc(
    Math.cos(endAngle) * radius,
    Math.sin(endAngle) * radius,
    halfWidth,
    endAngle,
    endAngle + Math.PI,
    false
  );
  s.absarc(0, 0, rIn, endAngle, startAngle, true);
  s.absarc(
    Math.cos(startAngle) * radius,
    Math.sin(startAngle) * radius,
    halfWidth,
    startAngle + Math.PI,
    startAngle + Math.PI * 2,
    false
  );
  return s;
}

const Camera3D = forwardRef<CameraHandle, Props>(function Camera3D(
  { body, label, className, previewImage, onActivate, activateLabel = "Snap", paused },
  ref
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const activateRef = useRef(onActivate);
  activateRef.current = onActivate;
  const pausedRef = useRef(!!paused);
  pausedRef.current = !!paused;
  const api = useRef<CameraHandle & { setColor: (b: string) => void; setPreview: (url?: string) => void; wake: () => void }>({
    shutter: () => {},
    slotPoint: () => null,
    setColor: () => {},
    setPreview: () => {},
    wake: () => {},
  });

  useImperativeHandle(
    ref,
    () => ({
      shutter: () => api.current.shutter(),
      slotPoint: () => api.current.slotPoint(),
    }),
    []
  );

  useEffect(() => {
    api.current.setColor(body);
  }, [body]);

  useEffect(() => {
    api.current.setPreview(previewImage);
  }, [previewImage]);

  // When unpaused, restart the render loop so the camera comes back to life.
  useEffect(() => {
    if (!paused) api.current.wake();
  }, [paused]);

  useEffect(() => {
    const host = hostRef.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const view = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
    view.position.set(0, 5.6, 47.5);
    view.lookAt(0, -0.5, 0);

    // Soft daylight matching the outdoor meadow backdrop
    scene.add(new THREE.HemisphereLight(0xe8f1ff, 0xbbc9a0, 0.65));
    const sun = new THREE.DirectionalLight(0xfff2e2, 2.0);
    sun.position.set(-12, 20, 24);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xe6f0ff, 0.6);
    fill.position.set(20, 4, 12);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.4);
    rim.position.set(6, 10, -20);
    scene.add(rim);
    const flashLight = new THREE.PointLight(0xfff6dc, 0, 60, 1.6);
    scene.add(flashLight);

    // ---- materials ----
    const bodyColor = new THREE.Color(body);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: bodyColor.clone(),
      roughness: 0.56,
      clearcoat: 0.08,
      clearcoatRoughness: 0.55,
      envMapIntensity: 0.35,
    });
    const { map: gripMap, bumpMap: gripBump } = gripTextures();
    const gripMat = new THREE.MeshPhysicalMaterial({
      color: bodyColor.clone(),
      map: gripMap,
      bumpMap: gripBump,
      bumpScale: 0.08,
      roughness: 0.58,
      clearcoat: 0.06,
      clearcoatRoughness: 0.6,
      envMapIntensity: 0.32,
    });
    const dark = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.48, envMapIntensity: 0.5 });
    const darkRecess = new THREE.MeshStandardMaterial({ color: 0x0f0f12, roughness: 0.62, envMapIntensity: 0.3 });
    const { map: faceMap, bumpMap: faceBump } = lensFaceTextures();
    const lensFace = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: faceMap,
      bumpMap: faceBump,
      bumpScale: 0.045,
      roughness: 0.52,
      envMapIntensity: 0.45,
    });
    const gloss = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0c, roughness: 0.1, clearcoat: 1, envMapIntensity: 1.0 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x1a2634, roughness: 0.03, metalness: 0.55, clearcoat: 1, envMapIntensity: 1.7 });
    const lensGlass = new THREE.MeshPhysicalMaterial({ color: 0x13202e, roughness: 0.02, metalness: 0.6, clearcoat: 1, envMapIntensity: 2.1 });
    const mirror = new THREE.MeshStandardMaterial({ color: 0xf7f7f7, metalness: 0.96, roughness: 0.05, envMapIntensity: 1.5 });
    // Project preview texture inside the lens circle
    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = 256;
    previewCanvas.height = 256;
    const pg = previewCanvas.getContext("2d")!;
    pg.fillStyle = "#181a1c";
    pg.fillRect(0, 0, 256, 256);
    const previewTex = new THREE.CanvasTexture(previewCanvas);
    previewTex.colorSpace = THREE.SRGBColorSpace;
    const previewMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: previewTex,
      roughness: 0.25,
      metalness: 0.05,
      envMapIntensity: 0.55,
    });
    const previewGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.04,
      clearcoat: 1,
      transparent: true,
      opacity: 0.18,
      envMapIntensity: 1.6,
    });

    const led = new THREE.MeshPhysicalMaterial({
      color: 0xff7a18,
      emissive: 0xff5e00,
      emissiveIntensity: 0.95,
      roughness: 0.12,
      clearcoat: 1,
    });
    const flashBezelMat = new THREE.MeshPhysicalMaterial({
      color: 0xdbe2c4,
      roughness: 0.08,
      clearcoat: 1,
      transparent: true,
      opacity: 0.62,
      envMapIntensity: 1.4,
    });
    const flashReflectorMat = new THREE.MeshStandardMaterial({
      color: 0xe6e8e3,
      metalness: 0.88,
      roughness: 0.14,
      emissive: 0xfff6dc,
      emissiveIntensity: 0,
      envMapIntensity: 1.2,
    });
    const flashLines = new THREE.MeshBasicMaterial({ map: flashTexture(), transparent: true, depthWrite: false });
    const seam = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const seamLine = new THREE.MeshStandardMaterial({ color: 0x1d1d20, roughness: 0.7, transparent: true, opacity: 0.42 });
    const highlight = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const filterDot = new THREE.MeshBasicMaterial({ color: 0x6baee0 });

    const model = new THREE.Group();
    scene.add(model);
    const add = (
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      parent: THREE.Object3D = model
    ) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    const cyl = (r1: number, r2: number, h: number, seg = 96) => {
      const g = new THREE.CylinderGeometry(r1, r2, h, seg);
      g.rotateX(Math.PI / 2); // axis along +z
      return g;
    };
    const overlay = (m: THREE.Mesh) => {
      m.renderOrder = 2;
      return m;
    };

    // Proportions from front.jpg (1503x1317 => 1.141:1) & back view.jpg (1.148:1)
    const W = 13.6;
    const H = 11.9;
    const D = 4.4;
    const FRONT = D / 2; // 2.20
    const BACK = -D / 2; // -2.20
    const BEVEL = 0.42;

    // ---- main shell (asymmetric corners: soft top, tighter flat-sitting bottom) ----
    const coreShape = asymmetricRoundedRect(
      W - BEVEL * 2,
      H - BEVEL * 2,
      1.68 - BEVEL,
      1.58 - BEVEL,
      0.5 - BEVEL,
      0.5 - BEVEL
    );
    const coreGeo = new THREE.ExtrudeGeometry(coreShape, {
      depth: D - BEVEL * 2 - 0.55,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 8,
      curveSegments: 24,
    });
    add(coreGeo, bodyMat, 0, 0, BACK + BEVEL);

    // Front face skin with a real beveled concave cutout hole for the viewfinder pocket
    const vfX = -4.9;
    const vfY = 4.02;
    const frontSkinShape = asymmetricRoundedRect(
      W - BEVEL * 2,
      H - BEVEL * 2,
      1.68 - BEVEL,
      1.58 - BEVEL,
      0.5 - BEVEL,
      0.5 - BEVEL
    );
    frontSkinShape.holes.push(cwRoundedHole(vfX, vfY, 2.26, 2.0, 0.45));
    const frontSkinGeo = new THREE.ExtrudeGeometry(frontSkinShape, {
      depth: 0.48,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 8,
      curveSegments: 24,
    });
    add(frontSkinGeo, bodyMat, 0, 0, FRONT - 0.48 - BEVEL);

    // Perimeter parting seam between front and rear halves
    const seamOuter = asymmetricRoundedRect(W + 0.02, H + 0.02, 1.69, 1.59, 0.51, 0.51);
    seamOuter.holes.push(cwRoundedHole(0, 0, W - 0.5, H - 0.5, 0.35));
    const seamGeo = new THREE.ExtrudeGeometry(seamOuter, { depth: 0.045, bevelEnabled: false, curveSegments: 20 });
    add(seamGeo, seamLine, 0, 0, -0.35);

    // ---- viewfinder optics inside the recessed pocket ----
    add(new RoundedBoxGeometry(1.04, 1.0, 0.18, 2, 0.14), gloss, vfX - 0.04, vfY + 0.04, FRONT - 0.44);
    add(new THREE.PlaneGeometry(0.76, 0.72), glass, vfX - 0.04, vfY + 0.04, FRONT - 0.34);
    add(cyl(0.24, 0.24, 0.03, 32), lensGlass, vfX - 0.04, vfY + 0.04, FRONT - 0.32);
    const vfGlint = overlay(add(new THREE.CircleGeometry(0.065, 16), highlight, vfX + 0.06, vfY + 0.12, FRONT - 0.3));
    vfGlint.renderOrder = 3;

    // ---- status light (flush vertical amber pill) ----
    add(new RoundedBoxGeometry(0.32, 0.84, 0.14, 3, 0.15), darkRecess, -3.05, 4.02, FRONT - 0.03);
    add(new RoundedBoxGeometry(0.26, 0.76, 0.14, 3, 0.13), led, -3.05, 4.02, FRONT - 0.005);

    // ---- top panel: flush stadium-shaped dark inlay and recessed film slot ----
    const topPlateGeo = new THREE.ExtrudeGeometry(stadiumShape(9.8, 2.02), {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3,
      curveSegments: 20,
    });
    topPlateGeo.rotateX(-Math.PI / 2);
    add(topPlateGeo, dark, -0.2, H / 2 - 0.13, -0.25);
    add(new RoundedBoxGeometry(7.7, 0.12, 0.3, 2, 0.06), gloss, 0.05, H / 2 + 0.005, -0.25);

    // ---- flash: top-right corner, clear pale-champagne translucent stadium bezel + chrome reflector ----
    const flashX = 4.92;
    const flashY = 4.92;
    const flashZ = FRONT - 0.04;
    const flashRecessGeo = new THREE.ExtrudeGeometry(stadiumShape(2.74, 1.06), {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3,
      curveSegments: 20,
    });
    add(flashRecessGeo, darkRecess, flashX, flashY, flashZ + 0.02);
    const flashReflectorGeo = new THREE.ExtrudeGeometry(stadiumShape(2.58, 0.92), {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
      curveSegments: 20,
    });
    add(flashReflectorGeo, flashReflectorMat, flashX, flashY, flashZ + 0.1);
    const tube = add(cyl(0.11, 0.11, 1.65, 16), mirror, flashX, flashY, flashZ + 0.22);
    tube.rotation.set(0, Math.PI / 2, 0);
    const flashBezelGeo = new THREE.ExtrudeGeometry(stadiumShape(3.02, 1.24), {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.14,
      bevelSegments: 5,
      curveSegments: 24,
    });
    add(flashBezelGeo, flashBezelMat, flashX, flashY, flashZ - 0.04);
    overlay(add(new THREE.PlaneGeometry(2.64, 0.96), flashLines, flashX, flashY, flashZ + 0.345));

    // ---- sculpted ergonomic left grip (curved elliptical cylinder + tilted dome shoulder) ----
    const gripX = -5.05; // rx = 1.75 => left edge at -6.80 (-W/2), right valley at -3.30
    const gripZ = 0.41; // rz = 3.11 => front at +3.52 (FRONT+1.32), back at -2.70 (BACK-0.50)
    const gripPts: THREE.Vector2[] = [];
    // Bottom bevel & vertical column up to y = 0.65 (32 segments -> v = 32/48)
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const y = -H / 2 + t * (0.65 - -H / 2);
      const r = i === 0 ? 0.82 : i === 1 ? 0.96 : 1.0;
      gripPts.push(new THREE.Vector2(r, y));
    }
    // Smooth quarter-ellipse upper shoulder dome from y = 0.65 up to y = 2.65 (16 segments)
    for (let i = 1; i <= 16; i++) {
      const a = (i / 16) * (Math.PI / 2);
      gripPts.push(new THREE.Vector2(Math.cos(a), 0.65 + Math.sin(a) * 2.0));
    }
    const gripGeo = new THREE.LatheGeometry(gripPts, 96);
    const gripMesh = add(gripGeo, gripMat, gripX, 0, gripZ);
    gripMesh.scale.set(1.75, 1, 3.11);

    // ---- shutter button (tilted ~34° on the grip's domed upper shoulder) ----
    const btnGroup = new THREE.Group();
    btnGroup.position.set(gripX, 1.45, gripZ + 2.86);
    btnGroup.rotation.x = -0.58;
    model.add(btnGroup);
    add(cyl(0.88, 0.9, 0.18, 48), darkRecess, 0, 0, -0.04, btnGroup);
    const button = add(cyl(0.8, 0.82, 0.24, 48), bodyMat, 0, 0, 0.04, btnGroup);

    // ---- stepped 4-part lens barrel ----
    const lens = new THREE.Group();
    lens.position.set(1.42, -1.15, FRONT - 0.08);
    model.add(lens);

    // 1. Thick outer body-colored barrel with smoothly rounded front shoulder
    const lathePts = [
      new THREE.Vector2(3.98, 0.0),
      new THREE.Vector2(4.52, 0.0),
      new THREE.Vector2(4.52, 1.12),
      new THREE.Vector2(4.48, 1.28),
      new THREE.Vector2(4.36, 1.4),
      new THREE.Vector2(4.16, 1.44),
      new THREE.Vector2(4.02, 1.38),
      new THREE.Vector2(3.98, 1.24),
    ];
    const outerBarrelGeo = new THREE.LatheGeometry(lathePts, 96);
    outerBarrelGeo.rotateX(Math.PI / 2);
    add(outerBarrelGeo, bodyMat, 0, 0, 0, lens);
    add(new THREE.BoxGeometry(0.06, 0.14, 0.04), seamLine, 0, 4.32, 1.42, lens);

    // 2. Middle black cylindrical step
    add(cyl(3.95, 3.97, 0.78), dark, 0, 0, 1.62, lens);

    // 3. Thin body-colored trim collar ring between the two black barrel steps
    add(cyl(4.0, 4.02, 0.24), bodyMat, 0, 0, 2.1, lens);
    overlay(add(new THREE.RingGeometry(3.59, 4.01, 96), seam, 0, 0, 2.225, lens));

    // 4. Front black lens barrel + ribbed faceplate
    add(cyl(3.58, 3.6, 0.74), dark, 0, 0, 2.58, lens);
    add(new THREE.CircleGeometry(3.55, 96), lensFace, 0, 0, 2.955, lens);
    overlay(add(new THREE.RingGeometry(3.5, 3.57, 96), seam, 0, 0, 2.96, lens));

    // Center recessed circular lens well + hollow rounded-square hood + recessed glass optic
    add(cyl(1.4, 1.4, 0.04, 64), darkRecess, 0, 0, 2.94, lens);
    overlay(add(new THREE.RingGeometry(1.36, 1.41, 64), seam, 0, 0, 2.965, lens));
    const lensHoodShape = asymmetricRoundedRect(1.62, 1.46, 0.22, 0.22, 0.22, 0.22);
    lensHoodShape.holes.push(cwRoundedHole(0, 0, 1.24, 1.1, 0.14));
    const lensHoodGeo = new THREE.ExtrudeGeometry(lensHoodShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 16,
    });
    add(lensHoodGeo, gloss, 0, 0.02, 2.92, lens);
    add(new RoundedBoxGeometry(1.26, 1.12, 0.06, 2, 0.12), darkRecess, 0, 0.02, 2.92, lens);
    add(cyl(0.46, 0.48, 0.08, 32), dark, 0, 0.02, 2.96, lens);
    const opticDome = add(
      new THREE.SphereGeometry(0.42, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.4),
      lensGlass,
      0,
      0.02,
      2.62,
      lens
    );
    opticDome.rotation.x = Math.PI / 2;
    const lensWindowMat = new THREE.MeshPhysicalMaterial({
      color: 0x162230,
      roughness: 0.03,
      metalness: 0.25,
      clearcoat: 1,
      transparent: true,
      opacity: 0.36,
      envMapIntensity: 1.8,
    });
    overlay(add(new THREE.PlaneGeometry(1.16, 1.02), lensWindowMat, 0, 0.02, 3.055, lens));
    const glint = overlay(add(new THREE.PlaneGeometry(0.08, 0.48), highlight, -0.22, 0.12, 3.065, lens));
    glint.rotation.z = -0.52;
    overlay(add(new THREE.CircleGeometry(0.055, 16), highlight, 0.14, 0.12, 3.065, lens));

    // Circular window on the lens displaying the project being printed (with glossy glass cover)
    add(cyl(0.6, 0.6, 0.06, 48), darkRecess, 2.04, 0.02, 2.95, lens);
    add(new THREE.CircleGeometry(0.53, 48), previewMat, 2.04, 0.02, 2.985, lens);
    overlay(add(new THREE.CircleGeometry(0.53, 48), previewGlass, 2.04, 0.02, 2.995, lens));

    // Dual light sensor holes inside a vertical pill recess (left side)
    const sensorPillGeo = new THREE.ExtrudeGeometry(stadiumShape(0.66, 1.2), {
      depth: 0.05,
      bevelEnabled: false,
      curveSegments: 16,
    });
    add(sensorPillGeo, darkRecess, -2.1, 0, 2.93, lens);
    for (const sy of [0.24, -0.24]) {
      add(cyl(0.24, 0.24, 0.06, 32), dark, -2.1, sy, 2.95, lens);
      add(cyl(0.16, 0.16, 0.08, 32), gloss, -2.1, sy, 2.96, lens);
    }

    // Curved arc mode/filter switch mount in the lower-right quadrant
    const arcStart = (-62 * Math.PI) / 180;
    const arcEnd = (-28 * Math.PI) / 180;
    const arcR = 2.48;
    const arcGeo = new THREE.ExtrudeGeometry(arcTrackShape(arcR, 0.2, arcStart, arcEnd), {
      depth: 0.026,
      bevelEnabled: false,
      curveSegments: 24,
    });
    add(arcGeo, darkRecess, 0, 0, 2.934, lens);
    add(cyl(0.105, 0.105, 0.032, 28), filterDot, Math.cos(arcEnd) * arcR, Math.sin(arcEnd) * arcR, 2.952, lens);
    const arcBtnX = Math.cos(arcStart) * arcR;
    const arcBtnY = Math.sin(arcStart) * arcR;
    add(cyl(0.175, 0.185, 0.11, 32), dark, arcBtnX, arcBtnY, 2.99, lens);
    add(cyl(0.155, 0.175, 0.03, 32), dark, arcBtnX, arcBtnY, 3.06, lens);

    // ---- subtle side & rear details ----
    const leftEyelet = add(cyl(0.14, 0.14, 0.06, 24), darkRecess, -W / 2 + 0.01, 2.35, -0.15);
    leftEyelet.rotation.y = Math.PI / 2;
    const rightPin = add(cyl(0.09, 0.09, 0.04, 20), darkRecess, W / 2 - 0.01, 1.0, -0.2);
    rightPin.rotation.y = Math.PI / 2;

    add(new RoundedBoxGeometry(8.3, 10.1, 0.14, 3, 0.16), bodyMat, 1.35, -0.15, BACK - 0.04);
    add(new RoundedBoxGeometry(1.15, 0.42, 0.08, 2, 0.14), seamLine, 0.55, 3.85, BACK - 0.11);
    add(cyl(0.32, 0.32, 0.08, 28), dark, 2.95, 3.85, BACK - 0.09);
    add(cyl(0.95, 1.05, 0.16, 40), bodyMat, vfX, vfY, BACK - 0.06);
    add(cyl(0.68, 0.68, 0.14, 36), darkRecess, vfX, vfY, BACK - 0.09);

    const BASE_RY = 0.42;
    const BASE_RX = 0.05;
    const BASE_Y = 0.38;
    model.rotation.set(BASE_RX, BASE_RY, 0);
    model.position.set(0, BASE_Y, 0);
    const slotLocal = new THREE.Vector3(0.05, H / 2 + 0.08, -0.25);

    // ---- interaction state ----
    let pointerX = 0;
    let pointerY = 0;
    let visible = true;
    let raf = 0;
    let hovered = false;
    let shutterAt = -1;
    let previewSeq = 0;
    const targetBody = bodyColor.clone();
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const loadPreview = (url?: string) => {
      const seq = ++previewSeq;
      if (!url) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (seq !== previewSeq) return;
        drawPreviewToCanvas(img, previewCanvas);
        previewTex.needsUpdate = true;
        kick();
      };
      img.src = url;
    };

    const hitTest = (clientX: number, clientY: number) => {
      const r = renderer.domElement.getBoundingClientRect();
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return false;
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, view);
      return raycaster.intersectObject(model, true).length > 0;
    };
    const setHovered = (h: boolean) => {
      if (h === hovered) return;
      hovered = h;
      if (h) host.dataset.cursorLabel = activateLabel;
      else delete host.dataset.cursorLabel;
      host.style.cursor = h ? "pointer" : "";
      softKick();
    };
    // Store raw pointer position; the expensive raycaster hit-test runs once per
    // rendered frame inside the frame() callback instead of on every pointermove
    // event, eliminating the main-thread stall that caused cursor lag.
    let rawClientX = 0;
    let rawClientY = 0;
    let rawPointerType = "";
    const onPointer = (e: PointerEvent) => {
      if (pausedRef.current) return;
      pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      pointerY = (e.clientY / window.innerHeight) * 2 - 1;
      rawClientX = e.clientX;
      rawClientY = e.clientY;
      rawPointerType = e.pointerType;
      softKick();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    const onLeave = () => setHovered(false);
    document.documentElement.addEventListener("pointerleave", onLeave);
    const onClick = (e: MouseEvent) => {
      if (pausedRef.current) return;
      if (activateRef.current && hitTest(e.clientX, e.clientY)) activateRef.current();
    };
    host.addEventListener("click", onClick);

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      view.aspect = w / h;
      view.updateProjectionMatrix();
      kick();
    };

    let last = performance.now();
    const clock = {
      getDelta: () => {
        const n = performance.now();
        const d = (n - last) / 1000;
        last = n;
        return d;
      },
    };
    const start = performance.now();
    let idleFrames = 0;
    // Reusable vector — avoids per-frame allocation & GC pressure
    const _flashWorld = new THREE.Vector3();
    const frame = () => {
      raf = 0;
      if (pausedRef.current) return; // dialog is open — stop rendering
      const now = performance.now();
      const dt = Math.min(0.05, clock.getDelta());
      const k = 1 - Math.pow(0.0015, dt);
      let busy = !reduced;

      const ry = BASE_RY + pointerX * 0.16;
      const rx = BASE_RX + pointerY * 0.06;
      model.rotation.y += (ry - model.rotation.y) * k;
      model.rotation.x += (rx - model.rotation.x) * k;
      if (Math.abs(ry - model.rotation.y) > 1e-4 || Math.abs(rx - model.rotation.x) > 1e-4) busy = true;

      const t = (now - start) / 1000;
      const floatY = reduced ? 0 : Math.sin(t * 1.1) * 0.28 + Math.sin(t * 0.43) * 0.1;
      model.rotation.z = reduced ? 0 : Math.sin(t * 0.7) * 0.015;

      for (const mat of [bodyMat, gripMat]) {
        const c = mat.color;
        if (Math.abs(c.r - targetBody.r) + Math.abs(c.g - targetBody.g) + Math.abs(c.b - targetBody.b) > 0.002) {
          c.lerp(targetBody, Math.min(1, k * 0.9));
          busy = true;
        }
      }

      let recoil = 0;
      if (shutterAt >= 0) {
        const st = (now - shutterAt) / 1000;
        const press = st < 0.08 ? st / 0.08 : st < 0.22 ? 1 - (st - 0.08) / 0.14 : 0;
        button.position.z = 0.04 - 0.11 * Math.max(0, press);
        const f = st < 0.06 ? 0 : Math.max(0, 1 - (st - 0.06) / 0.35);
        flashReflectorMat.emissiveIntensity = 3.2 * f;
        flashLight.intensity = 900 * f;
        recoil = reduced ? 0 : Math.sin(Math.min(1, st / 0.4) * Math.PI) * 0.15;
        if (st > 0.6) {
          shutterAt = -1;
          button.position.z = 0.04;
          flashReflectorMat.emissiveIntensity = 0;
          flashLight.intensity = 0;
        }
        busy = true;
      }
      model.position.y = BASE_Y + floatY - recoil;
      model.updateMatrixWorld();
      flashLight.position.copy(_flashWorld.set(flashX, flashY, flashZ + 2).applyMatrix4(model.matrixWorld));

      // Hit-test once per rendered frame (not per pointermove) to keep cursor feedback
      setHovered(rawPointerType !== "touch" && hitTest(rawClientX, rawClientY));

      renderer.render(scene, view);
      idleFrames = busy ? 0 : idleFrames + 1;
      if (visible && idleFrames < 3) raf = requestAnimationFrame(frame);
    };
    // softKick: lightweight wake-up for pointer tracking.
    const softKick = () => {
      if (!raf && visible && !pausedRef.current) {
        clock.getDelta();
        idleFrames = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    const kick = () => {
      softKick();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !document.hidden;
      if (visible) kick();
    });
    io.observe(host);
    const onVis = () => {
      visible = !document.hidden;
      if (visible) kick();
    };
    document.addEventListener("visibilitychange", onVis);

    api.current = {
      shutter: () => {
        shutterAt = performance.now();
        kick();
      },
      slotPoint: () => {
        model.updateMatrixWorld();
        const p = slotLocal.clone().applyMatrix4(model.matrixWorld).project(view);
        return { x: (p.x * 0.5 + 0.5) * host.clientWidth, y: (-p.y * 0.5 + 0.5) * host.clientHeight };
      },
      setColor: (b) => {
        targetBody.set(b);
        kick();
      },
      setPreview: loadPreview,
      wake: kick,
    };
    loadPreview(previewImage);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVis);
      delete host.dataset.cursorLabel;
      const geos = new Set<THREE.BufferGeometry>();
      const mats = new Set<THREE.Material>();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) geos.add(m.geometry);
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => mats.add(x));
      });
      geos.forEach((g) => g.dispose());
      mats.forEach((mat) => {
        const s = mat as THREE.MeshStandardMaterial;
        s.map?.dispose();
        s.bumpMap?.dispose();
        mat.dispose();
      });
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} role="img" aria-label={label} className={className} />;
});

export default Camera3D;
