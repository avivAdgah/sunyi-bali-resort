import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { M, mBox, haloMaterial } from "./materials";
import { flameTexture } from "./textures";
import { TIME, onTime } from "./time";

/**
 * Hip roof: rectangular eaves w × d at y = 0, ridge at height h. UVs run in meters with
 * v pointing up the slope, so thatch strands fall from the ridge. Includes a thick
 * thatch fringe (skirt) around the eaves.
 */
export function hipRoofGeometry(w, d, h, ridge = Math.max(0, w - d), skirt = 0.28, tile = 2) {
  const pos = [];
  const uv = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const A = V(-w / 2, 0, -d / 2);
  const B = V(w / 2, 0, -d / 2);
  const Cc = V(w / 2, 0, d / 2);
  const D = V(-w / 2, 0, d / 2);
  const R1 = V(-ridge / 2, h, 0);
  const R2 = V(ridge / 2, h, 0);
  const slopeFB = Math.hypot(h, d / 2);
  const slopeLR = Math.hypot(h, (w - ridge) / 2);
  const tri = (a, b, c, ua, ub, uc) => {
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    uv.push(...ua.map((v) => v / tile), ...ub.map((v) => v / tile), ...uc.map((v) => v / tile));
  };
  // front (+z) and back (−z)
  tri(D, Cc, R2, [-w / 2, 0], [w / 2, 0], [ridge / 2, slopeFB]);
  tri(D, R2, R1, [-w / 2, 0], [ridge / 2, slopeFB], [-ridge / 2, slopeFB]);
  tri(B, A, R1, [w / 2, 0], [-w / 2, 0], [-ridge / 2, slopeFB]);
  tri(B, R1, R2, [w / 2, 0], [-ridge / 2, slopeFB], [ridge / 2, slopeFB]);
  // hips
  tri(A, D, R1, [-d / 2, 0], [d / 2, 0], [0, slopeLR]);
  tri(Cc, B, R2, [d / 2, 0], [-d / 2, 0], [0, slopeLR]);
  // skirt
  const down = V(0, -skirt, 0);
  const ring = [A, B, Cc, D, A];
  for (let i = 0; i < 4; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    const a2 = a.clone().add(down);
    const b2 = b.clone().add(down);
    const len = a.distanceTo(b);
    tri(a2, b2, b, [0, 0], [len, 0], [len, skirt]);
    tri(a2, b, a, [0, 0], [len, skirt], [0, skirt]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

export function HipRoof({ w, d, h, ridge, y = 0, material = M.thatch, ...props }) {
  const geo = useMemo(() => hipRoofGeometry(w, d, h, ridge), [w, d, h, ridge]);
  return (
    <group {...props}>
      <mesh geometry={geo} material={material} position-y={y} castShadow receiveShadow />
    </group>
  );
}

/** Box helper with meter-tiled texture. */
export function Block({ size, tile = 1, material, cast = true, ...props }) {
  const geo = useMemo(() => mBox(size[0], size[1], size[2], tile), [size[0], size[1], size[2], tile]);
  return <mesh geometry={geo} material={material} castShadow={cast} receiveShadow {...props} />;
}

export function Post({ from = 0, to = 3, r = 0.1, material = M.teak, square = false, ...props }) {
  const h = to - from;
  return (
    <mesh material={material} castShadow position-y={from + h / 2} {...props}>
      {square ? <boxGeometry args={[r * 2, h, r * 2]} /> : <cylinderGeometry args={[r * 0.9, r, h, 8]} />}
    </mesh>
  );
}

/** Open pavilion: posts on a stone plinth, thatched hip roof, optional daybed. */
export function Bale({ w = 3, d = 3, height = 2.5, daybed = true, curtains = false, ...props }) {
  const posts = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  return (
    <group {...props}>
      <Block size={[w + 0.4, 0.45, d + 0.4]} position-y={0.225} material={M.stone} tile={0.8} />
      {posts.map(([sx, sz], i) => (
        <Post key={i} from={0.45} to={0.45 + height} square r={0.09} position={[(sx * w) / 2, 0, (sz * d) / 2]} />
      ))}
      <HipRoof w={w + 1.6} d={d + 1.6} h={2.1} ridge={0.4} y={0.45 + height} />
      {daybed && (
        <group position-y={0.45}>
          <Block size={[w - 0.3, 0.18, d - 0.3]} position-y={0.09} material={M.linen} />
          {[-0.8, 0, 0.8].map((x, i) => (
            <mesh key={i} position={[x * (w / 3), 0.38, -d / 2 + 0.35]} rotation-x={-0.25} material={i === 1 ? M.flowerYellow : M.cushion} castShadow>
              <boxGeometry args={[0.6, 0.42, 0.16]} />
            </mesh>
          ))}
        </group>
      )}
      {curtains &&
        posts.map(([sx, sz], i) => (
          <mesh key={`c${i}`} position={[(sx * w) / 2 - sx * 0.25, 0.45 + height / 2, (sz * d) / 2]} material={M.sheer}>
            <planeGeometry args={[0.5, height - 0.1]} />
          </mesh>
        ))}
    </group>
  );
}

/** Teak sun lounger with a cream cushion; the back rests toward local −z. */
export function Lounger({ color = M.cushion, ...props }) {
  return (
    <group {...props}>
      <Block size={[0.7, 0.28, 1.5]} position={[0, 0.14, 0.25]} material={M.teak} tile={0.6} />
      <Block size={[0.66, 0.08, 1.45]} position={[0, 0.32, 0.27]} material={color} />
      <group position={[0, 0.3, -0.5]} rotation-x={-0.75}>
        <Block size={[0.66, 0.08, 0.8]} position={[0, 0.02, -0.4]} material={color} />
        <Block size={[0.7, 0.06, 0.82]} position={[0, -0.04, -0.4]} material={M.teak} tile={0.6} />
      </group>
      <mesh position={[0.12, 0.38, -0.32]} rotation-x={-0.6} material={M.linen}>
        <boxGeometry args={[0.36, 0.06, 0.25]} />
      </mesh>
    </group>
  );
}

/** Pool umbrella: cream canvas cone with a fringe. */
export function Parasol({ color = "#F3EAD8", ...props }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide }), [color]);
  return (
    <group {...props}>
      <Post to={2.5} r={0.035} material={M.lightWood} />
      <mesh position-y={2.55} material={mat} castShadow>
        <coneGeometry args={[1.5, 0.55, 12, 1, true]} />
      </mesh>
      <mesh position-y={2.2} material={mat}>
        <cylinderGeometry args={[1.5, 1.5, 0.18, 12, 1, true]} />
      </mesh>
    </group>
  );
}

