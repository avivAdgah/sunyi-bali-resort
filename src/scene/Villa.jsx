import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PLOT_Z, PLOT_W, DOOR_X } from "../data/villas";
import { useStore } from "../store";
import { M } from "./materials";
import { Block, HipRoof, Post, Lounger, Torch, StoneLantern, Pendant, Canang, Urn, Bale, Parasol } from "./Parts";
import { KitModel } from "./Model";
import { villaSignTexture } from "./textures";
import { onTime, lerp } from "./time";

const FLOOR = 0.25; // top of the plinth
const WALL_H = 3;
const B = { x0: -4.2, x1: 4.2, back: -2.6, front: -8.2 }; // building footprint (plot-local)

/** One villa plot: garden wall and gate, the house with its interior, terrace and pool. */
export default function Villa({ villa }) {
  const rustic = villa.style === "rustic";
  const select = (e) => {
    e.stopPropagation();
    const s = useStore.getState();
    if (!s.entered || s.tour?.villaId === villa.id) return;
    s.openTour(villa.id);
  };
  const hover = (on) => (e) => {
    e.stopPropagation();
    const s = useStore.getState();
    if (s.tour) return;
    s.setHoveredVilla(on ? villa.id : null);
    document.body.dataset.hover = on ? "villa" : "";
  };
  return (
    <group position={[villa.x, 0, PLOT_Z]}>
      <Garden villa={villa} rustic={rustic} />
      <group onClick={select} onPointerOver={hover(true)} onPointerOut={hover(false)}>
        <Sign villa={villa} />
        <House villa={villa} rustic={rustic} />
      </group>
      <Interior villa={villa} rustic={rustic} />
      <Outdoor villa={villa} rustic={rustic} />
      <NightLight position={[-0.8, 2.7, -5.2]} />
    </group>
  );
}

function Sign({ villa }) {
  const hovered = useStore((s) => s.hoveredVilla === villa.id);
  const map = villaSignTexture(villa, hovered);
  return (
    <group position={[DOOR_X - 2.6, 0, -0.05]} rotation-y={-0.32}>
      <Post from={0} to={1.25} r={0.05} square position-x={-0.7} />
      <Post from={0} to={1.25} r={0.05} square position-x={0.7} />
      <mesh position-y={1.62}>
        <planeGeometry args={[1.7, 1.06]} />
        <meshStandardMaterial map={map} roughness={0.7} emissive="#FFFFFF" emissiveMap={map} emissiveIntensity={hovered ? 0.35 : 0.12} />
      </mesh>
      <mesh position={[0, 1.62, -0.03]} material={M.teak}>
        <boxGeometry args={[1.8, 1.14, 0.04]} />
      </mesh>
    </group>
  );
}

/** Low garden walls, the carved gate (angkul-angkul), stepping stones and garden ornaments. */
function Garden({ villa, rustic }) {
  const wallMat = rustic ? M.brick : M.stone;
  const gateL = DOOR_X - 1.1;
  const gateR = DOOR_X + 1.1;
  const half = PLOT_W / 2;
  return (
    <group>
      {/* front wall either side of the gate */}
      <Block size={[gateL + half, 1, 0.3]} position={[(-half + gateL) / 2, 0.5, -0.2]} material={wallMat} tile={1.2} />
      <Block size={[half - gateR, 1, 0.3]} position={[(gateR + half) / 2, 0.5, -0.2]} material={wallMat} tile={1.2} />
      {/* side walls down to the cliff */}
      {[-half + 0.15, half - 0.15].map((x) => (
        <Block key={x} size={[0.3, 0.9, 12.8]} position={[x, 0.45, -6.6]} material={wallMat} tile={1.2} />
      ))}
      {/* gate pillars and roof */}
      {[-0.85, 0.85].map((dx) => (
        <group key={dx} position={[DOOR_X + dx, 0, -0.2]}>
          <Block size={[0.5, 2.5, 0.55]} position-y={1.25} material={wallMat} tile={1.2} />
          <Block size={[0.62, 0.14, 0.66]} position-y={2.55} material={M.stone} tile={0.6} />
        </group>
      ))}
      {rustic ? (
        <HipRoof w={2.9} d={1.5} h={0.9} ridge={1.2} y={2.75} position={[DOOR_X, 0, -0.2]} />
      ) : (
        <Block size={[2.6, 0.18, 1.1]} position={[DOOR_X, 2.72, -0.2]} material={M.stone} tile={0.6} />
      )}
      {/* open carved doors swung inward */}
      {[-1, 1].map((s) => (
        <group key={s} position={[DOOR_X + s * 0.6, 0, -0.35]} rotation-y={s * 1.35}>
          <Block size={[0.6, 2.1, 0.06]} position={[-s * 0.3, 1.05, 0]} material={M.teak} tile={0.6} />
        </group>
      ))}
      <Torch position={[DOOR_X - 1.35, 0, 0.1]} />
      <Torch position={[DOOR_X + 1.35, 0, 0.1]} />
      <Canang position={[DOOR_X + 0.3, 0.02, -0.05]} rotation-y={0.4} />
      {/* stepping stones to the front door */}
      {[-0.75, -1.45, -2.1].map((z) => (
        <Block key={z} size={[0.9, 0.06, 0.5]} position={[DOOR_X, 0.03, z]} material={M.stone} tile={0.6} cast={false} />
      ))}
      <Urn position={[-2.2, 0, -1.6]} scale={0.9} />
      <StoneLantern position={[DOOR_X + 1.6, 0, -1.4]} halo={false} />
    </group>
  );
}

