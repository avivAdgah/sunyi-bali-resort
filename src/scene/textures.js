import * as THREE from "three";

export const SERIF = '"Cormorant Garamond", Georgia, serif';
export const SANS = '"Manrope", system-ui, sans-serif';
export const BRAND = { jungle: "#1E3A2F", sand: "#EADFC8", clay: "#B8643A", gold: "#D9A441", cream: "#FAF6EE", ink: "#1D2A24" };

const cache = new Map();

// Deterministic randomness so textures look the same on every load.
let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

function canvasTexture(key, w, h, draw, { repeat = false, srgb = true } = {}) {
  if (cache.has(key)) return cache.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  seed = [...key].reduce((a, c) => a + c.charCodeAt(0) * 31, 11);
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  cache.set(key, tex);
  return tex;
}

/** A tiled texture that repeats every `size` meters (for geometry with meter UVs, repeat = 1/size). */
export function tiled(tex, rx, ry = rx) {
  const t = tex.clone();
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}

function speckle(ctx, w, h, n, colors, size = 2) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[Math.floor(rnd() * colors.length)];
    ctx.fillRect(rnd() * w, rnd() * h, size, size);
  }
}

export const grassTexture = () =>
  canvasTexture("grass", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#6B9840";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const g = ctx.createRadialGradient(rnd() * w, rnd() * h, 0, rnd() * w, rnd() * h, 60 + rnd() * 80);
      g.addColorStop(0, rnd() > 0.5 ? "rgba(140,180,80,.25)" : "rgba(60,100,40,.25)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 9000; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      ctx.strokeStyle = ["#7FAE4C", "#5A8836", "#8DBB58", "#4E7A2F"][Math.floor(rnd() * 4)];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rnd() - 0.5) * 4, y - 3 - rnd() * 6);
      ctx.stroke();
    }
  }, { repeat: true });

/** Sandstone paving with irregular slabs. */
export const pavingTexture = () =>
  canvasTexture("paving", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#8F8370";
    ctx.fillRect(0, 0, w, h);
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      let x = -rnd() * 60;
      const y = (r * h) / rows;
      while (x < w) {
        const sw = 60 + rnd() * 90;
        const l = 70 + rnd() * 14;
        ctx.fillStyle = `hsl(${36 + rnd() * 8}, ${18 + rnd() * 10}%, ${l}%)`;
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, sw - 6, h / rows - 6, 6);
        ctx.fill();
        x += sw;
      }
    }
    speckle(ctx, w, h, 5000, ["rgba(90,80,60,.12)", "rgba(255,255,255,.1)"]);
  }, { repeat: true });

/** Alang-alang thatch: dense straw strands running down the roof (texture v). */
export const thatchTexture = () =>
  canvasTexture("thatch", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#8A6A3E";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const c = ["#B8955C", "#9C7A45", "#C9A96D", "#6E5230", "#A88850"][Math.floor(rnd() * 5)];
      ctx.strokeStyle = c;
      ctx.lineWidth = 1 + rnd() * 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rnd() - 0.5) * 6, y + 30 + rnd() * 50);
      ctx.stroke();
    }
    // Layer bands where bundles overlap.
    for (let y = 0; y < h; y += 64) {
      ctx.fillStyle = "rgba(50,35,15,.28)";
      ctx.fillRect(0, y, w, 5);
    }
  }, { repeat: true });

/** Dark teak planks, running along u. */
export const woodTexture = (tone = "teak") =>
  canvasTexture(`wood:${tone}`, 512, 512, (ctx, w, h) => {
    const base = { teak: [28, 45, 30], light: [34, 40, 58], deck: [26, 38, 38] }[tone];
    const plank = 64;
    for (let y = 0; y < h; y += plank) {
      ctx.fillStyle = `hsl(${base[0] + rnd() * 4}, ${base[1]}%, ${base[2] + rnd() * 6}%)`;
      ctx.fillRect(0, y, w, plank);
      for (let i = 0; i < 26; i++) {
        ctx.strokeStyle = `rgba(40,22,10,${0.08 + rnd() * 0.1})`;
        ctx.lineWidth = 1 + rnd() * 2;
        const yy = y + rnd() * plank;
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.bezierCurveTo(w * 0.3, yy + (rnd() - 0.5) * 8, w * 0.6, yy + (rnd() - 0.5) * 8, w, yy);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(30,15,5,.45)";
      ctx.fillRect(0, y, w, 2);
      ctx.fillRect(rnd() * w, y, 2, plank);
    }
  }, { repeat: true });

/** Red Balinese brick with pale paras-stone bands. */
export const brickTexture = () =>
  canvasTexture("brick", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#C9BBA0";
    ctx.fillRect(0, 0, w, h);
    const bh = 32;
    for (let r = 0; r < h / bh; r++) {
      const band = r % 6 === 5;
      const bw = band ? 128 : 76;
      for (let x = (r % 2) * -(bw / 2); x < w; x += bw) {
        ctx.fillStyle = band ? `hsl(40, 12%, ${70 + rnd() * 8}%)` : `hsl(${12 + rnd() * 8}, ${45 + rnd() * 10}%, ${38 + rnd() * 9}%)`;
        ctx.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
      }
    }
    speckle(ctx, w, h, 4000, ["rgba(0,0,0,.08)", "rgba(255,255,255,.08)"]);
  }, { repeat: true });

