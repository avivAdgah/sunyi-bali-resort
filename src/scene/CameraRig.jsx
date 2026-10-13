import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { frameAt, PATH_LENGTH } from "../data/path";
import { VILLA_BY_ID, STOPS, GATE_IN, GATE_OUT, toWorld } from "../data/villas";
import { useStore } from "../store";

const EYE = 1.62;
const WALK_SPEED = 3.6;
const damp = THREE.MathUtils.damp;
const V3 = (a) => new THREE.Vector3(...a);

function turnToward(dir, target, lambda, dt) {
  dir.lerp(target, 1 - Math.exp(-lambda * dt));
  if (dir.lengthSq() < 1e-6) dir.copy(target);
  dir.normalize();
}

/** Shared input written by DOM listeners and read every frame. */
export const input = { forward: 0, keyLook: 0, yaw: 0, pitch: 0 };

const stopPoint = (villaId, i) => {
  const v = VILLA_BY_ID[villaId];
  const s = STOPS[i];
  return { pos: V3(toWorld(v, s.pos)), look: V3(toWorld(v, s.look)), final: true };
};
/** Plain waypoint inside a villa (e.g. around the bathroom partition). */
const viaPoint = (villaId, i) => STOPS[i]?.via && { pos: V3(toWorld(VILLA_BY_ID[villaId], STOPS[i].via)) };
const gateOut = (villaId) => ({ pos: V3(toWorld(VILLA_BY_ID[villaId], GATE_OUT)) });
const gateIn = (villaId) => ({ pos: V3(toWorld(VILLA_BY_ID[villaId], GATE_IN)) });

/**
 * Two modes. On the path: scroll / keys / swipe walk the route and dragging looks around.
 * In a villa: the camera follows a queue of waypoints (lane → gate → inside → tour stop),
 * then stands at the stop where dragging looks all the way around.
 */
