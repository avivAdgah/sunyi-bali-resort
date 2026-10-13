import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { curve, PATH_LENGTH } from "../data/path";
import { inRect, valley, EDGE_Z } from "../data/world";
import { M } from "./materials";
import { Block, HipRoof, Post, Lounger, Parasol, Bale, Tedung, Guardian, Penjor, Torch, StoneLantern, Pendant, Canang, Urn, FlameFlicker } from "./Parts";
import { KitModel } from "./Model";
import { NightLight } from "./Villa";
import { boardTexture, pavingTexture, tiled, glowTexture } from "./textures";
import { TIME, onTime } from "./time";

export default function Resort() {
  return (
    <group>
      <Gate />
      <BoundaryWalls />
      <Arrival />
      <Lobby />
      <PoolDeck />
      <PoolBar />
      <Restaurant />
      <SpaAndYoga />
      <SunsetBar />
      <PathLights />
      <ValleyHuts />
      <Fireflies />
      <FlameFlicker />
    </group>
  );
}

/** Candi bentar: a temple gate split cleanly in two, stepping up in brick tiers with paras-stone bands. */
function Gate() {
  const tiers = [
    [2.7, 1.3, 2.6, M.stone],
    [2.4, 1.1, 2.3, M.brick],
    [2.55, 0.2, 2.45, M.stone],
    [2.1, 1.1, 2.0, M.brick],
    [2.2, 0.18, 2.1, M.stone],
    [1.8, 1.0, 1.7, M.brick],
    [1.9, 0.16, 1.8, M.stone],
    [1.45, 0.9, 1.35, M.brick],
    [1.1, 0.8, 1.0, M.brick],
    [1.2, 0.14, 1.1, M.stone],
    [0.7, 0.7, 0.6, M.brick],
    [0.35, 0.5, 0.3, M.stone],
  ];
  const half = (side) => {
    let y = 0;
    return tiers.map(([w, h, d, m], i) => {
      const x = side * (1.6 + w / 2);
      const el = <Block key={i} size={[w, h, d]} position={[x, y + h / 2, 22]} material={m} tile={m === M.brick ? 1.4 : 0.8} />;
      y += h;
      return el;
    });
  };
  return (
    <group>
      {half(-1)}
      {half(1)}
      <Guardian position={[-2.9, 0, 24.1]} />
      <Guardian position={[2.9, 0, 24.1]} />
      <Tedung position={[-4.3, 0, 23.6]} />
      <Tedung position={[4.3, 0, 23.6]} color="#F4F1EA" />
      <Canang position={[0.6, 0.03, 22.6]} />
      <Canang position={[-0.5, 0.03, 22.4]} rotation-y={0.7} />
      <Torch position={[-1.9, 0, 25.6]} />
      <Torch position={[1.9, 0, 25.6]} />
    </group>
  );
}

function BoundaryWalls() {
  const walls = [
    [-17.2, 22, 26, 0.5], // left of the gate
    [51.2, 22, 93.8, 0.5], // right of the gate
    [-30, 3, 0.5, 38],
    [98, 3, 0.5, 38],
  ];
  return (
    <group>
      {walls.map(([x, z, w, d], i) => (
        <group key={i}>
          <Block size={[w, 2.2, d]} position={[x, 1.1, z]} material={M.brick} tile={1.4} />
          <Block size={[w + 0.12, 0.12, d + 0.12]} position={[x, 2.26, z]} material={M.stone} tile={0.8} />
        </group>
      ))}
    </group>
  );
}

/** Arrival court: penjor-lined drive, welcome sign, urns. */
function Arrival() {
  const sign = useMemo(() => boardTexture("SUNYI", "BALI JUNGLE RETREAT · UBUD", "welcome"), []);
  return (
    <group>
      {[27, 35, 43, 51, 59].map((z) => (
        <group key={z}>
          <Penjor position={[-4.1, 0, z]} />
          <Penjor position={[4.1, 0, z + 4]} flip />
        </group>
      ))}
      <group position={[-7, 0, 42]} rotation-y={0.55}>
        <Block size={[3.8, 0.8, 0.8]} position-y={0.4} material={M.stone} tile={0.8} />
        <mesh position={[0, 1.55, 0.05]}>
          <planeGeometry args={[3.5, 1.23]} />
          <meshStandardMaterial map={sign} roughness={0.7} emissive="#FFFFFF" emissiveMap={sign} emissiveIntensity={0.1} />
        </mesh>
        <Block size={[3.7, 1.35, 0.12]} position={[0, 1.55, -0.04]} material={M.teak} />
        <StoneLantern position={[-2.3, 0, 0.3]} />
        <StoneLantern position={[2.3, 0, 0.3]} />
      </group>
      <Urn position={[-2.6, 0, 20.4]} />
      <Urn position={[2.6, 0, 20.4]} />
    </group>
  );
}

