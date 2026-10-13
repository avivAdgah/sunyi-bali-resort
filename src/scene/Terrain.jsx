import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { curve, PATH_LENGTH } from "../data/path";
import { POOLS, EDGE_Z, valley, VALLEY } from "../data/world";
import { onTime, ramp, glowAtNight } from "./time";
import { grassTexture, pavingTexture, poolTileTexture, causticTexture, stoneTexture, tiled } from "./textures";

const C = (hex) => new THREE.Color(hex);

export default function Terrain() {
  return (
    <group>
      <Lawn />
      <Terraces />
      <FarValley />
      <Horizon />
      <PathRibbon />
      <Roads />
      {POOLS.map((p) => (
        <Pool key={p.id} pool={p} />
      ))}
    </group>
  );
}

/** Flat plateau lawn with holes for every pool and pond. */
function Lawn() {
  const geometry = useMemo(() => {
    // Shape (x, y) maps to world (x, −y) after rotating −90° about x.
    const shape = new THREE.Shape();
    shape.moveTo(-420, -EDGE_Z);
    shape.lineTo(420, -EDGE_Z);
    shape.lineTo(420, -420);
    shape.lineTo(-420, -420);
    shape.closePath();
    for (const p of POOLS) {
      const hole = new THREE.Path();
      const z0 = Math.max(p.z0, EDGE_Z + 0.001);
      hole.moveTo(p.x0, -p.z1);
      hole.lineTo(p.x1, -p.z1);
      hole.lineTo(p.x1, -z0);
      hole.lineTo(p.x0, -z0);
      hole.closePath();
      shape.holes.push(hole);
    }
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const map = useMemo(() => tiled(grassTexture(), 0.22), []);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial map={map} roughness={0.95} />
    </mesh>
  );
}

const PADDY = ["#8CC04A", "#76AE3E", "#A9BF4C", "#7FA89E", "#97C653", "#82A845", "#BFC85A"].map(C);
const RISER = C("#5B7A30");
const JUNGLE = ["#2F5A24", "#3A6A2B", "#2A5020", "#45742F"].map(C);
const CLIFF = C("#5E6038");
const RIVERBANK = C("#6F7A45");

const hash = (a, b) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Grid over [x0, x1] × rows of z, heights and colours from the valley profile. */
function valleyGrid(xs, zs, colorAt) {
  const pos = new Float32Array(xs.length * zs.length * 3);
  const col = new Float32Array(xs.length * zs.length * 3);
  const c = new THREE.Color();
  let i = 0;
  for (const z of zs)
    for (const x of xs) {
      const v = valley(x, z);
      pos[i * 3] = x;
      pos[i * 3 + 1] = v.h;
      pos[i * 3 + 2] = z;
      colorAt(c, v, x, z).toArray(col, i * 3);
      i++;
    }
  const idx = [];
  const w = xs.length;
  for (let r = 0; r < zs.length - 1; r++)
    for (let q = 0; q < w - 1; q++) {
      const a = r * w + q;
      idx.push(a, a + 1, a + w, a + 1, a + w + 1, a + w);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const range = (from, to, step) => {
  const out = [];
  for (let v = from; v <= to + 1e-6; v += step) out.push(v);
  return out;
};

/** Cliff, jungle slope, river and the stepped rice terraces climbing the far side of the valley. */
function Terraces() {
  const geometry = useMemo(() => {
    const xs = range(-170, 270, 1.5);
    // Rows are denser near the resort, where risers are close enough to see.
    const zs = [...range(0, 130, 0.5), ...range(130.8, 290, 0.8)].map((d) => EDGE_Z - d);
    return valleyGrid(xs, zs, (c, v, x, z) => {
      if (v.zone === "cliff") return c.copy(CLIFF);
      if (v.zone === "slope" || v.zone === "hills") return c.copy(JUNGLE[Math.floor(hash(Math.floor(x / 6), Math.floor(z / 6)) * JUNGLE.length)]);
      if (v.zone === "river" || v.zone === "floor") return c.copy(RIVERBANK).offsetHSL(0, 0, (hash(x, z) - 0.5) * 0.05);
      if (v.f > 0.84 || v.f < 0.03) return c.copy(RISER);
      const field = Math.floor((x + 400) / 24 + Math.sin(v.k * 1.7) * 2);
      return c.copy(PADDY[Math.floor(hash(v.k, field) * PADDY.length)]).offsetHSL(0, 0, (hash(x * 0.3, z * 0.3) - 0.5) * 0.04);
    });
  }, []);
  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.85} />
      </mesh>
      <River />
    </group>
  );
}

/** A winding river along the valley floor. */
function River() {
  const geometry = useMemo(() => {
    const pos = [];
    const idx = [];
    const n = 220;
    for (let i = 0; i <= n; i++) {
      const x = -400 + (i / n) * 900;
      const d = VALLEY.river - Math.sin(x * 0.03) * 3;
      pos.push(x, VALLEY.floor - 0.5, EDGE_Z - d + 2.2, x, VALLEY.floor - 0.5, EDGE_Z - d - 2.2);
      if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#5E9A96" roughness={0.1} metalness={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Coarse valley and hills under and beyond the terraces, filling the whole horizon. */
function FarValley() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1500, 760, 150, 76);
    g.rotateX(-Math.PI / 2);
    g.translate(50, 0, EDGE_Z - 380);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = Math.min(pos.getZ(i), EDGE_Z);
      const v = valley(x, z, false);
      pos.setY(i, v.h - 1.4);
      c.set(v.zone === "terrace" ? "#86AE48" : "#3E6A2D").offsetHSL((hash(x, z) - 0.5) * 0.03, 0, (hash(z, x) - 0.5) * 0.08 - Math.min(v.d / 3000, 0.08));
      c.toArray(colors, i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  );
}

/** Distant ridges and a volcano, painted in atmospheric haze (no fog, colours follow the time of day). */
function Horizon() {
  const layers = useMemo(() => {
    const ridge = (z, base, amp, seed) => {
      const pts = [];
      const n = 160;
      for (let i = 0; i <= n; i++) {
        const x = -1700 + (i / n) * 3400;
        const y = base + (Math.sin(x * 0.004 + seed) * 0.5 + Math.sin(x * 0.011 + seed * 2) * 0.3 + Math.sin(x * 0.027 + seed * 3) * 0.2) * amp;
        pts.push(x, y, z, x, -120, z);
      }
      const idx = [];
      for (let i = 0; i < n; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      g.setIndex(idx);
      return g;
    };
    const volcano = () => {
      const pts = [];
      const H = 520;
      const R = 900;
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        pts.push(new THREE.Vector2(R * (0.035 + 0.965 * Math.pow(t, 1.9)), H * (1 - t) - 120));
      }
      const g = new THREE.LatheGeometry(pts, 64);
      g.translate(-380, 0, -1250);
      return g;
    };
    return [
      { geo: volcano(), colors: ["#7F98AA", "#8C6E86", "#0F1730"] },
      { geo: ridge(-1050, 90, 120, 4.1), colors: ["#8DA6AE", "#B88A8A", "#111B35"] },
      { geo: ridge(-860, 40, 90, 1.7), colors: ["#7D9A92", "#A07C78", "#0E1830"] },
      { geo: ridge(-720, 10, 70, 2.9), colors: ["#6F8E7C", "#87706A", "#0C152A"] },
    ].map((l) => ({ ...l, mat: new THREE.MeshBasicMaterial({ fog: false, side: THREE.DoubleSide }), stops: l.colors.map(C) }));
  }, []);

  useMemo(() => {
    for (const l of layers) onTime((m) => ramp(l.mat.color, ...l.stops, m));
  }, [layers]);

  return (
    <group>
      {layers.map((l, i) => (
        <mesh key={i} geometry={l.geo} material={l.mat} />
      ))}
    </group>
  );
}

/** Stone-paved walking path following the route. */
function PathRibbon() {
  const geometry = useMemo(() => {
    const n = 600;
    const width = 2.5;
    const pos = [];
    const uv = [];
    const idx = [];
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      curve.getPointAt(u, p);
      curve.getTangentAt(u, t);
      const nx = -t.z;
      const nz = t.x;
      const len = Math.hypot(nx, nz) || 1;
      pos.push(p.x + (nx / len) * width / 2, 0.025, p.z + (nz / len) * width / 2);
      pos.push(p.x - (nx / len) * width / 2, 0.025, p.z - (nz / len) * width / 2);
      const v = (u * PATH_LENGTH) / width;
      uv.push(0, v, 1, v);
      if (i < n) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    if (g.attributes.normal.getY(0) < 0) {
      g.setIndex(idx.map((_, i) => idx[i - (i % 3) + [0, 2, 1][i % 3]]));
      g.computeVertexNormals();
    }
    return g;
  }, []);
  const map = useMemo(() => pavingTexture(), []);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial map={map} roughness={0.9} />
    </mesh>
  );
}

/** Arrival drive and the buggy service road. */
function Roads() {
  const drive = useMemo(() => tiled(pavingTexture(), 7 / 3.5, 90 / 3.5), []);
  const service = useMemo(() => tiled(pavingTexture(), 84 / 3.5, 5 / 3.5), []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 61]} receiveShadow>
        <planeGeometry args={[7, 90]} />
        <meshStandardMaterial map={drive} color="#CFC3AE" roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[46, 0.012, 17.5]} receiveShadow>
        <planeGeometry args={[84, 5]} />
        <meshStandardMaterial map={service} color="#CFC3AE" roughness={0.95} />
      </mesh>
    </group>
  );
}