export default function CameraRig() {
  const { camera, gl } = useThree();
  const s = useRef({
    dist: useStore.getState().targetDist,
    yaw: 0,
    pitch: 0,
    published: -1,
    teleportTick: 0,
    key: null, // "villaId:stop" the camera is heading for, null on the path
    inside: null, // villa the camera is inside (or heading into)
    pending: null, // tour requested from afar: walk the path to the villa first
    stop: 0, // tour stop the camera is at (or heading to)
    queue: [],
    pos: new THREE.Vector3(),
    dir: new THREE.Vector3(0, 0, -1),
    look: new THREE.Vector3(),
    init: false,
  }).current;
  const tmp = useRef({ p: new THREE.Vector3(), t: new THREE.Vector3(), a: new THREE.Vector3(), v: new THREE.Vector3(), d: new THREE.Vector3() }).current;

  useWalkInput(gl.domElement);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const store = useStore.getState();
    const tour = store.tour;

    if (input.forward && store.entered && !tour) store.walk(input.forward * WALK_SPEED * dt);
    if (input.keyLook) input.yaw += input.keyLook * 1.6 * dt;

    // ---- plan camera moves when the tour target changes ----
    const key = tour ? `${tour.villaId}:${tour.stop}` : null;
    if (store.teleportTick !== s.teleportTick) {
      s.teleportTick = store.teleportTick;
      s.dist = store.targetDist;
      s.init = false;
      if (tour) {
        const stop = stopPoint(tour.villaId, tour.stop);
        s.queue = [stop];
        s.inside = tour.villaId;
        s.stop = tour.stop;
        s.pending = null;
        s.pos.copy(stop.pos);
        s.dir.copy(stop.look).sub(stop.pos).normalize();
        s.init = true;
      }
      s.key = key;
    }
    if (key !== s.key) {
      input.yaw = 0;
      input.pitch = 0;
      if (!tour) {
        // Leave through the gate and rejoin the path.
        s.pending = null;
        if (s.inside) s.queue = [viaPoint(s.inside, s.stop), gateIn(s.inside), gateOut(s.inside)].filter(Boolean);
        s.inside = null;
      } else if (s.inside === tour.villaId) {
        const from = s.stop;
        s.queue = [from !== tour.stop && viaPoint(tour.villaId, from), viaPoint(tour.villaId, tour.stop), stopPoint(tour.villaId, tour.stop)].filter(Boolean);
      } else if (s.inside) {
        // Villa to villa along the lane.
        s.queue = [viaPoint(s.inside, s.stop), gateIn(s.inside), gateOut(s.inside), gateOut(tour.villaId), gateIn(tour.villaId), viaPoint(tour.villaId, tour.stop), stopPoint(tour.villaId, tour.stop)].filter(Boolean);
        s.inside = tour.villaId;
        s.dist = VILLA_BY_ID[tour.villaId].dist;
      } else {
        s.pending = tour.villaId; // walk there first
      }
      s.key = key;
      s.stop = tour ? tour.stop : 0;
    }
    if (s.pending && Math.abs(s.dist - VILLA_BY_ID[s.pending].dist) < 1.2) {
      const id = s.pending;
      const stop = useStore.getState().tour?.stop ?? 0;
      s.queue = [gateOut(id), gateIn(id), viaPoint(id, stop), stopPoint(id, stop)].filter(Boolean);
      s.stop = stop;
      s.inside = id;
      s.pending = null;
    }

    if (s.queue.length) {
      followQueue(dt);
    } else {
      walkPath(dt, store);
    }
    camera.position.copy(s.pos);
    camera.lookAt(s.look.copy(s.pos).add(s.dir));
  });

  function followQueue(dt) {
    const target = s.queue[0];
    const to = tmp.v.copy(target.pos).sub(s.pos);
    const len = to.length();
    const last = s.queue.length === 1;
    if (len > 0.002) {
      const speed = THREE.MathUtils.clamp(len * 2.4, 1.4, 6);
      s.pos.addScaledVector(to.normalize(), Math.min(len, speed * dt));
    }
    if (!last && len < 0.12) {
      s.queue.shift();
      return;
    }
    const desired = tmp.d;
    if (target.final && (len < 1.2 || s.queue.length === 1)) {
      // At (or arriving at) a stop: look at its subject, plus wherever the visitor drags.
      desired.copy(target.look).sub(target.pos).normalize();
      const flat = Math.hypot(desired.x, desired.z);
      const baseYaw = Math.atan2(desired.x, desired.z) + input.yaw;
      const basePitch = Math.atan2(desired.y, flat) + input.pitch;
      input.pitch = THREE.MathUtils.clamp(input.pitch, -0.9, 0.9);
      desired.set(Math.sin(baseYaw) * Math.cos(basePitch), Math.sin(basePitch), Math.cos(baseYaw) * Math.cos(basePitch));
      turnToward(s.dir, desired, len < 0.5 ? 6 : 3.5, dt);
    } else if (len > 0.05) {
      desired.set(to.x, -0.08, to.z).normalize();
      turnToward(s.dir, desired, 4, dt);
    }
    // Exit route finished: hand back to the path.
    if (last && !target.final && len < 0.12) {
      s.queue = [];
      s.init = true;
    }
  }

  function walkPath(dt, store) {
    s.dist = damp(s.dist, store.targetDist, 3.2, dt);
    if (Math.abs(s.dist - s.published) > 0.05) {
      s.published = s.dist;
      store.setCurrentDist(s.dist);
    }
    const { point: p, tangent: t } = frameAt(s.dist, tmp.p, tmp.t);
    const ahead = frameAt(Math.min(s.dist + 2.5, PATH_LENGTH), tmp.a).point;
    const dir = tmp.d.set(ahead.x - p.x, 0, ahead.z - p.z);
    if (dir.lengthSq() < 1e-4) dir.set(t.x, 0, t.z);
    dir.normalize();

    if (Math.abs(store.targetDist - s.dist) > 0.4 && !input.keyLook) {
      input.yaw *= Math.exp(-1.4 * dt);
      input.pitch *= Math.exp(-1.4 * dt);
    }
    input.yaw = THREE.MathUtils.clamp(input.yaw, -2.8, 2.8);
    input.pitch = THREE.MathUtils.clamp(input.pitch, -0.6, 0.6);
    const idle = store.entered ? 0 : Math.sin(performance.now() / 3000) * 0.35;
    s.yaw = damp(s.yaw, input.yaw + idle, 6, dt);
    s.pitch = damp(s.pitch, store.entered ? input.pitch : -0.02, 6, dt);
    dir.applyAxisAngle(THREE.Object3D.DEFAULT_UP, s.yaw);

    const bob = Math.sin(s.dist * 3.2) * 0.025 * Math.min(1, Math.abs(store.targetDist - s.dist));
    const desiredPos = tmp.v.set(p.x, EYE + bob, p.z);
    dir.y = s.pitch - 0.06;
    dir.normalize();
    if (!s.init) {
      s.pos.copy(desiredPos);
      s.dir.copy(dir);
      s.init = true;
    }
    s.pos.x = damp(s.pos.x, desiredPos.x, 6, dt);
    s.pos.y = damp(s.pos.y, desiredPos.y, 6, dt);
    s.pos.z = damp(s.pos.z, desiredPos.z, 6, dt);
    turnToward(s.dir, dir, 5, dt);
  }

  return null;
}