/** Open-sided lobby: a two-tier alang-alang roof on teak posts, carved reception desk, lounge. */
function Lobby() {
  const posts = [];
  for (const x of [-6.5, -2.4, 2.4, 6.5]) for (const z of [2.6, 8.5, 14.4]) posts.push([x, z]);
  const desk = useMemo(() => boardTexture("Welcome · Selamat Datang", "RECEPTION", "reception"), []);
  return (
    <group>
      <Block size={[16, 0.14, 13.4]} position={[0, 0.07, 8.5]} material={M.stone} tile={1.2} cast={false} />
      {posts.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Block size={[0.6, 0.4, 0.6]} position-y={0.2} material={M.stone} tile={0.6} />
          <Post from={0.4} to={4} r={0.17} />
        </group>
      ))}
      {[2.6, 8.5, 14.4].map((z) => (
        <Block key={z} size={[13.6, 0.26, 0.24]} position={[0, 4.05, z]} material={M.teak} />
      ))}
      <HipRoof w={17.6} d={16} h={2.2} ridge={2.4} y={4.1} position-z={8.5} />
      <HipRoof w={8.4} d={7} h={3.6} ridge={1.6} y={5.6} position-z={8.5} />
      {[5, 8.5, 12].map((z) => (
        <Pendant key={z} position={[0, 5.4, z]} drop={0.9} size={0.36} />
      ))}
      {/* reception */}
      <Block size={[0.9, 1.05, 4.6]} position={[-3.9, 0.66, 8]} material={M.teak} tile={0.8} />
      <Block size={[1.05, 0.08, 4.8]} position={[-3.9, 1.22, 8]} material={M.terrazzo} tile={1} />
      <mesh position={[-3.43, 0.66, 8]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[3.2, 0.9]} />
        <meshStandardMaterial map={desk} roughness={0.7} />
      </mesh>
      <Block size={[0.4, 3, 6]} position={[-7.4, 1.64, 8.2]} material={M.brick} tile={1.2} />
      <Guardian position={[-6.8, 0.14, 11.6]} rotation-y={Math.PI / 2} scale={0.6} />
      <Urn position={[-3.9, 1.26, 9.8]} scale={0.45} />
      <Canang position={[-3.9, 1.27, 6.5]} />
      {/* lounge */}
      <KitModel model="rugRectangle" position={[4.2, 0.145, 8.6]} rotation-y={Math.PI / 2} scale={1.2} colors={{ carpet: "#CDBB98", carpetDarker: "#A88F6A" }} />
      <KitModel model="loungeSofa" position={[4.85, 0.14, 7.6]} rotation-y={-Math.PI / 2} colors={{ carpet: "#E9E1D2", wood: "#6E4527" }} />
      <KitModel model="loungeSofa" position={[4.85, 0.14, 10.2]} rotation-y={-Math.PI / 2} colors={{ carpet: "#B8643A", wood: "#6E4527" }} />
      <KitModel model="tableCoffee" position={[3.5, 0.14, 8.9]} rotation-y={Math.PI / 2} scale={0.85} />
      <KitModel model="loungeChairRelax" position={[2.4, 0.14, 11.2]} rotation-y={Math.PI * 0.75} colors={{ carpet: "#E9E1D2" }} />
      <KitModel model="pottedPlant" position={[6.2, 0.14, 4]} scale={1.8} />
      <KitModel model="pottedPlant" position={[6.2, 0.14, 13]} scale={1.8} />
      {/* lotus bowls at the pool-side steps */}
      {[-2.2, 2.2].map((x) => (
        <group key={x} position={[x, 0.14, 2.4]}>
          <Block size={[1.3, 0.55, 1.3]} position-y={0.27} material={M.stone} tile={0.6} />
          <mesh position-y={0.56} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.55, 20]} />
            <meshStandardMaterial color="#3E6E5C" roughness={0.1} />
          </mesh>
          <mesh position={[0.15, 0.62, 0.1]} material={M.flowerRed}>
            <coneGeometry args={[0.1, 0.16, 7]} />
          </mesh>
        </group>
      ))}
      <NightLight position={[0, 3.6, 8.5]} intensity={14} distance={16} />
    </group>
  );
}

