import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Person, SKIN } from "./People";
import { haloMaterial } from "./materials";

const mats = new Map();
const mat = (color, o = {}) => {
  const key = color + JSON.stringify(o);
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o }));
  return mats.get(key);
};
const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.17, 16).rotateZ(Math.PI / 2);
const hubGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.18, 10).rotateZ(Math.PI / 2);

/**
 * Resort buggy (club car): two benches, canopy roof on four posts, faces local +z.
 * `wheels` receives the wheel meshes so a driving cart can spin them.
 */
export function GolfCart({ body = "#F4F1EA", roof = "#2F5446", seat = "#B9895A", driver, guests = [], wheels, ...props }) {
  const bodyM = mat(body);
  const roofM = mat(roof, { roughness: 0.8 });
  const seatM = mat(seat, { roughness: 0.9 });
  const darkM = mat("#2A2A2A", { roughness: 0.8 });
  const chromeM = mat("#C9CED1", { metalness: 0.8, roughness: 0.25 });
  const glassM = mat("#CFE3E8", { transparent: true, opacity: 0.25, depthWrite: false });
  const wheelPos = [[-0.6, 0.75], [0.6, 0.75], [-0.6, -0.8], [0.6, -0.8]];
  return (
    <group {...props}>
      {/* chassis and body */}
      <mesh position={[0, 0.36, 0]} material={bodyM} castShadow receiveShadow>
        <boxGeometry args={[1.12, 0.22, 2.45]} />
      </mesh>
      <mesh position={[0, 0.66, 0.98]} material={bodyM} castShadow>
        <boxGeometry args={[1.12, 0.42, 0.5]} />
      </mesh>
      <mesh position={[0, 0.9, 1.05]} rotation-x={0.35} material={bodyM}>
        <boxGeometry args={[1.08, 0.08, 0.42]} />
      </mesh>
      {[-0.38, 0.38].map((x) => (
        <mesh key={x} position={[x, 0.68, 1.24]} material={mat("#FFF6D8", { emissive: "#FFF0C8", emissiveIntensity: 0.4 })}>
          <sphereGeometry args={[0.07, 10, 8]} />
        </mesh>
      ))}
      {/* benches: front faces forward, rear faces back */}
      <mesh position={[0, 0.62, 0.1]} material={seatM} castShadow>
        <boxGeometry args={[1.04, 0.16, 0.52]} />
      </mesh>
      <mesh position={[0, 0.95, -0.17]} rotation-x={-0.12} material={seatM} castShadow>
        <boxGeometry args={[1.04, 0.5, 0.1]} />
      </mesh>
      <mesh position={[0, 0.62, -0.72]} material={seatM} castShadow>
        <boxGeometry args={[1.04, 0.16, 0.48]} />
      </mesh>
      <mesh position={[0, 0.95, -0.4]} rotation-x={0.12} material={seatM}>
        <boxGeometry args={[1.04, 0.5, 0.1]} />
      </mesh>
      <mesh position={[0, 0.48, 0.1]} material={bodyM}>
        <boxGeometry args={[1.06, 0.2, 0.5]} />
      </mesh>
      {/* steering */}
      <mesh position={[-0.28, 1.0, 0.66]} rotation-x={-0.9} material={darkM}>
        <torusGeometry args={[0.15, 0.022, 6, 18]} />
      </mesh>
      <mesh position={[-0.28, 0.85, 0.75]} rotation-x={0.6} material={darkM}>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 6]} />
      </mesh>
      {/* roof on posts, windscreen */}
      {[[-0.52, 0.86], [0.52, 0.86], [-0.52, -0.95], [0.52, -0.95]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.42, z]} material={chromeM}>
          <cylinderGeometry args={[0.022, 0.022, 1.9, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 2.06, -0.05]} material={roofM} castShadow>
        <boxGeometry args={[1.24, 0.07, 2.1]} />
      </mesh>
      <mesh position={[0, 1.6, 0.86]} material={glassM}>
        <planeGeometry args={[1.02, 0.8]} />
      </mesh>
      {/* wheels */}
      {wheelPos.map(([x, z], i) => (
        <group key={i} position={[x, 0.22, z]} ref={(g) => wheels && (wheels[i] = g)}>
          <mesh geometry={wheelGeo} material={darkM} castShadow />
          <mesh geometry={hubGeo} material={chromeM} />
        </group>
      ))}
      {/* rear luggage rack */}
      <mesh position={[0, 0.52, -1.2]} material={chromeM}>
        <boxGeometry args={[1, 0.04, 0.1]} />
      </mesh>
      {driver && (
        <Person look={{ top: "#FFFFFF", bottom: "#6B4A2E", hat: "udeng", skin: SKIN[3], sleeves: true }} pose="sit" seat={0.7} position={[-0.28, 0, 0.12]} />
      )}
      {guests.map((g, i) => (
        <Person key={i} look={g} pose="sit" seat={0.7} position={[i ? 0.28 : 0.28, 0, -0.75]} rotation-y={Math.PI} />
      ))}
    </group>
  );
}

