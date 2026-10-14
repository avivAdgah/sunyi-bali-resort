import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useStore, exitsHere } from "../store";
import { VILLA_BY_ID } from "../data/villas";
import { photoUrl, depthUrl } from "../data/photos";

/*
 * A villa room you can walk into. Each room is one real photo raised into 3D with its
 * depth map: a dense grid is pushed back pixel by pixel to where that part of the room
 * sits, so moving the camera gives true parallax (the bed slides past the far wall).
 * Where the photo has no information (behind a chair, beyond the frame) a second, blurred
 * and slightly larger copy fills in softly instead of showing black.
 */

const HALF_FOV = THREE.MathUtils.degToRad(36); // assumed half field of view across the photo's long side
const NEAR = 1.3; // metres to the nearest thing in a room photo
const FAR = 9; // metres to the farthest
const WALK_MAX = 0.85; // how far you can walk into a room (metres)
const YAW_MAX = 0.24; // how far you can turn your head (radians)
const PITCH_MAX = 0.14;
const STEP_TIME = 1.5; // seconds to walk through to the next room

/** Shared input written by the HUD buttons and read every frame. */
export const roomInput = { walk: 0 };

const vertexShader = /* glsl */ `
  uniform sampler2D depthMap;
  uniform vec2 tanHalf;
  uniform float lod;
  uniform float extend;
  uniform float push;
  varying vec2 vUv;
  varying float vStretch;
  vec2 mirror(vec2 uv) { return 1.0 - abs(1.0 - mod(abs(uv), 2.0)); }
  float distAt(vec2 uv) {
    float d = textureLod(depthMap, mirror(uv), lod).r;
    return 1.0 / (d / ${NEAR.toFixed(2)} + (1.0 - d) / ${FAR.toFixed(1)});
  }
  void main() {
    vec2 uv = (uv - 0.5) * (1.0 + 2.0 * extend) + 0.5;
    vUv = uv;
    float z = distAt(uv) * push;
    vec2 e = vec2(1.5 / 256.0);
    float dz = abs(distAt(uv + vec2(e.x, 0.0)) - distAt(uv - vec2(e.x, 0.0))) + abs(distAt(uv + vec2(0.0, e.y)) - distAt(uv - vec2(0.0, e.y)));
    vStretch = dz / z;
    vec3 p = vec3((uv.x - 0.5) * 2.0 * tanHalf.x * z, (uv.y - 0.5) * 2.0 * tanHalf.y * z, -z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float opacity;
  uniform float cut;
  uniform float blur;
  varying vec2 vUv;
  varying float vStretch;
  vec2 mirror(vec2 uv) { return 1.0 - abs(1.0 - mod(abs(uv), 2.0)); }
  void main() {
    if (vStretch > cut) discard;
    vec3 c = texture2D(map, mirror(vUv), blur).rgb;
    // Beyond the photo the room fades into a soft, darker periphery.
    vec2 out2 = max(-vUv, vUv - 1.0);
    c *= 1.0 - 0.55 * smoothstep(0.0, 0.3, max(out2.x, out2.y));
    gl_FragColor = vec4(c, opacity);
    #include <colorspace_fragment>
  }
`;

// ---- Textures, loaded once per photo and shared ----
const cache = new Map();
const loader = new THREE.TextureLoader();
function loadRoom(id) {
  if (!cache.has(id)) {
    const load = (url, srgb) =>
      new Promise((resolve) =>
        loader.load(url, (t) => {
          if (srgb) t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 4;
          resolve(t);
        }, undefined, () => resolve(null)),
      );
    cache.set(id, Promise.all([load(photoUrl(id), true), load(depthUrl(id), false)]).then(([map, depth]) => ({ map, depth })));
  }
  return cache.get(id);
}