// ---------- Pools ----------

/** Plane whose texture repeats every `tile` meters. */
export function meterPlane(w, h, tile = 1) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * h) / tile);
  return g;
}

const waterMats = {};
function waterMaterial(pond) {
  const key = pond ? "pond" : "pool";
  if (waterMats[key]) return waterMats[key];
  const map = causticTexture().clone();
  map.needsUpdate = true;
  const m = new THREE.MeshStandardMaterial({
    color: pond ? "#3E6E5C" : "#3FB7C2",
    map: pond ? null : map,
    transparent: true,
    opacity: pond ? 0.92 : 0.8,
    roughness: 0.05,
    metalness: 0.15,
    emissive: pond ? "#0E2A22" : "#27C3D6",
    emissiveMap: pond ? null : map,
    depthWrite: false,
  });
  glowAtNight(m, 0, pond ? 0.15 : 0.85);
  waterMats[key] = m;
  return m;
}

const tileMat = new THREE.MeshStandardMaterial({ map: poolTileTexture(), roughness: 0.4 });
glowAtNight(Object.assign(tileMat, { emissive: new THREE.Color("#0F6E78") }), 0, 0.35);
const pondMat = new THREE.MeshStandardMaterial({ color: "#2E3A2A", roughness: 1 });
const copingMat = new THREE.MeshStandardMaterial({ map: tiled(stoneTexture(), 0.5), roughness: 0.85 });