/** Balinese ceremonial umbrella (tedung): tall pole, tiered canopy and a long fringe. */
export function Tedung({ color = "#E9B830", ...props }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.8, side: THREE.DoubleSide }), [color]);
  return (
    <group {...props}>
      <Post to={3.3} r={0.04} material={M.black} />
      <mesh position-y={3.25} material={mat} castShadow>
        <coneGeometry args={[0.75, 0.35, 16, 1, true]} />
      </mesh>
      <mesh position-y={2.85} material={mat}>
        <cylinderGeometry args={[0.75, 0.78, 0.45, 16, 1, true]} />
      </mesh>
      <mesh position-y={3.48} material={M.brass}>
        <coneGeometry args={[0.06, 0.25, 8]} />
      </mesh>
    </group>
  );
}

/** Stone guardian statue wrapped in a black-and-white poleng sarong, on a plinth. */
export function Guardian(props) {
  return (
    <group {...props}>
      <Block size={[0.9, 0.9, 0.9]} position-y={0.45} material={M.stone} tile={0.5} />
      <Block size={[1.05, 0.1, 1.05]} position-y={0.95} material={M.stone} tile={0.5} />
      <mesh position-y={1.45} material={M.poleng} castShadow>
        <cylinderGeometry args={[0.32, 0.4, 0.9, 12]} />
      </mesh>
      <mesh position-y={2.05} material={M.darkStone} castShadow>
        <cylinderGeometry args={[0.24, 0.3, 0.55, 10]} />
      </mesh>
      <mesh position-y={2.5} material={M.darkStone} castShadow>
        <sphereGeometry args={[0.22, 12, 10]} />
      </mesh>
      <mesh position-y={2.82} material={M.darkStone}>
        <coneGeometry args={[0.16, 0.36, 8]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.33, 2.0, 0.08]} rotation-z={s * 0.25} material={M.darkStone}>
          <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 2.35, 0.2]} material={M.flowerRed}>
        <sphereGeometry args={[0.06, 8, 6]} />
      </mesh>
    </group>
  );
}

/** Penjor: tall bamboo pole arching over the road with a hanging ornament. */
export function Penjor({ flip = false, ...props }) {
  const geo = useMemo(() => {
    const s = flip ? -1 : 1;
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 8.5, 0), new THREE.Vector3(s * 2.6, 6.4, 0));
    return { tube: new THREE.TubeGeometry(c, 24, 0.07, 6), tip: c.getPoint(1) };
  }, [flip]);
  return (
    <group {...props}>
      <mesh geometry={geo.tube} material={M.bamboo} castShadow />
      <group position={geo.tip}>
        <mesh position-y={-0.35} material={M.bamboo}>
          <coneGeometry args={[0.22, 0.7, 8]} />
        </mesh>
        <mesh position-y={-0.85} material={M.flowerYellow}>
          <sphereGeometry args={[0.12, 8, 6]} />
        </mesh>
      </group>
      {[1.8, 2.6, 3.4].map((y) => (
        <mesh key={y} position-y={y} material={M.leaf}>
          <cylinderGeometry args={[0.16, 0.08, 0.35, 8, 1, true]} />
        </mesh>
      ))}
      <Block size={[0.5, 0.5, 0.5]} position-y={0.25} material={M.bamboo} />
    </group>
  );
}

