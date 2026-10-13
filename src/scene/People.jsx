import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { valley } from "../data/world";

const mats = new Map();
const mat = (color, rough = 0.85) => {
  const key = `${color}:${rough}`;
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: rough }));
  return mats.get(key);
};

const GEO = {
  torso: new THREE.CapsuleGeometry(0.15, 0.3, 4, 10),
  pelvis: new THREE.CapsuleGeometry(0.14, 0.06, 4, 10),
  head: new THREE.SphereGeometry(0.112, 14, 10),
  hair: new THREE.SphereGeometry(0.12, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
  limb: new THREE.CapsuleGeometry(0.062, 0.3, 4, 8),
  arm: new THREE.CapsuleGeometry(0.048, 0.48, 4, 8),
  skirt: new THREE.CylinderGeometry(0.17, 0.25, 0.62, 12, 1, true),
  udeng: new THREE.CylinderGeometry(0.122, 0.122, 0.07, 12),
  fin: new THREE.ConeGeometry(0.05, 0.1, 4),
  caping: new THREE.ConeGeometry(0.34, 0.2, 14),
  brim: new THREE.CylinderGeometry(0.25, 0.25, 0.015, 16),
  crown: new THREE.CylinderGeometry(0.12, 0.13, 0.1, 12),
  tray: new THREE.CylinderGeometry(0.17, 0.17, 0.015, 14),
  glass: new THREE.CylinderGeometry(0.03, 0.025, 0.12, 8),
  case: new THREE.BoxGeometry(0.38, 0.5, 0.18),
  broom: new THREE.CylinderGeometry(0.015, 0.015, 1.3, 5),
  broomHead: new THREE.ConeGeometry(0.1, 0.3, 6),
};

const HIP = 0.92;

export const SKIN = ["#F2CDA9", "#E3B088", "#C98E5C", "#A86E45", "#7C4E2E", "#5C3A24"];

/**
 * Low-poly person rig: legs (thigh + shin), pelvis, torso, arms, head, hair, hat.
 * Faces local +z. Poses: stand, walk, sit, lie, swim, bend.
 */
export function Person({ look = {}, pose = "stand", route, speed = 1.1, phase = 0, seat = 0.45, item, ...props }) {
  const { skin = SKIN[1], top = "#FFFFFF", bottom = "#3D4A5A", hair = "#2A1E16", hat, dress = false, longHair = false } = look;
  const root = useRef();
  const upper = useRef();
  const legs = [useRef(), useRef()];
  const knees = [useRef(), useRef()];
  const arms = [useRef(), useRef()];
  const path = useMemo(() => (route ? buildRoute(route) : null), [route]);
  const t0 = useRef(phase * 10);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    t0.current += dt;
    const t = t0.current;
    const g = root.current;
    let walking = pose === "walk";
    if (path) {
      const { x, z, heading, paused } = path.at(t * speed);
      g.position.x = x;
      g.position.z = z;
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, nearestAngle(g.rotation.y, heading), 8, dt);
      walking = !paused;
    }
    if (pose === "swim") {
      g.position.y = -1.44 + Math.sin(t * 1.6) * 0.03;
      arms[0].current.rotation.x = -1.3 + Math.sin(t * 2) * 0.35;
      arms[1].current.rotation.x = -1.3 + Math.sin(t * 2) * 0.35;
      arms[0].current.rotation.z = 0.5 + Math.cos(t * 2) * 0.3;
      arms[1].current.rotation.z = -0.5 - Math.cos(t * 2) * 0.3;
    } else if (walking) {
      const w = t * speed * 5.2;
      const s = Math.sin(w);
      legs[0].current.rotation.x = s * 0.5;
      legs[1].current.rotation.x = -s * 0.5;
      knees[0].current.rotation.x = Math.max(0, -Math.cos(w)) * 0.55;
      knees[1].current.rotation.x = Math.max(0, Math.cos(w)) * 0.55;
      if (!item || item === "drink") {
        arms[0].current.rotation.x = -s * 0.45;
        arms[1].current.rotation.x = s * 0.45;
      }
      upper.current.position.y = HIP + Math.abs(Math.cos(w)) * 0.025;
    } else if (pose === "bend") {
      upper.current.rotation.x = 0.9 + Math.sin(t * 0.8) * 0.08;
    } else if (item === "broom") {
      arms[0].current.rotation.z = Math.sin(t * 2.4) * 0.35;
    } else {
      upper.current.rotation.z = Math.sin(t * 0.7 + phase) * 0.015; // breathing sway
    }
  });

  // Static pose setup.
  const sitting = pose === "sit" || pose === "lie";
  const thighX = sitting ? -1.5 : 0;
  const kneeX = pose === "sit" ? 1.5 : 0;
  const rootY = pose === "sit" ? seat - 0.84 : pose === "lie" ? seat - 0.84 : pose === "swim" ? -1.44 : 0;
  const upperX = pose === "lie" ? -0.85 : pose === "sit" ? -0.05 : 0;
  const armX = item === "tray" ? [-1.2, 0] : item === "drink" ? [-1.0, 0] : pose === "lie" ? [-0.2, -0.2] : [0, 0];
  const armZ = item === "tray" ? [0.15, -0.08] : [0.1, -0.1];

  const skinM = mat(skin);
  const topM = mat(top);
  const bottomM = mat(bottom);
  return (
    <group {...props}>
      <group ref={root} position-y={rootY}>
        {/* legs */}
        {[-1, 1].map((s, i) => (
          <group key={s} ref={legs[i]} position={[s * 0.088, 0.9, 0]} rotation-x={thighX}>
            <mesh geometry={GEO.limb} material={dress ? skinM : bottomM} position-y={-0.21} castShadow />
            <group ref={knees[i]} position-y={-0.43} rotation-x={kneeX}>
              <mesh geometry={GEO.limb} material={skinM} position-y={-0.21} scale={[0.85, 1, 0.85]} castShadow />
            </group>
          </group>
        ))}
        <group ref={upper} rotation-x={upperX} position-y={HIP}>
          <group>
            <mesh geometry={GEO.pelvis} material={bottomM} position-y={0.04} scale={[1.1, 1, 0.8]} castShadow />
            {dress && !sitting && <mesh geometry={GEO.skirt} material={bottomM} position-y={-0.26} castShadow />}
            <mesh geometry={GEO.torso} material={topM} position-y={0.3} scale={[1.18, 1, 0.74]} castShadow />
            <mesh geometry={GEO.head} material={skinM} position-y={0.7} castShadow />
            <mesh geometry={GEO.hair} material={mat(hair)} position={[0, 0.715, -0.012]} rotation-x={-0.4} />
            {longHair && (
              <mesh material={mat(hair)} position={[0, 0.55, -0.08]}>
                <boxGeometry args={[0.2, 0.3, 0.06]} />
              </mesh>
            )}
            {hat === "udeng" && (
              <group position-y={0.77}>
                <mesh geometry={GEO.udeng} material={mat(look.hatColor || "#F4F1EA")} />
                <mesh geometry={GEO.fin} material={mat(look.hatColor || "#F4F1EA")} position={[0, 0.06, 0.09]} rotation-x={0.4} />
              </group>
            )}
            {hat === "caping" && <mesh geometry={GEO.caping} material={mat("#D9BE7C")} position-y={0.86} castShadow />}
            {hat === "sun" && (
              <group position-y={0.79}>
                <mesh geometry={GEO.brim} material={mat("#E8D7AE")} castShadow />
                <mesh geometry={GEO.crown} material={mat("#E8D7AE")} position-y={0.05} />
              </group>
            )}
            {/* arms */}
            {[-1, 1].map((s, i) => (
              <group key={s} ref={arms[i]} position={[s * 0.22, 0.5, 0]} rotation={[armX[i], 0, -armZ[i]]}>
                <mesh geometry={GEO.arm} material={look.sleeves ? topM : skinM} position-y={-0.28} castShadow />
                {i === 0 && item === "tray" && (
                  <group position={[0.02, -0.56, 0.05]} rotation-x={1.2}>
                    <mesh geometry={GEO.tray} material={mat("#C9A15A", 0.4)} position-y={0.02} />
                    <mesh geometry={GEO.glass} material={mat("#F2A65A", 0.2)} position={[0.06, 0.08, 0]} />
                    <mesh geometry={GEO.glass} material={mat("#E9F3F2", 0.2)} position={[-0.07, 0.08, 0.04]} />
                  </group>
                )}
                {i === 0 && item === "drink" && <mesh geometry={GEO.glass} material={mat("#F2A65A", 0.2)} position={[0, -0.58, 0.02]} rotation-x={1} />}
                {i === 1 && item === "case" && <mesh geometry={GEO.case} material={mat("#7B5A3C", 0.6)} position={[0.08, -0.72, 0]} castShadow />}
                {i === 0 && item === "broom" && (
                  <group position={[0, -0.56, 0.12]} rotation-x={0.5}>
                    <mesh geometry={GEO.broom} material={mat("#C8A867")} position-y={-0.3} />
                    <mesh geometry={GEO.broomHead} material={mat("#B39A5E")} position-y={-0.95} />
                  </group>
                )}
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}

const nearestAngle = (from, to) => {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d;
};

/**
 * Walking route through [x, z] points, back and forth, pausing briefly at each end.
 * `at(s)` takes a distance walked and returns position, heading and whether it's paused.
 */
export function buildRoute(points, { loop = false, pause = 2.5 } = {}) {
  const pts = loop ? [...points, points[0]] : points;
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1];
  const sample = (d) => {
    let i = 1;
    while (i < lens.length - 1 && lens[i] < d) i++;
    const a = pts[i - 1];
    const b = pts[i];
    const k = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
    return { x: a[0] + (b[0] - a[0]) * k, z: a[1] + (b[1] - a[1]) * k, heading: Math.atan2(b[0] - a[0], b[1] - a[1]) };
  };
  return {
    total,
    at(s) {
      if (loop) return { ...sample(s % total), paused: false };
      const cycle = total * 2 + pause * 2;
      let c = s % cycle;
      if (c < total) return { ...sample(c), paused: false };
      c -= total;
      if (c < pause) return { ...sample(total), paused: true };
      c -= pause;
      if (c < total) {
        const p = sample(total - c);
        return { ...p, heading: p.heading + Math.PI, paused: false };
      }
      const p = sample(0);
      return { ...p, heading: p.heading + Math.PI, paused: true };
    },
  };
}

// ---------- Cast ----------

const STAFF = { top: "#FFFFFF", bottom: "#6B4A2E", hat: "udeng", hatColor: "#FFFFFF", dress: true, sleeves: true };
const STAFF_BATIK = { ...STAFF, top: "#2F4F45", bottom: "#8A5A35", hatColor: "#D9A441" };

/** Everyone at the resort. Coordinates are world space; see the layout in data/path.js. */
export default function People() {
  const farmers = useMemo(
    () =>
      [[-30, -104], [18, -112], [24, -113], [60, -98], [105, -121], [-12, -131], [44, -142]].map(([x, z]) => {
        const v = valley(x, z);
        return [x, v.h, z];
      }),
    [],
  );
  return (
    <group>
      {/* Arrival: doorman, porter, arriving guests */}
      <Person look={{ ...STAFF_BATIK, skin: SKIN[3] }} position={[2.6, 0, 23.4]} rotation-y={0.3} />
      <Person look={{ ...STAFF, skin: SKIN[4] }} route={[[2.4, 42], [2.4, 24.5], [1.7, 16]]} speed={1} phase={0.3} item="case" />
      <Person look={{ skin: SKIN[0], top: "#E8B4A0", bottom: "#F2EBDD", hair: "#C9A15A", dress: true, longHair: true, hat: "sun" }} route={[[-1.6, 36], [-1.4, 22], [-1.4, 14]]} speed={0.85} phase={0.1} />
      <Person look={{ skin: SKIN[1], top: "#5E86A8", bottom: "#E9E1CF", hair: "#3A2A1C" }} route={[[-0.6, 36.6], [-0.5, 22.6], [-0.5, 14.6]]} speed={0.85} phase={0.1} />

      {/* Lobby: receptionists and a guest waiting */}
      <Person look={{ ...STAFF_BATIK, skin: SKIN[3], longHair: true }} position={[-4.9, 0.14, 9]} rotation-y={Math.PI / 2} />
      <Person look={{ ...STAFF_BATIK, skin: SKIN[4] }} position={[-4.9, 0.14, 6.8]} rotation-y={Math.PI / 2} />
      <Person look={{ skin: SKIN[2], top: "#F1E3C6", bottom: "#4B5D4B", hair: "#1E1712" }} pose="sit" seat={0.56} position={[4.55, 0, 7.6]} rotation-y={-Math.PI / 2} item="drink" />

      {/* Infinity pool: sunbathers, swimmers, a waiter with a tray */}
      <Person look={{ skin: SKIN[0], top: "#E26D5A", bottom: "#E26D5A", hair: "#B9874C", longHair: true }} pose="lie" seat={0.36} position={[-12, 0, -5.5]} rotation-y={Math.PI} />
      <Person look={{ skin: SKIN[2], top: "#2D5F8B", bottom: "#2D5F8B", hair: "#1E1712" }} pose="lie" seat={0.36} position={[-9.5, 0, -5.5]} rotation-y={Math.PI} />
      <Person look={{ skin: SKIN[1], top: "#F2C46D", bottom: "#F2C46D", hair: "#3A2A1C", longHair: true }} pose="lie" seat={0.36} position={[-4.5, 0, -5.5]} rotation-y={Math.PI} />
      <Person look={{ skin: SKIN[1], top: "#E26D5A", hair: "#3A2A1C" }} pose="swim" route={[[-8, -10], [-3, -12.5], [2, -11]]} speed={0.35} phase={0.4} />
      <Person look={{ skin: SKIN[3], top: "#4FA3A5", hair: "#1E1712", longHair: true }} pose="swim" position={[-10.5, 0, -13.2]} rotation-y={Math.PI} />
      <Person look={{ ...STAFF, skin: SKIN[3] }} route={[[-16.5, -7], [-6, -6.8], [-1.6, -6.6]]} speed={0.9} phase={0.6} item="tray" />

      {/* Pool bar */}
      <Person look={{ ...STAFF_BATIK, skin: SKIN[4] }} position={[-19.8, 0.12, -10]} rotation-y={Math.PI / 2} />
      <Person look={{ skin: SKIN[0], top: "#FFFFFF", bottom: "#C47A57", hair: "#6B4A2E" }} pose="sit" seat={0.9} position={[-17.6, 0, -9.3]} rotation-y={-Math.PI / 2} item="drink" />
      <Person look={{ skin: SKIN[2], top: "#2F4F45", bottom: "#E9E1CF", hair: "#1E1712", longHair: true, dress: true }} pose="sit" seat={0.9} position={[-17.6, 0, -11]} rotation-y={-Math.PI / 2} item="drink" />

      {/* Villa lane: strolling couple, gardener, staff carrying offerings */}
      <Person look={{ skin: SKIN[1], top: "#F4F1EA", bottom: "#8A9A6B", hair: "#3A2A1C", hat: "sun" }} route={[[17, -0.55], [78, -0.55]]} speed={0.8} phase={1.4} />
      <Person look={{ skin: SKIN[0], top: "#D98E73", bottom: "#F4F1EA", hair: "#C9A15A", dress: true, longHair: true }} route={[[17, -0.05], [78, -0.05]]} speed={0.8} phase={1.4} />
      <Person look={{ skin: SKIN[4], top: "#6B8E5A", bottom: "#4A3A2A", hat: "caping" }} position={[26, 0, 2.2]} rotation-y={-0.6} item="broom" />
      <Person look={{ ...STAFF, skin: SKIN[3], longHair: true, hat: undefined }} route={[[36, 1.8], [52, 2], [66, 1.6]]} speed={0.7} phase={2} item="drink" />

      {/* Warung restaurant diners and a waiter */}
      <Person look={{ skin: SKIN[0], top: "#5E86A8", bottom: "#E9E1CF", hair: "#6B4A2E" }} pose="sit" seat={0.78} position={[28.2, 0, 7.4]} rotation-y={Math.PI / 2} />
      <Person look={{ skin: SKIN[1], top: "#E8B4A0", bottom: "#F2EBDD", hair: "#1E1712", longHair: true }} pose="sit" seat={0.78} position={[30.8, 0, 7.4]} rotation-y={-Math.PI / 2} />
      <Person look={{ skin: SKIN[2], top: "#F2C46D", bottom: "#3D4A5A", hair: "#1E1712" }} pose="sit" seat={0.78} position={[33.2, 0, 9.6]} rotation-y={Math.PI / 2} />
      <Person look={{ ...STAFF, skin: SKIN[4] }} position={[32, 0.32, 6.2]} rotation-y={0.4} item="tray" />

      {/* Yoga bale */}
      <Person look={{ skin: SKIN[1], top: "#B9D3C4", bottom: "#3D4A5A", hair: "#3A2A1C", longHair: true }} pose="sit" seat={0.62} position={[70.4, 0, 7.4]} rotation-y={Math.PI} />
      <Person look={{ skin: SKIN[3], top: "#F4F1EA", bottom: "#F4F1EA", hair: "#1E1712" }} pose="sit" seat={0.62} position={[71.8, 0, 7.4]} rotation-y={Math.PI} />

      {/* Sunset bar */}
      <Person look={{ ...STAFF_BATIK, skin: SKIN[4] }} position={[92.6, 0.1, -7.1]} rotation-y={Math.PI} />
      <Person look={{ skin: SKIN[0], top: "#F4F1EA", bottom: "#C47A57", hair: "#C9A15A", longHair: true, dress: true }} position={[84.6, 0.1, -14.2]} rotation-y={Math.PI + 0.2} item="drink" />
      <Person look={{ skin: SKIN[2], top: "#3E6E8E", bottom: "#E9E1CF", hair: "#1E1712" }} position={[85.4, 0.1, -14.3]} rotation-y={Math.PI - 0.3} item="drink" />
      <Person look={{ skin: SKIN[1], top: "#E26D5A", bottom: "#3D4A5A", hair: "#3A2A1C" }} pose="sit" seat={0.3} position={[91.2, 0, -12.6]} rotation-y={Math.PI} item="drink" />
      <Person look={{ skin: SKIN[3], top: "#F2C46D", bottom: "#F2EBDD", hair: "#1E1712", longHair: true }} pose="sit" seat={0.3} position={[92.6, 0, -12.4]} rotation-y={Math.PI - 0.3} />

      {/* Farmers in the rice terraces */}
      {farmers.map((p, i) => (
        <Person key={i} look={{ skin: SKIN[4], top: ["#4A6A8A", "#8A5A35", "#5F7F4A"][i % 3], bottom: "#3A3530", hat: "caping" }} pose="bend" position={p} rotation-y={i * 1.3} phase={i} />
      ))}
    </group>
  );
}