/** One room: the sharp depth surface and the soft fill behind it. */
function Room({ tex, slot }) {
  const { map, depth } = tex;
  const aspect = map.image.width / map.image.height;
  const tanHalf = useMemo(() => {
    const t = Math.tan(HALF_FOV);
    return aspect >= 1 ? new THREE.Vector2(t, t / aspect) : new THREE.Vector2(t * aspect, t);
  }, [aspect]);
  const grid = (n) => new THREE.PlaneGeometry(1, 1, aspect >= 1 ? n : Math.round(n * aspect), aspect >= 1 ? Math.round(n / aspect) : n);
  const geometry = useMemo(() => grid(320), [aspect]); // eslint-disable-line react-hooks/exhaustive-deps
  const fillGeometry = useMemo(() => grid(96), [aspect]); // eslint-disable-line react-hooks/exhaustive-deps
  const make = (fill) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: !fill,
      uniforms: {
        map: { value: map },
        depthMap: { value: depth },
        tanHalf: { value: tanHalf },
        lod: { value: fill ? 5 : 0 },
        extend: { value: fill ? 0.35 : 0 },
        push: { value: fill ? 1.06 : 1 },
        cut: { value: fill ? 99 : 0.12 },
        blur: { value: fill ? 4 : 0 },
        opacity: { value: 1 },
      },
    });
  const sharp = useMemo(() => make(false), [map, depth, tanHalf]); // eslint-disable-line react-hooks/exhaustive-deps
  const fill = useMemo(() => make(true), [map, depth, tanHalf]); // eslint-disable-line react-hooks/exhaustive-deps
  slot.materials = [sharp, fill];
  return (
    <group ref={(g) => (slot.group = g)}>
      <mesh geometry={fillGeometry} material={fill} renderOrder={slot.order} frustumCulled={false} />
      <mesh geometry={geometry} material={sharp} renderOrder={slot.order + 1} frustumCulled={false} />
    </group>
  );
}