/** A buggy driving a closed loop at a steady pace, wheels turning, lights on after dark. */
export function DrivingCart({ points, speed = 3.2, offset = 0, ...cart }) {
  const ref = useRef();
  const wheels = useMemo(() => [], []);
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, "centripetal"),
    [points],
  );
  const length = useMemo(() => curve.getLength(), [curve]);
  const s = useRef(offset * length);
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3() }), []);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    s.current = (s.current + speed * dt) % length;
    const u = s.current / length;
    curve.getPointAt(u, tmp.p);
    curve.getTangentAt(u, tmp.t);
    const g = ref.current;
    g.position.set(tmp.p.x, 0, tmp.p.z);
    g.rotation.y = Math.atan2(tmp.t.x, tmp.t.z);
    for (const w of wheels) if (w) w.rotation.x += (speed * dt) / 0.22;
  });
  return (
    <group ref={ref}>
      <GolfCart wheels={wheels} driver {...cart} />
      <sprite material={haloMaterial("#FFF2C8", 0.5)} position={[0, 0.7, 1.4]} scale={[1.6, 1.0, 1]} />
    </group>
  );
}

const guestA = { skin: SKIN[0], top: "#E8B4A0", bottom: "#F2EBDD", hair: "#C9A15A", longHair: true };
const guestB = { skin: SKIN[1], top: "#5E86A8", bottom: "#E9E1CF", hair: "#3A2A1C" };

/** Parked buggies along the drive and the lane, plus two doing the service-road loop. */
export default function Carts() {
  return (
    <group>
      {/* Buggy rank on the arrival drive */}
      <GolfCart position={[-4.9, 0, 27]} />
      <GolfCart position={[-4.9, 0, 30.4]} roof="#8A5A35" />
      <GolfCart position={[-4.9, 0, 33.8]} />
      <GolfCart position={[4.9, 0, 38]} rotation-y={Math.PI} roof="#8A5A35" driver />
      {/* Parked beside the villa lane */}
      <GolfCart position={[28.5, 0, 1.6]} rotation-y={Math.PI / 2} />
      <GolfCart position={[52.5, 0, 1.6]} rotation-y={Math.PI / 2} roof="#8A5A35" />
      <GolfCart position={[77.5, 0, 1.4]} rotation-y={-Math.PI / 2} />
      {/* Service-road loop behind the gardens */}
      <DrivingCart points={[[8, 16.3], [46, 16.3], [84, 16.3], [86, 17.5], [84, 18.7], [46, 18.7], [8, 18.7], [6, 17.5]]} offset={0} guests={[guestA]} />
      <DrivingCart points={[[8, 16.3], [46, 16.3], [84, 16.3], [86, 17.5], [84, 18.7], [46, 18.7], [8, 18.7], [6, 17.5]]} offset={0.5} roof="#8A5A35" guests={[guestB]} />
    </group>
  );
}