/** Paved deck around the infinity pool with loungers, parasols and a curtained bale. */
function PoolDeck() {
  const geometry = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-18, 15.8);
    s.lineTo(11, 15.8);
    s.lineTo(11, 5.6);
    s.lineTo(-18, 5.6);
    s.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-14, 15.4);
    hole.lineTo(8, 15.4);
    hole.lineTo(8, 7.6);
    hole.lineTo(-14, 7.6);
    hole.closePath();
    s.holes.push(hole);
    const g = new THREE.ShapeGeometry(s);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const map = useMemo(() => tiled(pavingTexture(), 0.4), []);
  return (
    <group>
      <mesh geometry={geometry} position-y={0.015} receiveShadow>
        <meshStandardMaterial map={map} color="#E6DCC8" roughness={0.85} />
      </mesh>
      {[-12, -9.5, -7, -4.5].map((x) => (
        <Lounger key={x} position={[x, 0.015, -5.9]} rotation-y={Math.PI} />
      ))}
      {[-10.75, -5.75].map((x) => (
        <Parasol key={x} position={[x, 0, -5.3]} />
      ))}
      <Bale position={[12.6, 0, -10.6]} w={3} d={3} curtains />
      <Urn position={[9.6, 0, -6.2]} />
      <Urn position={[-15.6, 0, -15]} />
    </group>
  );
}

function PoolBar() {
  return (
    <group position={[0, 0, 0]}>
      <Block size={[7, 0.12, 7.4]} position={[-20.4, 0.06, -10.2]} material={M.deck} tile={1.2} cast={false} />
      <Block size={[0.7, 1.05, 4.2]} position={[-19, 0.6, -10.2]} material={M.teak} tile={0.8} />
      <Block size={[0.9, 0.08, 4.4]} position={[-19, 1.16, -10.2]} material={M.stone} tile={0.8} />
      {[-9.3, -11, -12.0].map((z, i) => (
        <KitModel key={z} model="stoolBar" position={[-17.9, 0.12, z]} colors={{ wood: "#6E4527", carpet: i === 2 ? "#B8643A" : "#E9E1D2" }} />
      ))}
      <Block size={[0.3, 1.8, 4]} position={[-22.6, 1.0, -10.2]} material={M.teak} tile={0.8} />
      {[-11.6, -10.6, -9.6, -8.8].map((z, i) => (
        <mesh key={z} position={[-22.35, 1.45, z]} material={i % 2 ? M.brass : M.glass}>
          <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        </mesh>
      ))}
      {[[-23, -13.4], [-17.8, -13.4], [-23, -7], [-17.8, -7]].map(([x, z], i) => (
        <Post key={i} from={0.12} to={2.9} r={0.12} position={[x, 0, z]} />
      ))}
      <HipRoof w={7.4} d={8.4} h={2.6} ridge={1.4} y={2.9} position={[-20.4, 0, -10.2]} />
      <Pendant position={[-19, 2.9, -9.2]} drop={0.9} size={0.22} />
      <Pendant position={[-19, 2.9, -11.2]} drop={0.9} size={0.22} />
      <NightLight position={[-19.5, 2.4, -10.2]} intensity={6} distance={9} />
    </group>
  );
}

