import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { STATIONS } from "../data/resort";
import { photoUrl } from "../data/photos";
import { roomInput } from "./RoomView";

/** Resolves once the image is downloaded (or failed), so a swap never fades into a blank frame. */
const preload = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
    if (img.complete) resolve();
  });

/** The keyframes each leaving layer runs; when it ends, the layer is removed. */
const LEAVE = { "out-walk": "walk-out", "out-back": "back-out", "out-fade": "hold" };

/**
 * The resort path: one full-screen photo per facility. Walking on, the camera moves into
 * the photo and the next place opens up from its middle while the light of the place
 * you left lingers at the edges; walking back is the reverse; another photo of the same
 * place crossfades.
 */
export default function Stage() {
  const station = useStore((s) => s.station);
  const photo = useStore((s) => s.photo);
  const move = useStore((s) => s.move);
  const here = STATIONS[station];
  const src = photoUrl(here.photos[photo].id);
  const [layers, setLayers] = useState([{ key: 0, src, anim: "" }]);
  const [steps, setSteps] = useState(0); // restarts the footstep bob
  const shown = useRef({ station, src });

  useEffect(() => {
    if (src === shown.current.src) return;
    let live = true;
    preload(src).then(() => {
      if (!live) return;
      const kind = station === shown.current.station ? "fade" : move === "back" ? "back" : "walk";
      shown.current = { station, src };
      if (kind !== "fade") setSteps((n) => n + 1);
      setLayers((ls) => {
        const top = ls[ls.length - 1];
        return [{ ...top, anim: `out-${kind}` }, { key: top.key + 1, src, anim: `in-${kind}` }];
      });
    });
    return () => {
      live = false;
    };
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warm up the neighbours so the next step is instant.
  useEffect(() => {
    [STATIONS[station + 1]?.photos[0], STATIONS[station - 1]?.photos[0], ...here.photos].forEach((p) => p && preload(photoUrl(p.id)));
  }, [station]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="stage" aria-hidden="true">
      <div className={`stage-cam ${steps ? `bob-${steps % 2}` : ""}`}>
        {layers.map((l) => (
          <div
            key={l.key}
            className={`stage-layer ${l.anim}`}
            onAnimationEnd={(e) => {
              // Only the leaving animation itself ends a layer; its earlier arrival may finish late.
              if (e.target === e.currentTarget && e.animationName === LEAVE[l.anim]) setLayers((ls) => ls.filter((x) => x.key !== l.key));
            }}
          >
            <img src={l.src} alt="" draggable="false" />
          </div>
        ))}
      </div>
      <div className="stage-shade" />
    </div>
  );
}

/**
 * Scroll, keys and swipes. On the resort path they step between places; inside a villa
 * ↑ / ↓ (W / S) walk into the room and back, ← / → take the side doorways. Esc closes
 * whatever is open, innermost first.
 */
export function useControls() {
  useEffect(() => {
    let lockUntil = 0;
    let acc = 0;
    const ready = (ms) => {
      const now = performance.now();
      if (now < lockUntil) return false;
      lockUntil = now + ms;
      acc = 0;
      return true;
    };
    const busy = () => {
      const s = useStore.getState();
      return !s.entered || s.villa || s.booking || s.roomsOpen || s.credits;
    };

    const onWheel = (e) => {
      const s = useStore.getState();
      if (s.tour || busy() || e.target.closest?.("[data-ui-scroll]")) return; // inside a villa the room view walks
      acc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(acc) > 60 && ready(1500)) s.goTo(s.station + Math.sign(acc));
    };
    const held = new Set();
    const onKey = (e) => {
      const s = useStore.getState();
      if (e.key === "Escape") {
        if (s.booking) s.closeBooking();
        else if (s.villa) s.closeVilla();
        else if (s.roomsOpen) s.setRoomsOpen(false);
        else if (s.credits) s.setCredits(false);
        else if (s.tour) s.exitTour();
        return;
      }
      if (busy() || e.target.closest?.("input, select, textarea")) return;
      const key = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" }[e.key];
      if (!key) return;
      e.preventDefault();
      if (s.tour) {
        if (key === "up" || key === "down") {
          held.add(key);
          roomInput.walk = (held.has("up") ? 1 : 0) - (held.has("down") ? 1 : 0);
        } else if (!e.repeat && ready(1500)) s.go(key);
      } else if (ready(1500)) {
        s.goTo(s.station + (key === "down" || key === "left" ? -1 : 1));
      }
    };
    const onKeyUp = (e) => {
      const key = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down" }[e.key];
      if (!key) return;
      held.delete(key);
      roomInput.walk = (held.has("up") ? 1 : 0) - (held.has("down") ? 1 : 0);
    };
    let touch = null;
    const onTouchStart = (e) => {
      touch = e.target.closest?.("[data-ui-scroll], button, a, .room-view") ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e) => {
      if (!touch || busy() || useStore.getState().tour) return;
      const dx = e.changedTouches[0].clientX - touch.x;
      const dy = e.changedTouches[0].clientY - touch.y;
      touch = null;
      const d = Math.abs(dx) > Math.abs(dy) ? -dx : -dy;
      const s = useStore.getState();
      if (Math.abs(d) > 50 && ready(1500)) s.goTo(s.station + Math.sign(d));
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);
}