/** Open tiled basin, water surface and stone coping. Infinity pools have no coping on the valley side. */
function Pool({ pool }) {
  const { x0, x1, z0, z1, depth, pond, infinity } = pool;
  const w = x1 - x0;
  const d = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const basinMat = pond ? pondMat : tileMat;
  const water = waterMaterial(pond);
  const map = water.map;
  const geos = useMemo(
    () => ({
      floor: meterPlane(w, d, 1.2),
      long: meterPlane(w, depth, 1.2),
      short: meterPlane(d, depth, 1.2),
      water: meterPlane(w, d, 5),
    }),
    [w, d, depth],
  );

  useFrame((_, dt) => {
    if (map && pool.id === "main") {
      map.offset.x += dt * 0.012;
      map.offset.y += dt * 0.008;
    }
  });

  const cope = 0.4;
  return (
    <group>
      {/* floor and walls */}
      <mesh position={[cx, -depth, cz]} rotation-x={-Math.PI / 2} material={basinMat} geometry={geos.floor} receiveShadow />
      {[
        [cx, cz - d / 2, 0, geos.long],
        [cx, cz + d / 2, Math.PI, geos.long],
        [x0, cz, Math.PI / 2, geos.short],
        [x1, cz, -Math.PI / 2, geos.short],
      ].map(([x, z, ry, geo], i) => (
        <mesh key={i} position={[x, -depth / 2, z]} rotation-y={ry} material={basinMat} geometry={geo} />
      ))}
      <mesh position={[cx, -0.14, cz]} rotation-x={-Math.PI / 2} material={water} geometry={geos.water} renderOrder={2} />
      {/* coping */}
      {[
        !infinity && [cx, z0 - cope / 2, w + cope * 2, cope],
        [cx, z1 + cope / 2, w + cope * 2, cope],
        [x0 - cope / 2, cz, cope, d],
        [x1 + cope / 2, cz, cope, d],
      ]
        .filter(Boolean)
        .map(([x, z, sx, sz], i) => (
          <mesh key={`c${i}`} position={[x, 0.03, z]} material={copingMat} receiveShadow castShadow>
            <boxGeometry args={[sx, 0.08, sz]} />
          </mesh>
        ))}
      {infinity && (
        // Overflow lip: a thin sheet of water spilling over the valley-side edge.
        <mesh position={[cx, -0.2, z0 - 0.2]} rotation-x={-Math.PI / 2.3} material={water}>
          <planeGeometry args={[w, 0.5]} />
        </mesh>
      )}
      {pond && <LilyPads pool={pool} />}
    </group>
  );
}

function LilyPads({ pool }) {
  const pads = useMemo(() => {
    const out = [];
    const n = Math.round((pool.x1 - pool.x0) * (pool.z1 - pool.z0) * 0.7);
    for (let i = 0; i < n; i++) {
      out.push({
        x: pool.x0 + 0.3 + hash(i, pool.x0) * (pool.x1 - pool.x0 - 0.6),
        z: pool.z0 + 0.3 + hash(pool.z0, i) * (pool.z1 - pool.z0 - 0.6),
        r: 0.16 + hash(i, i) * 0.2,
        flower: hash(i * 3, 7) > 0.7,
      });
    }
    return out;
  }, [pool]);
  return (
    <group>
      {pads.map((p, i) => (
        <group key={i} position={[p.x, -0.12, p.z]}>
          <mesh rotation-y={p.r * 20}>
            <cylinderGeometry args={[p.r, p.r, 0.02, 12, 1, false, 0, Math.PI * 1.85]} />
            <meshStandardMaterial color="#4E8B3A" roughness={0.6} />
          </mesh>
          {p.flower && (
            <mesh position={[0.05, 0.08, 0]}>
              <coneGeometry args={[0.09, 0.14, 7, 1, true]} />
              <meshStandardMaterial color="#F4A7C0" side={THREE.DoubleSide} emissive="#F4A7C0" emissiveIntensity={0.08} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