/** Wheel, keyboard and pointer-drag controls. */
function useWalkInput(canvas) {
  useEffect(() => {
    const isUi = (el) => el instanceof Element && el.closest("[data-ui-scroll]");

    const onWheel = (e) => {
      if (isUi(e.target)) return;
      const store = useStore.getState();
      if (!store.entered || store.tour) return;
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      store.walk(THREE.MathUtils.clamp(delta, -120, 120) * 0.014);
    };

    const keys = new Set();
    const update = () => {
      const tour = useStore.getState().tour;
      input.forward = tour ? 0 : (keys.has("up") ? 1 : 0) - (keys.has("down") ? 1 : 0);
      input.keyLook = (keys.has("left") ? 1 : 0) - (keys.has("right") ? 1 : 0);
    };
    const keyName = (e) =>
      ({ ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" })[e.code];
    const onKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const store = useStore.getState();
      if (e.code === "Escape") {
        if (store.booking) store.closeBooking();
        else if (store.listOpen) store.setListOpen(false);
        else if (store.tour) store.exitTour();
        return;
      }
      if (e.code === "KeyN" && store.entered) {
        store.toggleNight();
        return;
      }
      const k = keyName(e);
      if (!k) return;
      e.preventDefault();
      if (store.tour && (k === "up" || k === "down")) {
        if (!e.repeat) store.setStop(store.tour.stop + (k === "up" ? 1 : -1));
        return;
      }
      keys.add(k);
      update();
    };
    const onKeyUp = (e) => {
      const k = keyName(e);
      if (k) {
        keys.delete(k);
        update();
      }
    };

    // Drag to look ("grab the world"). On touch, a vertical swipe walks the path instead.
    let last = null;
    const onPointerDown = (e) => {
      if (e.button === 0) last = { x: e.clientX, y: e.clientY, touch: e.pointerType !== "mouse" };
    };
    const onPointerMove = (e) => {
      if (!last) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last.x = e.clientX;
      last.y = e.clientY;
      const store = useStore.getState();
      if (!store.entered) return;
      input.yaw += dx * (last.touch ? 0.006 : 0.0045);
      if (last.touch && !store.tour) store.walk(-dy * 0.03);
      else input.pitch += dy * 0.003;
    };
    const onPointerUp = () => {
      last = null;
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [canvas]);
}