/** Grey-cream paras stone blocks (walls, plinths, statues). */
export const stoneTexture = () =>
  canvasTexture("stone", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#8D8878";
    ctx.fillRect(0, 0, w, h);
    const bh = 64;
    for (let r = 0; r < h / bh; r++) {
      for (let x = (r % 2) * -64; x < w; x += 128) {
        ctx.fillStyle = `hsl(${44 + rnd() * 10}, ${8 + rnd() * 8}%, ${62 + rnd() * 10}%)`;
        ctx.fillRect(x + 2, r * bh + 2, 124, bh - 4);
      }
    }
    speckle(ctx, w, h, 9000, ["rgba(60,70,50,.12)", "rgba(255,255,255,.08)", "rgba(80,100,60,.1)"]);
  }, { repeat: true });

/** Smooth off-white render for modern villas. */
export const renderTexture = () =>
  canvasTexture("render", 256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#F1ECE3";
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 3000, ["rgba(120,100,80,.05)", "rgba(255,255,255,.2)"]);
  }, { repeat: true });

/** Terrazzo with stone chips. */
export const terrazzoTexture = () =>
  canvasTexture("terrazzo", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#E9E3D8";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = ["#C9BBA4", "#B5A58C", "#D8CFC0", "#9C8E7A", "#E0C9A6"][Math.floor(rnd() * 5)];
      ctx.beginPath();
      ctx.ellipse(rnd() * w, rnd() * h, 1 + rnd() * 5, 1 + rnd() * 4, rnd() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, { repeat: true });

/** Terracotta floor tiles. */
export const terracottaTexture = () =>
  canvasTexture("terracotta", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#8C5A3F";
    ctx.fillRect(0, 0, w, h);
    const s = 128;
    for (let y = 0; y < h; y += s)
      for (let x = 0; x < w; x += s) {
        ctx.fillStyle = `hsl(${18 + rnd() * 6}, ${32 + rnd() * 8}%, ${50 + rnd() * 7}%)`;
        ctx.fillRect(x + 3, y + 3, s - 6, s - 6);
      }
    speckle(ctx, w, h, 4000, ["rgba(0,0,0,.07)", "rgba(255,255,255,.07)"]);
  }, { repeat: true });

/** Green-blue pool mosaic (Bali green sukabumi stone look). */
export const poolTileTexture = () =>
  canvasTexture("pooltile", 256, 256, (ctx, w, h) => {
    const s = 32;
    for (let y = 0; y < h; y += s)
      for (let x = 0; x < w; x += s) {
        ctx.fillStyle = `hsl(${168 + rnd() * 14}, ${30 + rnd() * 14}%, ${52 + rnd() * 12}%)`;
        ctx.fillRect(x, y, s, s);
      }
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= w; i += s) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
  }, { repeat: true });

/** Caustic ripples drawn as soft bright lines; scrolled every frame on the water. */
export const causticTexture = () =>
  canvasTexture("caustic", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#9FDCE0";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    for (let i = 0; i < 90; i++) {
      ctx.lineWidth = 1.5 + rnd() * 3;
      const x = rnd() * w;
      const y = rnd() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) ctx.quadraticCurveTo(x + (rnd() - 0.5) * 160, y + (rnd() - 0.5) * 160, x + (rnd() - 0.5) * 140, y + (rnd() - 0.5) * 140);
      ctx.stroke();
    }
  }, { repeat: true });

/** Black-and-white poleng checks worn by guardian statues. */
export const polengTexture = () =>
  canvasTexture("poleng", 128, 128, (ctx, w, h) => {
    const s = 32;
    for (let y = 0; y < h; y += s)
      for (let x = 0; x < w; x += s) {
        ctx.fillStyle = (x + y) / s % 2 === 0 ? "#F4F1EA" : "#24221F";
        ctx.fillRect(x, y, s, s);
      }
  }, { repeat: true });

