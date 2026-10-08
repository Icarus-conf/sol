import * as THREE from "three";

function hash(ix: number, iy: number, seed: number): number {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, seed);
  const b = hash(x0 + 1, y0, seed);
  const c = hash(x0, y0 + 1, seed);
  const d = hash(x0 + 1, y0 + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(x: number, y: number, seed: number, octaves = 5): number {
  let v = 0;
  let a = 0.5;
  let f = 1;
  let s = 0;
  for (let i = 0; i < octaves; i++) {
    v += a * valueNoise(x * f, y * f, seed + i * 19);
    s += a;
    a *= 0.5;
    f *= 2;
  }
  return v / s;
}

/** Seamless in U by sampling on a cylinder. */
function noiseU(u: number, v: number, scale: number, seed: number): number {
  const x = Math.cos(u * Math.PI * 2) * scale;
  const y = Math.sin(u * Math.PI * 2) * scale;
  return fbm(x, y + v * scale * 2, seed);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

type Painter = (u: number, v: number) => [number, number, number, number];

function canvasTexture(
  width: number,
  height: number,
  paint: Painter,
  wrap = true,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  const img = ctx.createImageData(width, height);
  const data = img.data;
  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const [r, g, b, a] = paint(u, v);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function cratered(
  u: number,
  v: number,
  base: [number, number, number],
  seed: number,
): [number, number, number] {
  const n = noiseU(u, v, 4, seed);
  const n2 = noiseU(u, v, 12, seed + 7);
  let c = mixRgb(base, [base[0] * 0.55, base[1] * 0.55, base[2] * 0.55], n2 * 0.55);
  c = mixRgb(c, [c[0] + 28, c[1] + 24, c[2] + 20], n * 0.35);
  // Sparse crater punches
  const crater = noiseU(u, v, 18, seed + 21);
  if (crater > 0.72) {
    const k = (crater - 0.72) / 0.28;
    c = mixRgb(c, [c[0] * 0.45, c[1] * 0.45, c[2] * 0.45], k);
  }
  return c;
}

function bands(
  u: number,
  v: number,
  palette: [number, number, number][],
  seed: number,
  warp = 0.08,
): [number, number, number] {
  const w = noiseU(u, v, 3, seed) - 0.5;
  const t = clamp01(v + (w - 0.15) * warp);
  const shifted = t * (palette.length - 1);
  const i = Math.floor(shifted);
  const f = shifted - i;
  const a = palette[i] ?? palette[0];
  const b = palette[i + 1] ?? a;
  const fine = noiseU(u, v, 14, seed + 3);
  return mixRgb(a, b, f * 0.85 + fine * 0.15);
}

function paintBody(id: string): Painter {
  switch (id) {
    case "mercury":
      return (u, v) => {
        const c = cratered(u, v, [154, 144, 134], 11);
        return [c[0], c[1], c[2], 255];
      };
    case "venus":
      return (u, v) => {
        const n = noiseU(u, v, 3.2, 22);
        const n2 = noiseU(u, v, 8, 29);
        let c = mixRgb([210, 176, 120], [232, 214, 176], n);
        c = mixRgb(c, [186, 150, 96], n2 * 0.4);
        return [c[0], c[1], c[2], 255];
      };
    case "earth":
      return (u, v) => {
        const lat = (v - 0.5) * 2;
        const land = noiseU(u, v, 3.4, 41);
        const land2 = noiseU(u, v + 0.08, 6, 44);
        const ice = Math.max(0, Math.abs(lat) - 0.72) / 0.28 + noiseU(u, v, 8, 48) * 0.08;
        let c: [number, number, number] = mixRgb([12, 52, 118], [18, 92, 156], noiseU(u, v, 5, 40));
        if (land > 0.52) {
          const veg = mixRgb([46, 102, 52], [122, 112, 58], land2);
          c = mixRgb(c, veg, clamp01((land - 0.52) * 6));
        }
        if (ice > 0.35) c = mixRgb(c, [236, 242, 248], clamp01((ice - 0.35) * 2.4));
        return [c[0], c[1], c[2], 255];
      };
    case "moon":
      return (u, v) => {
        const c = cratered(u, v, [176, 172, 166], 61);
        const mare = noiseU(u, v, 2.4, 66);
        const m = mare > 0.58 ? mixRgb(c, [110, 108, 104], (mare - 0.58) * 2) : c;
        return [m[0], m[1], m[2], 255];
      };
    case "mars":
      return (u, v) => {
        const lat = (v - 0.5) * 2;
        const n = noiseU(u, v, 3.6, 71);
        const n2 = noiseU(u, v, 9, 77);
        let c = mixRgb([168, 78, 46], [196, 118, 72], n);
        c = mixRgb(c, [120, 64, 42], n2 * 0.35);
        const ice = Math.max(0, Math.abs(lat) - 0.78);
        if (ice > 0) c = mixRgb(c, [232, 228, 220], ice * 6);
        return [c[0], c[1], c[2], 255];
      };
    case "jupiter":
      return (u, v) => {
        const palette: [number, number, number][] = [
          [214, 186, 148],
          [196, 140, 88],
          [236, 220, 188],
          [176, 112, 68],
          [228, 200, 156],
          [160, 96, 60],
          [220, 184, 136],
          [200, 156, 104],
        ];
        let c = bands(u, v, palette, 81, 0.12);
        // Great Red Spot
        const du = Math.min(Math.abs(u - 0.32), Math.abs(u - 0.32 - 1));
        const dv = (v - 0.62) / 0.07;
        const spot = 1 - (du * du * 90 + dv * dv);
        if (spot > 0) c = mixRgb(c, [176, 64, 48], clamp01(spot) * 0.85);
        return [c[0], c[1], c[2], 255];
      };
    case "saturn":
      return (u, v) => {
        const palette: [number, number, number][] = [
          [214, 196, 150],
          [232, 216, 176],
          [198, 176, 128],
          [236, 224, 188],
          [206, 184, 136],
          [224, 206, 164],
        ];
        const c = bands(u, v, palette, 91, 0.06);
        return [c[0], c[1], c[2], 255];
      };
    case "uranus":
      return (u, v) => {
        const n = noiseU(u, v, 2.2, 101);
        const c = mixRgb([132, 200, 198], [176, 224, 220], n);
        return [c[0], c[1], c[2], 255];
      };
    case "neptune":
      return (u, v) => {
        const n = noiseU(u, v, 2.8, 111);
        const n2 = noiseU(u, v, 7, 117);
        let c = mixRgb([36, 72, 176], [72, 122, 214], n);
        c = mixRgb(c, [28, 56, 140], n2 * 0.35);
        const du = Math.min(Math.abs(u - 0.6), Math.abs(u - 0.6 - 1));
        const dv = (v - 0.45) / 0.08;
        const spot = 1 - (du * du * 70 + dv * dv);
        if (spot > 0) c = mixRgb(c, [24, 40, 96], clamp01(spot) * 0.7);
        return [c[0], c[1], c[2], 255];
      };
    case "pluto":
      return (u, v) => {
        const n = noiseU(u, v, 3, 121);
        let c = mixRgb([176, 150, 128], [210, 186, 164], n);
        const heart = 1 - ((u - 0.45) ** 2 * 18 + (v - 0.42) ** 2 * 22);
        if (heart > 0) c = mixRgb(c, [232, 214, 206], clamp01(heart));
        const ice = noiseU(u, v, 8, 126);
        if (ice > 0.7) c = mixRgb(c, [220, 216, 210], (ice - 0.7) * 2);
        return [c[0], c[1], c[2], 255];
      };
    default:
      return () => [180, 180, 180, 255];
  }
}

export function createPlanetTexture(id: string): THREE.CanvasTexture {
  return canvasTexture(512, 256, paintBody(id));
}

export function createCloudTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 256, (u, v) => {
    const n = noiseU(u, v, 4.2, 201);
    const n2 = noiseU(u, v, 10, 207);
    const a = clamp01((n * 0.7 + n2 * 0.3 - 0.48) * 3.2) * 210;
    return [245, 248, 252, a];
  });
}

export function createRingTexture(kind: "saturn" | "uranus"): THREE.CanvasTexture {
  return canvasTexture(
    8,
    1024,
    (_u, v) => {
      if (kind === "saturn") {
        const cassini = Math.abs(v - 0.62) < 0.035;
        const gaps = Math.abs(v - 0.28) < 0.012 || Math.abs(v - 0.84) < 0.01;
        const band = 0.55 + Math.sin(v * 70) * 0.18 + Math.sin(v * 17) * 0.08;
        const alpha = cassini || gaps ? 12 : clamp01(band) * 210;
        const c = mixRgb([214, 196, 150], [236, 224, 196], v);
        return [c[0], c[1], c[2], alpha];
      }
      const alpha = 40 + Math.sin(v * 40) * 18;
      return [180, 200, 210, alpha];
    },
    false,
  );
}