/** Plinth, walls, glass front and roof. Rustic: teak and alang-alang thatch. Modern: render, paras stone, flat roof. */
function House({ villa, rustic }) {
  const wall = rustic ? M.teak : M.render;
  const glassSides = villa.id === "cliff-infinity-villa";
  const y = FLOOR + WALL_H / 2;
  const doorL = DOOR_X - 0.55;
  const doorR = DOOR_X + 0.55;
  const depth = B.back - B.front;
  const cz = (B.back + B.front) / 2;
  return (
    <group>
      <Block size={[9.2, FLOOR, 6.4]} position={[0, FLOOR / 2, cz - 0.3]} material={M.stone} tile={0.8} />
      <Block size={[8.4, 0.01, depth]} position={[0, FLOOR + 0.005, cz]} material={rustic ? M.terracotta : M.terrazzo} tile={rustic ? 1.6 : 2.4} cast={false} />
      {/* back wall with the door */}
      <Block size={[doorL - B.x0, WALL_H, 0.2]} position={[(B.x0 + doorL) / 2, y, B.back]} material={wall} tile={1.5} />
      <Block size={[B.x1 - doorR, WALL_H, 0.2]} position={[(doorR + B.x1) / 2, y, B.back]} material={wall} tile={1.5} />
      <Block size={[1.1, WALL_H - 2.3, 0.2]} position={[DOOR_X, FLOOR + 2.3 + (WALL_H - 2.3) / 2, B.back]} material={wall} tile={1.5} />
      {!rustic && <Block size={[3.5, 2.6, 0.04]} position={[-1.5, FLOOR + 1.3, B.back - 0.12]} material={M.stone} tile={0.8} />}
      {/* side walls (all glass in the cliff villa) */}
      {[B.x0, B.x1].map((x) =>
        glassSides ? (
          <mesh key={x} position={[x, y, cz]} rotation-y={Math.PI / 2} material={M.glass}>
            <planeGeometry args={[depth, WALL_H]} />
          </mesh>
        ) : (
          <Block key={x} size={[0.2, WALL_H, depth]} position={[x, y, cz]} material={wall} tile={1.5} />
        ),
      )}
      {/* bathroom partition */}
      <Block size={[0.14, 2.4, 2.9]} position={[2, FLOOR + 1.2, B.back - 1.45]} material={rustic ? M.lightWood : M.stone} tile={0.8} />
      {/* glass front with mullions */}
      <mesh position={[0, y, B.front]} material={M.glass}>
        <planeGeometry args={[8.4, WALL_H]} />
      </mesh>
      {[-4.2, -2.1, 0, 2.1, 4.2].map((x) => (
        <Block key={x} size={[0.08, WALL_H, 0.1]} position={[x, y, B.front]} material={rustic ? M.teak : M.black} />
      ))}
      <Block size={[8.5, 0.1, 0.12]} position={[0, FLOOR + WALL_H - 0.05, B.front]} material={rustic ? M.teak : M.black} />
      {rustic ? (
        <>
          {[[B.x0, B.front], [B.x1, B.front], [B.x0, B.back], [B.x1, B.back], [-4.2, -9.6], [4.2, -9.6]].map(([x, z], i) => (
            <Post key={i} from={FLOOR} to={FLOOR + WALL_H} r={0.13} position={[x, 0, z]} />
          ))}
          {[-1.6, 1.6].map((x) => (
            <Block key={x} size={[0.16, 0.2, 7]} position={[x, FLOOR + WALL_H - 0.1, cz - 0.6]} material={M.teak} />
          ))}
          <HipRoof w={11} d={9.2} h={3.4} ridge={2.4} y={FLOOR + WALL_H} position-z={cz - 0.9} />
        </>
      ) : (
        <>
          <Block size={[10.4, 0.32, 8.4]} position={[0, FLOOR + WALL_H + 0.16, cz - 1]} material={M.render} tile={2} />
          <Block size={[10.2, 0.03, 8.2]} position={[0, FLOOR + WALL_H - 0.015, cz - 1]} material={M.lightWood} tile={1.2} cast={false} />
          <Block size={[10.5, 0.12, 8.5]} position={[0, FLOOR + WALL_H + 0.36, cz - 1]} material={M.lightWood} tile={1.5} />
          {[-4.9, 4.9].map((x) => (
            <Post key={x} from={FLOOR} to={FLOOR + WALL_H} r={0.09} square material={M.render} position={[x, 0, -10]} />
          ))}
        </>
      )}
    </group>
  );
}