/** Soft round glow for lamp halos, fireflies and the moon. */
export const glowTexture = () =>
  canvasTexture("glow", 128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

/** Torch flame. */
export const flameTexture = () =>
  canvasTexture("flame", 64, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h * 0.68, 2, w / 2, h * 0.6, h * 0.5);
    g.addColorStop(0, "rgba(255,250,220,1)");
    g.addColorStop(0.25, "rgba(255,200,90,.95)");
    g.addColorStop(0.6, "rgba(255,110,30,.5)");
    g.addColorStop(1, "rgba(255,80,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.bezierCurveTo(w * 0.95, h * 0.45, w, h * 0.9, w / 2, h);
    ctx.bezierCurveTo(0, h * 0.9, w * 0.05, h * 0.45, w / 2, 0);
    ctx.fill();
  });

/** Fluffy cloud puff. */
export const cloudTexture = () =>
  canvasTexture("cloud", 256, 128, (ctx, w, h) => {
    for (let i = 0; i < 22; i++) {
      const x = w * (0.15 + rnd() * 0.7);
      const y = h * (0.45 + rnd() * 0.25);
      const r = 20 + rnd() * 34;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,.55)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  });

/** Carved-wood villa sign: style chip, name, price per night, call to action. */
export function villaSignTexture(villa, highlighted = false) {
  return canvasTexture(`sign:${villa.id}:${highlighted}`, 640, 400, (ctx, w, h) => {
    ctx.fillStyle = highlighted ? "#2C4A3C" : "#5B3B22";
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 28);
    ctx.fill();
    // wood grain
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${0.06 + rnd() * 0.08})`;
      ctx.lineWidth = 1 + rnd() * 2;
      const y = rnd() * h;
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w - 10, y);
      ctx.stroke();
    }
    ctx.strokeStyle = BRAND.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(14, 14, w - 28, h - 28, 20);
    ctx.stroke();

    ctx.fillStyle = villa.style === "modern" ? "#E8EEF0" : BRAND.sand;
    ctx.beginPath();
    ctx.roundRect(40, 40, villa.style === "modern" ? 150 : 140, 44, 22);
    ctx.fill();
    ctx.fillStyle = BRAND.ink;
    ctx.font = `800 24px ${SANS}`;
    ctx.fillText(villa.style === "modern" ? "MODERN" : "RUSTIC", 60, 70);

    ctx.fillStyle = "#FFF8EA";
    let size = 70;
    do {
      ctx.font = `700 ${size}px ${SERIF}`;
      size -= 2;
    } while (ctx.measureText(villa.name).width > w - 80);
    ctx.fillText(villa.name, 40, 160);

    ctx.fillStyle = BRAND.gold;
    ctx.font = `800 66px ${SANS}`;
    const price = `$${villa.price}`;
    ctx.fillText(price, 40, 262);
    const pw = ctx.measureText(price).width;
    ctx.fillStyle = "rgba(255,248,234,.75)";
    ctx.font = `600 28px ${SANS}`;
    ctx.fillText("/ night", 52 + pw, 262);
    ctx.fillText(`${villa.size} m² · ${villa.guests} guests`, 40, 306);

    ctx.fillStyle = highlighted ? BRAND.gold : "rgba(255,248,234,.14)";
    ctx.beginPath();
    ctx.roundRect(40, 326, w - 80, 50, 25);
    ctx.fill();
    ctx.fillStyle = highlighted ? BRAND.ink : "#FFF8EA";
    ctx.font = `800 26px ${SANS}`;
    ctx.textAlign = "center";
    ctx.fillText("Tour inside  →", w / 2, 360);
  });
}

/** Stone welcome sign and small wayfinding boards. */
export function boardTexture(title, sub, key = title) {
  return canvasTexture(`board:${key}`, 1024, 360, (ctx, w, h) => {
    ctx.fillStyle = "#3A2A1C";
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 30);
    ctx.fill();
    ctx.strokeStyle = BRAND.gold;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(18, 18, w - 36, h - 36, 20);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFF6E4";
    let size = 130;
    do {
      ctx.font = `700 ${size}px ${SERIF}`;
      size -= 4;
    } while (ctx.measureText(title).width > w - 100);
    ctx.fillText(title, w / 2, 190);
    ctx.fillStyle = BRAND.gold;
    ctx.font = `700 40px ${SANS}`;
    ctx.fillText(sub, w / 2, 280);
  });
}