// ---------- Lights at night ----------

const flameMat = new THREE.SpriteMaterial({ map: flameTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
onTime((m) => {
  flameMat.opacity = THREE.MathUtils.smoothstep(m, 0.3, 0.8);
  flameMat.visible = flameMat.opacity > 0.01;
});
const flames = new Set();

/** Bamboo obor torch; lit at night with a flickering flame and a warm halo. */
export function Torch(props) {
  const flame = useRef();
  return (
    <group {...props}>
      <Post to={1.9} r={0.045} material={M.bamboo} />
      <mesh position-y={1.95} material={M.black}>
        <cylinderGeometry args={[0.09, 0.06, 0.16, 8]} />
      </mesh>
      <sprite
        ref={(s) => {
          if (s) flames.add(s);
          else flames.delete(flame.current);
          flame.current = s;
        }}
        material={flameMat}
        position-y={2.22}
        scale={[0.28, 0.5, 1]}
      />
      <sprite material={haloMaterial("#FF9A3C", 0.6)} position-y={2.2} scale={[2.2, 2.2, 1]} />
    </group>
  );
}

/** Flickers every torch flame from one frame loop. */
export function FlameFlicker() {
  useFrame(() => {
    if (TIME.mix < 0.3) return;
    const t = TIME.t;
    for (const f of flames) {
      const k = f.id * 1.7;
      const s = 0.85 + Math.sin(t * 9 + k) * 0.08 + Math.sin(t * 23 + k * 2) * 0.06;
      f.scale.set(0.28 * (2 - s), 0.5 * s, 1);
    }
  });
  return null;
}

/** Carved stone lamp post (candi style) with a glowing lantern on top. */
export function StoneLantern({ halo = true, ...props }) {
  return (
    <group {...props}>
      <Block size={[0.36, 0.9, 0.36]} position-y={0.45} material={M.stone} tile={0.4} />
      <Block size={[0.46, 0.08, 0.46]} position-y={0.94} material={M.stone} tile={0.4} />
      <mesh position-y={1.16} material={M.lamp}>
        <boxGeometry args={[0.28, 0.36, 0.28]} />
      </mesh>
      <mesh position-y={1.42} material={M.darkStone} castShadow>
        <coneGeometry args={[0.34, 0.3, 4]} />
      </mesh>
      {halo && <sprite material={haloMaterial("#FFC778", 0.75)} position-y={1.16} scale={[1.8, 1.8, 1]} />}
    </group>
  );
}

/** Woven rattan pendant lamp. */
export function Pendant({ drop = 1, size = 0.32, ...props }) {
  return (
    <group {...props}>
      <mesh position-y={-drop / 2} material={M.black}>
        <cylinderGeometry args={[0.008, 0.008, drop, 4]} />
      </mesh>
      <mesh position-y={-drop - size * 0.4} material={M.lamp} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[size, 14, 10]} />
      </mesh>
      <sprite material={haloMaterial("#FFC778", 0.55)} position-y={-drop - size * 0.4} scale={[size * 6, size * 6, 1]} />
    </group>
  );
}

/** Canang sari: little palm-leaf offering tray with flowers, left on steps every morning. */
export function Canang(props) {
  return (
    <group {...props}>
      <mesh position-y={0.025} material={M.leaf}>
        <boxGeometry args={[0.16, 0.05, 0.16]} />
      </mesh>
      {[M.flowerRed, M.flowerYellow, M.white, M.flowerRed].map((m, i) => (
        <mesh key={i} position={[((i % 2) - 0.5) * 0.07, 0.065, (Math.floor(i / 2) - 0.5) * 0.07]} material={m}>
          <sphereGeometry args={[0.03, 6, 5]} />
        </mesh>
      ))}
    </group>
  );
}

/** Big terracotta urn with a plant. */
export function Urn({ plant = true, ...props }) {
  const geo = useMemo(() => {
    const pts = [[0, 0], [0.28, 0], [0.45, 0.25], [0.5, 0.5], [0.4, 0.8], [0.3, 0.9], [0.34, 0.95]].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 18);
  }, []);
  return (
    <group {...props}>
      <mesh geometry={geo} material={M.terracotta} castShadow />
      {plant && (
        <mesh position-y={1.15} material={M.leaf} scale={[1, 0.8, 1]} castShadow>
          <icosahedronGeometry args={[0.45, 1]} />
        </mesh>
      )}
    </group>
  );
}
