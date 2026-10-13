import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useStore } from "../store";
import { TIME, setMix, ramp, lerp } from "./time";
import { cloudTexture } from "./textures";

const C = (hex) => new THREE.Color(hex);
const PAL = {
  top: [C("#3F8FD6"), C("#40518F"), C("#040916")],
  horizon: [C("#CFE2EA"), C("#F3A66C"), C("#121D3A")],
  fog: [C("#C7DAE0"), C("#D99B78"), C("#0D1630")],
  sun: [C("#FFF3DC"), C("#FF9A4D"), C("#93A9E6")],
  hemiSky: [C("#D7EBFF"), C("#F2B98F"), C("#2B3B6B")],
  hemiGround: [C("#71904C"), C("#6A4E3A"), C("#0B120E")],
  cloud: [C("#FFFFFF"), C("#FFC49B"), C("#2A3556")],
};
const SUN_DAY = new THREE.Vector3(0.38, 0.82, -0.42).normalize();
const SUN_DUSK = new THREE.Vector3(-0.42, 0.05, -1).normalize();
const MOON = new THREE.Vector3(0.45, 0.5, -0.74).normalize();

const smooth = (t) => t * t * (3 - 2 * t);

/**
 * Sky dome, stars, clouds, sun/moon light, fog and exposure, all driven by the
 * day ↔ night blend. The blend runs for about two seconds, passing through a
 * Balinese sunset on the way.
 */
export default function DayNight() {
  const { scene, camera, gl } = useThree();
  const sun = useRef();
  const hemi = useRef();
  const ambient = useRef();
  const sky = useRef();
  const stars = useRef();
  const clouds = useRef();
  const s = useRef({ lin: useStore.getState().night ? 1 : 0, mix: -1 }).current;
  const tmp = useMemo(() => ({ c: new THREE.Color(), v: new THREE.Vector3() }), []);

  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color() },
          horizon: { value: new THREE.Color() },
          sunDir: { value: new THREE.Vector3() },
          sunColor: { value: new THREE.Color() },
          sunAmt: { value: 1 },
          moonDir: { value: MOON.clone() },
          moonAmt: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 top, horizon, sunDir, sunColor, moonDir;
          uniform float sunAmt, moonAmt;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 col = mix(horizon, top, pow(clamp(h, 0.0, 1.0), 0.5));
            if (h < 0.0) col = horizon * 0.9;
            float s = max(dot(d, sunDir), 0.0);
            col += sunColor * (smoothstep(0.9992, 0.9996, s) * 6.0 + pow(s, 14.0) * 0.45 + pow(s, 3.0) * 0.12) * sunAmt;
            float m = max(dot(d, moonDir), 0.0);
            col += vec3(0.92, 0.94, 1.0) * (smoothstep(0.99955, 0.9998, m) * 1.6 + pow(m, 90.0) * 0.18) * moonAmt;
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );

  const starGeo = useMemo(() => {
    const pos = [];
    for (let i = 0; i < 1600; i++) {
      const u = Math.random() * Math.PI * 2;
      const y = 0.06 + Math.random() * 0.94;
      const r = Math.sqrt(1 - y * y);
      pos.push(Math.cos(u) * r * 1500, y * 1500, Math.sin(u) * r * 1500);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);

  const cloudList = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = -Math.PI * 0.95 + (i / 16) * Math.PI * 1.9 + Math.random() * 0.2;
        const el = 0.05 + Math.random() * 0.16;
        return { pos: [Math.sin(a) * 1300, el * 1300 + 40, -Math.cos(a) * 1300], scale: 260 + Math.random() * 260 };
      }),
    [],
  );
  const cloudMat = useMemo(() => new THREE.SpriteMaterial({ map: cloudTexture(), transparent: true, depthWrite: false, fog: false }), []);

  function apply(mix) {
    const u = skyMat.uniforms;
    ramp(u.top.value, ...PAL.top, mix);
    ramp(u.horizon.value, ...PAL.horizon, mix);
    ramp(u.sunColor.value, ...PAL.sun, Math.min(mix, 0.5));
    const sunDir = tmp.v.copy(SUN_DAY).lerp(SUN_DUSK, smooth(Math.min(mix * 1.8, 1))).normalize();
    if (mix > 0.62) sunDir.y -= (mix - 0.62) * 0.6; // the sun sinks below the horizon
    u.sunDir.value.copy(sunDir).normalize();
    u.sunAmt.value = 1 - THREE.MathUtils.smoothstep(mix, 0.55, 0.75);
    u.moonAmt.value = THREE.MathUtils.smoothstep(mix, 0.6, 0.95);

    if (scene.fog) {
      ramp(scene.fog.color, ...PAL.fog, mix);
      scene.fog.near = lerp(140, 50, mix);
      scene.fog.far = lerp(760, 420, mix);
    }
    scene.environmentIntensity = lerp(0.55, 0.08, mix);
    gl.toneMappingExposure = lerp(1.0, 1.35, mix);

    const light = sun.current;
    if (mix < 0.5) {
      light.userData.dir = u.sunDir.value.clone();
      ramp(light.color, ...PAL.sun, mix);
      light.intensity = lerp(3.0, 1.1, smooth(mix * 2));
    } else {
      light.userData.dir = MOON.clone();
      light.color.copy(PAL.sun[2]);
      light.intensity = lerp(0.12, 0.55, smooth((mix - 0.5) * 2));
    }
    ramp(hemi.current.color, ...PAL.hemiSky, mix);
    ramp(hemi.current.groundColor, ...PAL.hemiGround, mix);
    hemi.current.intensity = lerp(1.0, 0.55, mix);
    ambient.current.intensity = lerp(0.12, 0.08, mix);

    stars.current.material.opacity = THREE.MathUtils.smoothstep(mix, 0.55, 1);
    stars.current.visible = mix > 0.5;
    ramp(cloudMat.color, ...PAL.cloud, mix);
    cloudMat.opacity = lerp(0.85, 0.35, mix);
  }

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    TIME.t += dt;
    const target = useStore.getState().night ? 1 : 0;
    s.lin += THREE.MathUtils.clamp(target - s.lin, -dt * 0.5, dt * 0.5);
    const mix = smooth(s.lin);
    if (mix !== s.mix) {
      s.mix = mix;
      setMix(mix);
      apply(mix);
    }
    sky.current.position.copy(camera.position);
    stars.current.position.copy(camera.position);
    clouds.current.position.set(camera.position.x, 0, camera.position.z);

    const light = sun.current;
    const dir = light.userData.dir || SUN_DAY;
    light.position.copy(camera.position).addScaledVector(dir, 60);
    light.target.position.copy(camera.position);
    light.target.updateMatrixWorld();
  });

  return (
    <>
      <mesh ref={sky} material={skyMat} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[1800, 32, 16]} />
      </mesh>
      <points ref={stars} geometry={starGeo} frustumCulled={false} renderOrder={-9}>
        <pointsMaterial size={2.2} sizeAttenuation={false} color="#F4F6FF" transparent opacity={0} depthWrite={false} fog={false} />
      </points>
      <group ref={clouds}>
        {cloudList.map((c, i) => (
          <sprite key={i} material={cloudMat} position={c.pos} scale={[c.scale, c.scale * 0.42, 1]} renderOrder={-8} />
        ))}
      </group>
      <hemisphereLight ref={hemi} />
      <ambientLight ref={ambient} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={130}
      />
    </>
  );
}