function Interior({ villa, rustic }) {
  const f = FLOOR;
  const family = villa.guests > 2;
  return (
    <group>
      {/* bed with the headboard against the back wall */}
      <KitModel model="rugRectangle" position={[-1.5, f + 0.005, -4.4]} rotation-y={Math.PI / 2} scale={1.1} colors={{ carpet: "#D9CDB6", carpetDarker: "#B9A88A" }} />
      <KitModel model="bedDouble" position={[-1.5, f, -3.85]} rotation-y={Math.PI} colors={{ carpetWhite: "#FBF8F1", carpet: rustic ? "#C9A27A" : "#9FB3A6", wood: rustic ? "#6E4527" : "#D9C3A0" }} />
      {rustic ? <Canopy /> : <Block size={[2.6, 1.2, 0.08]} position={[-1.5, f + 0.95, B.back - 0.16]} material={M.lightWood} tile={0.8} />}
      {[-3.05, 0.05].map((x) => (
        <group key={x}>
          <KitModel model="cabinetBedDrawerTable" position={[x, f, -2.95]} rotation-y={Math.PI} colors={{ wood: rustic ? "#6E4527" : "#D9C3A0" }} />
          {rustic ? <KitModel model="lampRoundTable" position={[x, f + 0.56, -2.95]} /> : <Pendant position={[x, f + WALL_H, -3]} drop={1.6} size={0.16} />}
        </group>
      ))}
      <KitModel model="pillowLong" position={[-1.5, f + 0.55, -2.95]} rotation-x={-0.25} scale={1.2} colors={{ carpet: villa.accent }} />
      {/* lounge facing the view */}
      <KitModel model="rugRound" position={[-2.5, f + 0.005, -7.1]} colors={{ carpet: "#CDBB98", carpetDarker: "#A88F6A" }} />
      <KitModel model={family ? "loungeSofa" : "loungeDesignChair"} position={[-2.6, f, -6.55]} rotation-y={Math.PI} colors={{ carpet: villa.accent, carpetBlue: villa.accent, wood: "#6E4527" }} />
      <KitModel model="tableCoffee" position={[-2.6, f, -7.45]} scale={0.7} />
      <KitModel model="lampRoundFloor" position={[-3.85, f, -5.7]} />
      <KitModel model="pottedPlant" position={[1.6, f, -7.75]} scale={1.4} />
      <KitModel model="books" position={[-2.45, f + 0.33, -7.45]} />
      {rustic && <Pendant position={[-1.5, FLOOR + WALL_H + 1.4, -5.2]} drop={1.4} size={0.42} />}
      {/* bathroom: freestanding tub facing the glass, double vanity */}
      <Tub position={[3.15, f, -6.9]} />
      <Block size={[0.6, 0.12, 1.8]} position={[3.85, f + 0.85, -3.9]} material={rustic ? M.teak : M.terrazzo} tile={0.8} />
      <Block size={[0.5, 0.75, 1.7]} position={[3.88, f + 0.42, -3.9]} material={rustic ? M.lightWood : M.lightWood} tile={0.8} />
      {[-3.4, -4.4].map((z) => (
        <mesh key={z} position={[3.82, f + 0.95, z]} material={M.white}>
          <cylinderGeometry args={[0.2, 0.14, 0.12, 16]} />
        </mesh>
      ))}
      <mesh position={[4.08, f + 1.75, -3.9]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[1.5, 0.9]} />
        <meshStandardMaterial color="#DDE6E8" metalness={0.9} roughness={0.08} />
      </mesh>
      <KitModel model="plantSmall2" position={[3.85, f + 0.91, -4.75]} />
      <Canang position={[DOOR_X, f + 0.02, B.back - 0.4]} />
    </group>
  );
}

