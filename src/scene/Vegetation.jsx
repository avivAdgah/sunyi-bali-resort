import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { distanceToPath } from "../data/path";
import { isClear, valley, EDGE_Z } from "../data/world";
import { VILLAS, PLOT_Z } from "../data/villas";

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Seeded random so the garden grows the same way on every visit.
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Non-indexed copy with a flat vertex colour and no UVs, ready to merge. */
function paint(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.deleteAttribute("uv");
  const c = new THREE.Color(color);
  const arr = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < arr.length; i += 3) c.toArray(arr, i);
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return g;
}

/** A cylinder from a to b. */
function limb(a, b, r0, r1, sides = 7) {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r1, r0, len, sides, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()));
  const m = a.clone().add(b).multiplyScalar(0.5);
  g.translate(m.x, m.y, m.z);
  return g;
}

/** Arched leaf along +x: a V-folded ribbon, optionally serrated like a palm frond. */
function leaf(length, droop, lift, width, serrated = true) {
  const n = 12;
  const pos = [];
  const spine = [];
  const left = [];
  const right = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s = V(t * length * (1 - droop * 0.25 * t), (lift * t - droop * t * t) * length, 0);
    let w = Math.pow(Math.sin(Math.PI * Math.min(t * 1.08, 1)), 0.6) * width;
    if (serrated && i % 2) w *= 0.45;
    spine.push(s);
    left.push(s.clone().add(V(0, -w * 0.35, -w)));
    right.push(s.clone().add(V(0, -w * 0.35, w)));
  }
  const tri = (a, b, c) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  for (let i = 0; i < n; i++) {
    tri(spine[i], left[i], spine[i + 1]);
    tri(left[i], left[i + 1], spine[i + 1]);
    tri(spine[i], spine[i + 1], right[i]);
    tri(right[i], spine[i + 1], right[i + 1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.computeVertexNormals();
  return g;
}

function merged(parts) {
  const g = mergeGeometries(parts);
  g.computeBoundingSphere();
  return g;
}

function palmGeometry(seed) {
  const r = rng(seed);
  const parts = [];
  const H = 8;
  const lean = 0.8 + r() * 0.8;
  const trunk = new THREE.QuadraticBezierCurve3(V(0, 0, 0), V(lean * 0.15, H * 0.55, 0), V(lean, H, 0));
  const segs = 10;
  for (let i = 0; i < segs; i++) {
    const a = trunk.getPoint(i / segs);
    const b = trunk.getPoint((i + 1) / segs);
    parts.push(paint(limb(a, b, 0.21 - i * 0.008, 0.2 - i * 0.008), i % 2 ? "#8C765A" : "#76624A"));
  }
  const top = trunk.getPoint(1);
  parts.push(paint(new THREE.IcosahedronGeometry(0.28, 0).translate(top.x, top.y, top.z), "#6D6A2E"));
  const n = 12;
  for (let f = 0; f < n; f++) {
    const ang = (f / n) * Math.PI * 2 + r() * 0.3;
    const g = leaf(3 + r() * 0.9, 0.55 + r() * 0.45 + (f % 3 === 0 ? -0.35 : 0), 0.5, 0.55);
    g.rotateY(ang).translate(top.x, top.y, top.z);
    parts.push(paint(g, ["#3E7A2A", "#4C8A33", "#5E9638", "#6E9B3A"][f % 4]));
  }
  for (let c = 0; c < 4; c++) {
    const a = (c / 4) * Math.PI * 2;
    parts.push(paint(new THREE.IcosahedronGeometry(0.15, 0).translate(top.x + Math.cos(a) * 0.25, top.y - 0.28, top.z + Math.sin(a) * 0.25), "#7A6A28"));
  }
  return merged(parts);
}

function frangipaniGeometry() {
  const r = rng(42);
  const parts = [paint(limb(V(0, 0, 0), V(0, 1.1, 0), 0.13, 0.11), "#8E8170")];
  for (let b = 0; b < 5; b++) {
    const a = (b / 5) * Math.PI * 2 + r() * 0.4;
    const end = V(Math.cos(a) * 1.1, 2.1 + r() * 0.5, Math.sin(a) * 1.1);
    parts.push(paint(limb(V(0, 1.05, 0), end, 0.09, 0.06), "#8E8170"));
    parts.push(paint(new THREE.IcosahedronGeometry(0.62, 1).scale(1, 0.55, 1).translate(end.x, end.y + 0.12, end.z), "#4F7F34"));
    for (let k = 0; k < 7; k++) {
      const fa = r() * Math.PI * 2;
      const fr = 0.3 + r() * 0.28;
      parts.push(paint(new THREE.OctahedronGeometry(0.075, 0).scale(1.2, 0.5, 1.2).translate(end.x + Math.cos(fa) * fr, end.y + 0.36 + r() * 0.08, end.z + Math.sin(fa) * fr), k % 3 ? "#FFF8EC" : "#FFD98A"));
    }
  }
  return merged(parts);
}

function bushGeometry() {
  return merged([
    paint(new THREE.IcosahedronGeometry(0.75, 1).scale(1, 0.72, 1).translate(0, 0.42, 0), "#FFFFFF"),
    paint(new THREE.IcosahedronGeometry(0.5, 1).scale(1, 0.8, 1).translate(0.55, 0.32, 0.2), "#EEEEEE"),
    paint(new THREE.IcosahedronGeometry(0.45, 1).scale(1, 0.8, 1).translate(-0.45, 0.3, -0.25), "#E2E2E2"),
  ]);
}

function bananaGeometry() {
  const r = rng(9);
  const parts = [paint(limb(V(0, 0, 0), V(0, 1.7, 0), 0.12, 0.09), "#7C8B45")];
  for (let i = 0; i < 7; i++) {
    const g = leaf(1.7 + r() * 0.5, 0.75, 1.1, 0.32, false);
    g.rotateY((i / 7) * Math.PI * 2 + r() * 0.3).translate(0, 1.55 + r() * 0.25, 0);
    parts.push(paint(g, i % 2 ? "#7FB547" : "#6CA33C"));
  }
  return merged(parts);
}

function rainTreeGeometry() {
  return merged([
    paint(limb(V(0, 0, 0), V(0, 2.4, 0), 0.32, 0.24), "#5E5040"),
    paint(new THREE.IcosahedronGeometry(2.2, 1).scale(1.25, 0.7, 1.25).translate(0, 3.6, 0), "#FFFFFF"),
    paint(new THREE.IcosahedronGeometry(1.5, 1).scale(1.2, 0.7, 1.2).translate(1.4, 3.1, 0.6), "#F0F0F0"),
    paint(new THREE.IcosahedronGeometry(1.4, 1).scale(1.2, 0.7, 1.2).translate(-1.3, 3.2, -0.5), "#E8E8E8"),
  ]);
}

const canopyGeometry = () => paint(new THREE.IcosahedronGeometry(1, 1).scale(1, 0.72, 1), "#FFFFFF");

const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
const blobMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
const canopyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });

/** One InstancedMesh for a list of {x, y, z, s, ry, color}. */
function Instances({ geometry, material, items, shadows = true }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const m = ref.current;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(it.x, it.y || 0, it.z);
      o.rotation.set(0, it.ry || 0, 0);
      o.scale.setScalar(it.s || 1);
      if (it.sy) o.scale.y *= it.sy;
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(it.color || "#FFFFFF"));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={shadows} receiveShadow />;
}

const GREENS = ["#4C7A30", "#3F6E2A", "#5D8C36", "#6B9A3C", "#355F27"];
const ACCENTS = ["#8A3A3F", "#B85C86", "#B5A53F", "#9C4552", "#C27A45"]; // cordyline, bougainvillea, croton, heliconia

export default function Vegetation() {
  const data = useMemo(() => plant(), []);
  const geos = useMemo(
    () => ({
      palms: [palmGeometry(3), palmGeometry(17), palmGeometry(29)],
      frangipani: frangipaniGeometry(),
      bush: bushGeometry(),
      banana: bananaGeometry(),
      rain: rainTreeGeometry(),
      canopy: canopyGeometry(),
    }),
    [],
  );
  return (
    <group>
      {data.palms.map((items, i) => (
        <Instances key={i} geometry={geos.palms[i]} material={leafMat} items={items} />
      ))}
      <Instances geometry={geos.frangipani} material={leafMat} items={data.frangipani} />
      <Instances geometry={geos.bush} material={blobMat} items={data.bushes} />
      <Instances geometry={geos.banana} material={leafMat} items={data.banana} />
      <Instances geometry={geos.rain} material={blobMat} items={data.rain} />
      <Instances geometry={geos.canopy} material={canopyMat} items={data.jungle} shadows={false} />
    </group>
  );
}