/** Warung: open-air restaurant overlooking the lotus pond. */
function Restaurant() {
  const sign = useMemo(() => boardTexture("Warung Sawah", "BALINESE KITCHEN · 7AM – 11PM", "warung"), []);
  const posts = [];
  for (const x of [24.6, 30, 35.4]) for (const z of [4.6, 12.4]) posts.push([x, z]);
  return (
    <group>
      <Block size={[12.4, 0.3, 8.6]} position={[30, 0.15, 8.5]} material={M.stone} tile={0.9} />
      <Block size={[12, 0.02, 8.2]} position={[30, 0.31, 8.5]} material={M.deck} tile={1.2} cast={false} />
      {posts.map(([x, z], i) => (
        <Post key={i} from={0.3} to={3.3} r={0.16} position={[x, 0, z]} />
      ))}
      <HipRoof w={14} d={10.4} h={3.4} ridge={4} y={3.3} position={[30, 0, 8.5]} />
      {[[29.5, 7.4], [34.5, 9.6], [26, 10.4]].map(([x, z], i) => (
        <group key={i}>
          <KitModel model="tableRound" position={[x, 0.32, z]} scale={0.75} colors={{ wood: "#6E4527" }} />
          {[-1, 1].map((s) => (
            <KitModel key={s} model="chairCushion" position={[x + s * 1.2, 0.32, z]} rotation-y={(s * -Math.PI) / 2} colors={{ wood: "#6E4527", carpet: "#E9E1D2" }} />
          ))}
          <Pendant position={[x, 3.3, z]} drop={1.2} size={0.25} />
        </group>
      ))}
      <group position={[24.4, 0, 3.6]} rotation-y={-0.6}>
        <Post from={0} to={1.2} r={0.05} square position-x={-0.9} />
        <Post from={0} to={1.2} r={0.05} square position-x={0.9} />
        <mesh position-y={1.55}>
          <planeGeometry args={[2.1, 0.74]} />
          <meshStandardMaterial map={sign} roughness={0.7} emissive="#FFFFFF" emissiveMap={sign} emissiveIntensity={0.1} />
        </mesh>
      </group>
      <NightLight position={[30, 2.8, 8.5]} intensity={10} distance={13} />
    </group>
  );
}