/** How the room you leave and the room you enter move during each kind of step. */
const MOVES = {
  forward: { out: (t, g) => g.position.set(0, 0, 2.4 * t), in: (t, g) => g.position.set(0, 0, -2.6 * (1 - t)) },
  back: { out: (t, g) => g.position.set(0, 0, -2.6 * t), in: (t, g) => g.position.set(0, 0, 1.8 * (1 - t)) },
  left: { out: (t, g) => g.rotation.set(0, -1.1 * t, 0), in: (t, g) => g.rotation.set(0, 1.1 * (1 - t), 0) },
  right: { out: (t, g) => g.rotation.set(0, 1.1 * t, 0), in: (t, g) => g.rotation.set(0, -1.1 * (1 - t), 0) },
};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Scene({ look }) {
  const tour = useStore((s) => s.tour);
  const rooms = VILLA_BY_ID[tour.villaId].photos;
  const id = rooms[tour.stop].id;
  const [slots, setSlots] = useState([]); // [{ key, id, tex, role: "in" | "out", order }]
  const step = useRef({ t: 1, move: "forward" });
  const cam = useRef({ walk: 0, walkT: 0, x: 0, y: 0, yaw: 0, pitch: 0, bob: 0, overshoot: 0 }).current;
  const { camera, size } = useThree();

  // Bring in the new room once its textures are ready; the current one becomes the one you leave.
  useEffect(() => {
    let live = true;
    loadRoom(id).then((tex) => {
      if (!live || !tex.map) return;
      const move = useStore.getState().move;
      setSlots((ss) => {
        const current = ss.filter((s) => s.role === "in").slice(-1);
        if (current[0]?.id === id) return ss;
        // Carry the head turn and the steps taken into the room you leave, so nothing jumps.
        current.forEach((s) => Object.assign(s, { role: "out", order: 4, from: { walk: cam.walk, yaw: look.yaw } }));
        return [...current, { key: `${id}:${Date.now()}`, id, tex, role: "in", order: 1 }];
      });
      // The first room just appears; every later one is walked into.
      step.current = { t: slotsRef.current.some((s) => s.role === "in") ? 0 : 1, move };
      cam.walk = cam.walkT = 0;
      look.reset();
    });
    return () => {
      live = false;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  // Warm the rooms the doorways lead to.
  useEffect(() => {
    Object.values(rooms[tour.stop].exits).forEach((to) => to !== "exit" && loadRoom(rooms[to].id));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const st = step.current;
    if (st.t < 1) {
      st.t = Math.min(1, st.t + dt / STEP_TIME);
      if (st.t === 1) setSlots((ss) => ss.filter((s) => s.role === "in"));
    }
    const k = ease(st.t);
    const M = MOVES[st.move] || MOVES.forward;
    for (const s of slotsRef.current) {
      const g = s.group;
      if (!g) continue;
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
      if (s.role === "out") {
        M.out(k, g);
        // The camera is back at the room's start, so the room you leave carries the steps
        // you had taken into it and the way your head was turned.
        g.position.z += s.from.walk;
        g.rotation.y -= s.from.yaw;
        s.materials?.forEach((m) => {
          m.uniforms.opacity.value = 1 - Math.min(1, k * 1.25);
          m.depthTest = false;
        });
      } else {
        if (st.t < 1) M.in(k, g);
        s.materials?.forEach((m) => (m.uniforms.opacity.value = st.t < 1 ? Math.min(1, 0.15 + k * 1.4) : 1));
      }
    }

    // Walking within the room (held buttons, keys, wheel) and a gentle head bob.
    const store = useStore.getState();
    if (roomInput.walk && st.t === 1) cam.walkT = THREE.MathUtils.clamp(cam.walkT + roomInput.walk * 0.9 * dt, -0.15, WALK_MAX + 0.4);
    // Pushing past the end of a room walks you through its doorway.
    if (st.t === 1 && cam.walkT > WALK_MAX + 0.25 && store.go("forward")) cam.walkT = WALK_MAX;
    else if (st.t === 1 && cam.walkT < -0.1 && store.go("back")) cam.walkT = 0;
    cam.walkT = THREE.MathUtils.clamp(cam.walkT, 0, WALK_MAX + 0.4);
    const prev = cam.walk;
    cam.walk = THREE.MathUtils.damp(cam.walk, Math.min(cam.walkT, WALK_MAX), 4, dt);
    cam.bob += Math.abs(cam.walk - prev) * 9 + (st.t < 1 ? dt * 5 : 0);
    const bobAmp = Math.min(0.02, Math.abs(cam.walk - prev) * 2 + (st.t < 1 ? 0.012 * Math.sin(Math.PI * st.t) : 0));

    // Head: dragged turn plus a small lean toward the pointer, which makes the depth read.
    look.update(dt);
    cam.x = THREE.MathUtils.damp(cam.x, state.pointer.x * 0.07, 3, dt);
    cam.y = THREE.MathUtils.damp(cam.y, state.pointer.y * 0.04, 3, dt);
    camera.position.set(cam.x, cam.y + Math.sin(cam.bob) * bobAmp, -cam.walk);
    camera.rotation.set(look.pitch, look.yaw, 0, "YXZ");

    // Frame the photo to cover the screen, a little tighter so there is room to look around.
    const cur = slotsRef.current.find((s) => s.role === "in");
    if (cur) {
      const a = cur.tex.map.image.width / cur.tex.map.image.height;
      const t = Math.tan(HALF_FOV);
      const tx = a >= 1 ? t : t * a;
      const ty = a >= 1 ? t / a : t;
      const tanCam = Math.min(ty, tx / (size.width / size.height)) * 0.84;
      const fov = THREE.MathUtils.radToDeg(2 * Math.atan(tanCam));
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = THREE.MathUtils.damp(camera.fov, fov, 6, dt);
        camera.updateProjectionMatrix();
      }
    }
  });

  return slots.map((s) => <Room key={s.key} tex={s.tex} slot={s} />);
}

/** Drag to turn your head, with a little momentum; it springs back softly at the limits. */
function useLook() {
  return useMemo(() => {
    const l = { yaw: 0, pitch: 0, ty: 0, tp: 0, vy: 0, vp: 0, drag: null };
    l.reset = () => {
      l.yaw = l.pitch = l.ty = l.tp = l.vy = l.vp = 0;
    };
    l.update = (dt) => {
      if (!l.drag) {
        l.ty += l.vy;
        l.tp += l.vp;
        l.vy *= 0.9;
        l.vp *= 0.9;
        l.ty += (THREE.MathUtils.clamp(l.ty, -YAW_MAX, YAW_MAX) - l.ty) * 0.15;
        l.tp += (THREE.MathUtils.clamp(l.tp, -PITCH_MAX, PITCH_MAX) - l.tp) * 0.15;
      }
      l.yaw = THREE.MathUtils.damp(l.yaw, l.ty, 10, dt);
      l.pitch = THREE.MathUtils.damp(l.pitch, l.tp, 10, dt);
    };
    const soft = (v, max) => (Math.abs(v) > max ? Math.sign(v) * (max + (Math.abs(v) - max) * 0.3) : v);
    l.handlers = {
      onPointerDown: (e) => {
        if (e.button !== 0) return;
        l.drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY };
        l.vy = l.vp = 0;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.classList.add("is-dragging");
      },
      onPointerMove: (e) => {
        if (!l.drag) return;
        const w = e.currentTarget.clientWidth;
        // Grab the room: drag right to look left.
        const dy = ((e.clientX - l.drag.x) / w) * 1.3;
        const dp = ((e.clientY - l.drag.y) / w) * 1.3;
        l.ty = soft(l.ty + dy, YAW_MAX);
        l.tp = soft(l.tp + dp, PITCH_MAX);
        l.vy = dy * 0.5;
        l.vp = dp * 0.5;
        l.drag.x = e.clientX;
        l.drag.y = e.clientY;
      },
      onPointerUp: (e) => {
        if (!l.drag) return;
        const { x0, y0 } = l.drag;
        l.drag = null;
        e.currentTarget.classList.remove("is-dragging");
        // Turning hard past the edge, toward a doorway, takes it.
        const s = useStore.getState();
        if (l.ty > YAW_MAX * 1.25 && exitsHere(s).some((x) => x.move === "left")) s.go("left");
        else if (l.ty < -YAW_MAX * 1.25 && exitsHere(s).some((x) => x.move === "right")) s.go("right");
        // On touch, a long upward swipe walks forward.
        else if (e.pointerType !== "mouse" && y0 - e.clientY > 90 && Math.abs(e.clientX - x0) < 60) roomWheel(1.2);
      },
      onPointerCancel: (e) => {
        l.drag = null;
        e.currentTarget.classList.remove("is-dragging");
      },
    };
    return l;
  }, []);
}

/** Wheel and swipe steps, converted to walking (positive = into the room). */
let wheelQueue = 0;
export const roomWheel = (amount) => (wheelQueue += amount);

function WheelWalk() {
  useFrame((_, dt) => {
    if (!wheelQueue) return;
    const take = Math.sign(wheelQueue) * Math.min(Math.abs(wheelQueue), dt * 3);
    wheelQueue -= take;
    roomInput.walk = take / Math.max(dt, 1e-3);
    if (Math.abs(wheelQueue) < 1e-3) {
      wheelQueue = 0;
      roomInput.walk = 0;
    }
  });
  return null;
}

/** The villa interior: a full-screen WebGL view over the page while you are inside. */
export default function RoomView() {
  const look = useLook();
  useEffect(() => {
    const onWheel = (e) => {
      const s = useStore.getState();
      if (!s.tour || s.villa || s.booking || s.roomsOpen || s.credits || e.target.closest?.("[data-ui-scroll]")) return;
      roomWheel(-e.deltaY * 0.004);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);
  return (
    <div className="room-view" {...look.handlers}>
      <Canvas flat dpr={[1, 2]} camera={{ fov: 50, near: 0.05, far: 60, position: [0, 0, 0] }} gl={{ antialias: true }}>
        <color attach="background" args={["#141a16"]} />
        <Scene look={look} />
        <WheelWalk />
      </Canvas>
      <div className="stage-shade" />
    </div>
  );
}