/** Where everything grows. Hand-placed accents first, then seeded scatter in garden zones. */
function plant() {
  const r = rng(2024);
  const palms = [[], [], []];
  const frangipani = [];
  const bushes = [];
  const banana = [];
  const rain = [];
  const jungle = [];
  const pick = (a) => a[Math.floor(r() * a.length)];
  const addPalm = (x, z, y = 0, s = 0.9 + r() * 0.35) => palms[Math.floor(r() * 3)].push({ x, y, z, s, ry: r() * Math.PI * 2 });
  const addBush = (x, z, s = 0.6 + r() * 0.6, accent = r() < 0.2) =>
    bushes.push({ x, z, s, ry: r() * 6.28, color: accent ? pick(ACCENTS) : pick(GREENS) });

  // Arrival drive: a palm avenue.
  for (let z = 27; z <= 70; z += 7) {
    addPalm(-6.2, z + r());
    addPalm(6.2, z + 3.5 + r());
    addBush(-5.4, z + 2.5, 0.8, true);
    addBush(5.4, z - 1, 0.8, true);
  }
  // Pool & lobby accents.
  [[-16.5, -3.5], [-20, -15], [10.5, -14.5], [-9, 1.2], [9.5, 1], [12, -9], [-24, -2], [-12, 17], [12, 18]].forEach(([x, z]) => addPalm(x, z));
  [[-11, 0.5], [7, 0.4], [-18.5, -4.8]].forEach(([x, z]) => frangipani.push({ x, z, s: 1.1 + r() * 0.3, ry: r() * 6 }));
  // Villa gardens: a palm and a frangipani in each front garden, shrubs along the walls.
  for (const v of VILLAS) {
    addPalm(v.x - 4.4, PLOT_Z - 1.4);
    frangipani.push({ x: v.x + 3.9, z: PLOT_Z - 1.4, s: 0.9 + r() * 0.25, ry: r() * 6 });
    for (let k = 0; k < 5; k++) addBush(v.x - 3.4 + k * 1.1 + (k > 2 ? 2 : 0), PLOT_Z - 0.75, 0.45 + r() * 0.2);
    addBush(v.x + 5, PLOT_Z - 6, 0.7);
    addBush(v.x + 5, PLOT_Z - 9.5, 0.6, true);
  }
  // Sunset bar corner.
  [[78, -14.5], [96, -14], [97, -5], [79, -6]].forEach(([x, z]) => addPalm(x, z));

  // Gardens north of the lane and around the arrival court.
  const zones = [
    { x0: 10, x1: 96, z0: 0.2, z1: 14, palms: 26, fr: 14, bush: 230, banana: 26, rain: 3 },
    { x0: -45, x1: 45, z0: 23, z1: 90, palms: 26, fr: 8, bush: 160, banana: 14, rain: 10 },
    { x0: -45, x1: -9, z0: -14, z1: 22, palms: 18, fr: 6, bush: 120, banana: 12, rain: 4 },
    { x0: 92, x1: 130, z0: -14, z1: 22, palms: 14, fr: 4, bush: 80, banana: 8, rain: 4 },
    { x0: -4, x1: 96, z0: 21.5, z1: 30, palms: 14, fr: 0, bush: 70, banana: 6, rain: 4 },
  ];
  const spot = (zone, pad) => {
    for (let tries = 0; tries < 30; tries++) {
      const x = zone.x0 + r() * (zone.x1 - zone.x0);
      const z = zone.z0 + r() * (zone.z1 - zone.z0);
      if (isClear(x, z, pad) && distanceToPath(x, z) > 2.2 + pad && !(Math.abs(x) < 5.5 && z > 15)) return [x, z];
    }
    return null;
  };
  for (const zone of zones) {
    for (let i = 0; i < zone.palms; i++) {
      const p = spot(zone, 1);
      if (p) addPalm(...p);
    }
    for (let i = 0; i < zone.fr; i++) {
      const p = spot(zone, 1);
      if (p) frangipani.push({ x: p[0], z: p[1], s: 0.9 + r() * 0.4, ry: r() * 6 });
    }
    for (let i = 0; i < zone.bush; i++) {
      const p = spot(zone, 0.2);
      if (p) addBush(...p);
    }
    for (let i = 0; i < zone.banana; i++) {
      const p = spot(zone, 0.5);
      if (p) banana.push({ x: p[0], z: p[1], s: 0.9 + r() * 0.4, ry: r() * 6 });
    }
    for (let i = 0; i < zone.rain; i++) {
      const p = spot(zone, 3);
      if (p) rain.push({ x: p[0], z: p[1], s: 1 + r() * 0.5, ry: r() * 6, color: pick(GREENS) });
    }
  }

  // Jungle around the resort grounds.
  for (let i = 0; i < 900; i++) {
    const a = r() * Math.PI * 2;
    const d = 60 + r() * 230;
    const x = 45 + Math.cos(a) * d * 1.3;
    const z = 30 + Math.sin(a) * d;
    if (z < EDGE_Z + 2) continue;
    if (Math.abs(x) < 9 && z < 120) continue; // keep the drive open
    if (r() < 0.25) addPalm(x, z, 0, 1 + r() * 0.4);
    else rain.push({ x, z, s: 1.3 + r() * 1.4, ry: r() * 6, color: pick(GREENS) });
  }

  // Palms along the terrace edges and the river, like the hillsides around Ubud.
  for (let i = 0; i < 520; i++) {
    const x = -160 + r() * 420;
    const z = EDGE_Z - 44 - r() * 210;
    const v = valley(x, z);
    if (v.zone === "terrace" && v.f > 0.12 && v.f < 0.8) continue; // keep the paddies open
    if (v.zone === "river") continue;
    if (r() < 0.75) addPalm(x, z, v.h, 0.9 + r() * 0.5);
    else {
      addBush(x, z, 1.2 + r() * 1.2, false);
      bushes[bushes.length - 1].y = v.h;
    }
  }
  // Cliff-top shrubs (outside pools and villa plots).
  for (let x = -60; x < 140; x += 2.2 + r() * 2) {
    if (!isClear(x, EDGE_Z + 0.6)) continue;
    addBush(x, EDGE_Z - 0.6 - r() * 1.5, 0.9 + r() * 0.6);
    bushes[bushes.length - 1].y = valley(x, EDGE_Z - 1.5).h + 0.3;
  }

  // Jungle canopy: the slope below the resort, the riverbanks and the hills beyond the terraces.
  const JUNGLE = ["#3D6B2B", "#2F5A24", "#4A7A30", "#56843A", "#36622A"];
  const tree = (x, z, s, belowCliff = false) => {
    const v = valley(x, z, false);
    let y = v.h - 1.4 + s * 0.55;
    // On the slope under the resort, keep canopies below the cliff top so they never block the view.
    if (belowCliff) y = Math.min(y, -1.2 - s * 0.72);
    jungle.push({ x, y, z, s, ry: r() * 6, color: pick(JUNGLE) });
  };
  for (let i = 0; i < 1000; i++) {
    const x = -170 + r() * 440;
    const d = 5 + r() * 45;
    if (d > 16 && r() < 0.3 && rain.length < 900) {
      const v = valley(x, EDGE_Z - d);
      rain.push({ x, y: v.h, z: EDGE_Z - d, s: 1.4 + r() * 1.2, ry: r() * 6, color: pick(GREENS) });
    } else tree(x, EDGE_Z - d, 2.5 + r() * 3, true);
  }
  for (let i = 0; i < 2600; i++) {
    const x = -520 + r() * 1140;
    const d = 250 + Math.pow(r(), 1.6) * 430;
    tree(x, EDGE_Z - d, 6 + r() * 6 + (d - 250) * 0.02);
  }
  // Wider valley outside the terraced area.
  for (let i = 0; i < 500; i++) {
    const side = r() < 0.5 ? -1 : 1;
    const x = side < 0 ? -500 + r() * 330 : 270 + r() * 330;
    tree(x, EDGE_Z - 4 - r() * 260, 4 + r() * 5);
  }
  return { palms, frangipani, bushes, banana, rain, jungle };
}