function SpaAndYoga() {
  const spa = useMemo(() => boardTexture("Tirta Spa", "MASSAGE · FLOWER BATHS · YOGA", "spa"), []);
  return (
    <group>
      {/* spa pavilion */}
      <group position={[57, 0, 8.6]}>
        <Block size={[11, 0.35, 7.6]} position-y={0.17} material={M.stone} tile={0.9} />
        <Block size={[11, 2.6, 0.25]} position={[0, 1.65, 3.6]} material={M.stone} tile={0.9} />
        {[-5.3, 5.3].map((x) => (
          <Block key={x} size={[0.25, 2.6, 7.4]} position={[x, 1.65, 0]} material={M.stone} tile={0.9} />
        ))}
        {[-3.5, 0, 3.5].map((x) => (
          <group key={x}>
            <Block size={[0.8, 0.75, 2]} position={[x, 0.72, 0.6]} material={M.teak} tile={0.6} />
            <Block size={[0.8, 0.1, 2]} position={[x, 1.14, 0.6]} material={M.linen} />
            <mesh position={[x, 1.2, 1.3]} material={M.flowerRed}>
              <sphereGeometry args={[0.06, 6, 5]} />
            </mesh>
          </group>
        ))}
        {[-5.3, 5.3].map((x) => (
          <Post key={x} from={0.35} to={2.95} r={0.14} position={[x, 0, -3.6]} />
        ))}
        {[-1.8, 1.8].map((x) => (
          <mesh key={x} position={[x * 2, 1.65, -3.6]} material={M.sheer}>
            <planeGeometry args={[3.2, 2.5]} />
          </mesh>
        ))}
        <HipRoof w={12.6} d={9.2} h={3} ridge={3.6} y={2.95} />
        <NightLight position={[0, 2.4, 0]} intensity={7} distance={10} color="#FFC58A" />
      </group>
      <group position={[50.8, 0, 3.5]} rotation-y={-0.4}>
        <Post from={0} to={1.2} r={0.05} square position-x={-0.9} />
        <Post from={0} to={1.2} r={0.05} square position-x={0.9} />
        <mesh position-y={1.55}>
          <planeGeometry args={[2.1, 0.74]} />
          <meshStandardMaterial map={spa} roughness={0.7} emissive="#FFFFFF" emissiveMap={spa} emissiveIntensity={0.1} />
        </mesh>
      </group>
      <Guardian position={[45, 0, 8.6]} rotation-y={Math.PI} scale={0.75} />
      {/* yoga bale */}
      <group position={[71, 0, 7.4]}>
        <Block size={[5.4, 0.45, 4.4]} position-y={0.22} material={M.stone} tile={0.8} />
        <Block size={[5.2, 0.04, 4.2]} position-y={0.47} material={M.lightWood} tile={1} cast={false} />
        {[[-2.5, -2], [2.5, -2], [-2.5, 2], [2.5, 2]].map(([x, z], i) => (
          <Post key={i} from={0.45} to={3} r={0.12} square position={[x, 0, z]} />
        ))}
        <HipRoof w={7} d={6} h={2.6} ridge={1.4} y={3} />
        {[-0.6, 0.8, 2].map((x, i) => (
          <mesh key={x} position={[x, 0.5, 0.5]} material={i === 2 ? M.linen : M.flowerYellow}>
            <boxGeometry args={[0.65, 0.02, 1.8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Cliff-edge deck with a bar, beanbags, festoon lights and the best sunset view. */
function SunsetBar() {
  const sign = useMemo(() => boardTexture("Sunset Bar", "COCKTAILS FROM 4PM · LIVE GAMELAN", "sunset"), []);
  const bulbs = useMemo(() => {
    const out = [];
    const strands = [[[80, -4.4], [96, -4.4]], [[80, -4.4], [80, -15.4]], [[96, -4.4], [96, -15.4]], [[80, -10], [96, -10]]];
    for (const [[x0, z0], [x1, z1]] of strands) {
      const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.9);
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        out.push([x0 + (x1 - x0) * t, 3.1 - Math.sin(Math.PI * t) * 0.6, z0 + (z1 - z0) * t]);
      }
    }
    return out;
  }, []);
  return (
    <group>
      <Block size={[18.4, 0.1, 11.8]} position={[88, 0.05, -10]} material={M.deck} tile={1.2} cast={false} />
      {/* bar */}
      <Block size={[5, 1.05, 0.7]} position={[92.6, 0.6, -7.8]} material={M.teak} tile={0.8} />
      <Block size={[5.2, 0.08, 0.9]} position={[92.6, 1.16, -7.8]} material={M.stone} tile={0.8} />
      {[[89.6, -9.4], [95.6, -9.4], [89.6, -5], [95.6, -5]].map(([x, z], i) => (
        <Post key={i} from={0.1} to={2.9} r={0.12} position={[x, 0, z]} />
      ))}
      <HipRoof w={7.4} d={5.8} h={2.4} ridge={1.8} y={2.9} position={[92.6, 0, -7.2]} />
      {[91.6, 93.6].map((x) => (
        <KitModel key={x} model="stoolBar" position={[x, 0.1, -8.6]} colors={{ wood: "#6E4527", carpet: "#E9E1D2" }} />
      ))}
      {/* beanbags */}
      {[[91.2, -12.6, "#F2C46D"], [92.6, -12.4, "#B8643A"], [83, -12, "#E9E1D2"], [84.3, -12.2, "#2F6B5B"]].map(([x, z, c], i) => (
        <mesh key={i} position={[x, 0.24, z]} scale={[0.5, 0.26, 0.5]} castShadow>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={c} roughness={0.95} />
        </mesh>
      ))}
      {/* glass balustrade on the cliff edge */}
      <mesh position={[88, 0.6, -15.7]} material={M.glass}>
        <planeGeometry args={[18, 1.0]} />
      </mesh>
      <Block size={[18, 0.06, 0.08]} position={[88, 1.1, -15.7]} material={M.teak} />
      {[80, 96].map((x) => (
        <Post key={x} from={0.1} to={3.2} r={0.06} position={[x, 0, -15.4]} material={M.black} />
      ))}
      {[80, 96].map((x) => (
        <Post key={`b${x}`} from={0.1} to={3.2} r={0.06} position={[x, 0, -4.4]} material={M.black} />
      ))}
      <Festoon bulbs={bulbs} />
      {bulbs.map((p, i) => (
        <mesh key={i} position={p} material={M.lamp}>
          <sphereGeometry args={[0.05, 6, 5]} />
        </mesh>
      ))}
      <group position={[79.2, 0, -3]} rotation-y={-0.9}>
        <Post from={0} to={1.2} r={0.05} square position-x={-0.9} />
        <Post from={0} to={1.2} r={0.05} square position-x={0.9} />
        <mesh position-y={1.55}>
          <planeGeometry args={[2.1, 0.74]} />
          <meshStandardMaterial map={sign} roughness={0.7} emissive="#FFFFFF" emissiveMap={sign} emissiveIntensity={0.1} />
        </mesh>
      </group>
      <Torch position={[81, 0, -15]} />
      <Torch position={[95, 0, -15]} />
      <NightLight position={[88, 2.8, -10]} intensity={9} distance={14} />
    </group>
  );
}

/** Torches beside the path (outside the lane) and stone lanterns along the villa lane. */
function PathLights() {
  const { torches, lanterns } = useMemo(() => {
    const torches = [];
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    let side = 1;
    for (let d = 3; d < PATH_LENGTH - 2; d += 7) {
      curve.getPointAt(d / PATH_LENGTH, p);
      curve.getTangentAt(d / PATH_LENGTH, t);
      const x = p.x + -t.z * 1.85 * side;
      const z = p.z + t.x * 1.85 * side;
      side *= -1;
      if (inRect(x, z, [-9, 1, 9, 26])) continue; // lobby and gate have their own lights
      if (x > 15 && x < 78) continue; // the lane uses stone lanterns
      if (inRect(x, z, [-14.2, -15.6, 8.2, -7.4])) continue; // not in the pool
      torches.push([x, z]);
    }
    const lanterns = [];
    for (let x = 18; x <= 76; x += 6) if (!inRect(x, 0.6, [24, 0, 36, 4])) lanterns.push([x, 0.55]);
    return { torches, lanterns };
  }, []);
  return (
    <group>
      {torches.map(([x, z], i) => (
        <Torch key={i} position={[x, 0, z]} />
      ))}
      {lanterns.map(([x, z], i) => (
        <StoneLantern key={i} position={[x, 0, z]} />
      ))}
    </group>
  );
}

/** Fireflies drifting over the gardens and terraces after dark. */
function Fireflies() {
  const { geometry, material } = useMemo(() => {
    const n = 420;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    let s = 99;
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    const zones = [[8, 0.5, 96, 14], [-28, -15, -9, 20], [-20, 23, 20, 60], [-40, -40, 140, -18]];
    for (let i = 0; i < n; i++) {
      const [x0, z0, x1, z1] = zones[i % zones.length];
      pos[i * 3] = x0 + r() * (x1 - x0);
      pos[i * 3 + 2] = z0 + r() * (z1 - z0);
      pos[i * 3 + 1] = (pos[i * 3 + 2] < EDGE_Z ? valley(pos[i * 3], pos[i * 3 + 2]).h : 0) + 0.4 + r() * 2.2;
      seed[i] = r() * 100;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { time: { value: 0 }, amount: { value: 0 }, map: { value: glowTexture() } },
      vertexShader: /* glsl */ `
        attribute float seed;
        uniform float time;
        varying float vBlink;
        void main() {
          vec3 p = position;
          p.x += sin(time * 0.35 + seed) * 0.9;
          p.y += sin(time * 0.6 + seed * 1.7) * 0.35;
          p.z += cos(time * 0.3 + seed * 0.7) * 0.9;
          vBlink = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(time * 2.2 + seed * 3.0), 3.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = 9.0 * (6.0 / max(-mv.z, 1.0)) + 1.5;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D map;
        uniform float amount;
        varying float vBlink;
        void main() {
          float a = texture2D(map, gl_PointCoord).a;
          gl_FragColor = vec4(vec3(1.0, 0.93, 0.55) * a * vBlink * amount, 1.0);
        }`,
    });
    onTime((m) => {
      material.uniforms.amount.value = THREE.MathUtils.smoothstep(m, 0.6, 1);
    });
    return { geometry, material };
  }, []);
  useFrame(() => {
    material.uniforms.time.value = TIME.t;
  });
  return <points geometry={geometry} material={material} visible frustumCulled={false} />;
}

/** Thin cables the festoon bulbs hang from. */
function Festoon({ bulbs }) {
  const geometry = useMemo(() => {
    const pts = [];
    for (let i = 1; i < bulbs.length; i++) {
      const a = bulbs[i - 1];
      const b = bulbs[i];
      if (Math.hypot(a[0] - b[0], a[2] - b[2]) > 1.5) continue; // next strand
      pts.push(a[0], a[1] + 0.05, a[2], b[0], b[1] + 0.05, b[2]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [bulbs]);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#2A2826" />
    </lineSegments>
  );
}

/** Little thatched farmers' huts (bale subak) out on the terraces. */
function ValleyHuts() {
  const huts = useMemo(
    () =>
      [[-20, 120], [35, 150], [72, 108], [118, 135], [-62, 160], [150, 175]].map(([x, d]) => {
        const z = EDGE_Z - d;
        return [x, valley(x, z).h, z];
      }),
    [],
  );
  return (
    <group>
      {huts.map((p, i) => (
        <Bale key={i} position={p} rotation-y={i * 0.7} w={2.2} d={2} height={1.8} daybed={false} />
      ))}
    </group>
  );
}