/** Four-poster teak canopy with sheer mosquito-net drapes. */
function Canopy() {
  const f = FLOOR;
  const corners = [[-2.6, -2.75], [-0.4, -2.75], [-0.4, -5.0], [-2.6, -5.0]];
  return (
    <group>
      {corners.map(([x, z], i) => (
        <Post key={i} from={f} to={f + 2.35} r={0.05} square position={[x, 0, z]} />
      ))}
      <Block size={[2.3, 0.08, 0.08]} position={[-1.5, f + 2.35, -2.75]} material={M.teak} />
      <Block size={[2.3, 0.08, 0.08]} position={[-1.5, f + 2.35, -5.0]} material={M.teak} />
      <Block size={[0.08, 0.08, 2.3]} position={[-2.6, f + 2.35, -3.87]} material={M.teak} />
      <Block size={[0.08, 0.08, 2.3]} position={[-0.4, f + 2.35, -3.87]} material={M.teak} />
      {[[-2.6, -3.87, Math.PI / 2], [-0.4, -3.87, Math.PI / 2]].map(([x, z, ry], i) => (
        <mesh key={i} position={[x, f + 1.3, z]} rotation-y={ry} material={M.sheer}>
          <planeGeometry args={[2.25, 2.1]} />
        </mesh>
      ))}
      {[-2.4, -0.6].map((x) => (
        <mesh key={x} position={[x, f + 1.3, -5.0]} material={M.sheer}>
          <planeGeometry args={[0.45, 2.1]} />
        </mesh>
      ))}
    </group>
  );
}

/** Freestanding oval bathtub: a lathed shell (outer wall, rolled rim, inner basin) filled with water. */
const tubGeometry = new THREE.LatheGeometry(
  [[0, 0.02], [0.86, 0.02], [0.97, 0.3], [1, 0.56], [0.95, 0.6], [0.88, 0.56], [0.8, 0.2], [0.6, 0.12], [0, 0.12]].map(([r, y]) => new THREE.Vector2(r, y)),
  40,
);

function Tub(props) {
  return (
    <group {...props}>
      <mesh geometry={tubGeometry} scale={[0.44, 1, 0.9]} material={M.white} castShadow receiveShadow />
      <mesh position-y={0.46} rotation-x={-Math.PI / 2} scale={[0.37, 0.78, 1]}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial color="#A8DCDF" roughness={0.04} metalness={0.25} transparent opacity={0.85} />
      </mesh>
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x * 2.4, 0.48, 0.05]} material={M.flowerRed}>
          <sphereGeometry args={[0.035, 6, 5]} />
        </mesh>
      ))}
    </group>
  );
}

/** Terrace deck, loungers beside the pool, a daybed bale for the pond villa, lanterns. */
function Outdoor({ villa, rustic }) {
  const deck = rustic ? M.deck : M.stone;
  const poolX1 = villa.pool ? -4.6 + villa.pool.w : 0;
  const loungers = villa.pool ? (villa.pool.w <= 5.2 ? [poolX1 + 1.05, poolX1 + 2.05] : [poolX1 + 0.9]) : [];
  return (
    <group>
      <Block size={[9.2, 0.06, 1.7]} position={[0, 0.03, -9.05]} material={deck} tile={1.2} cast={false} />
      {loungers.map((x) => (
        <Lounger key={x} position={[x, 0, -11.6]} rotation-y={Math.PI} />
      ))}
      {villa.pool && villa.pool.w <= 5.2 && <Parasol position={[poolX1 + 3.2, 0, -10.6]} />}
      {villa.pond && <Bale position={[2.6, 0, -11]} w={2.2} d={2.2} height={2.1} />}
      <StoneLantern position={[-4.9, 0, -9.3]} />
      <StoneLantern position={[4.9, 0, -9.3]} />
      <Urn position={[4.7, 0, -12.6]} scale={0.8} />
    </group>
  );
}

/** Warm interior light that only shines after dark. */
export function NightLight({ intensity = 9, distance = 11, color = "#FFB866", ...props }) {
  const ref = useRef();
  useEffect(
    () =>
      onTime((m) => {
        if (ref.current) ref.current.intensity = lerp(0, intensity, THREE.MathUtils.smoothstep(m, 0.3, 0.9));
      }),
    [intensity],
  );
  return <pointLight ref={ref} color={color} distance={distance} decay={1.6} intensity={0} {...props} />;
}

export { FLOOR as VILLA_FLOOR };
