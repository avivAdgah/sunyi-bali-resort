import { useEffect } from "react";
import { useProgress } from "@react-three/drei";
import { useStore } from "../store";
import { ZONES } from "../data/path";
import { VILLA_BY_ID, STOP_BY_ID } from "../data/villas";

/** Shareable links: ?zone=pool, ?villa=cliff-infinity-villa&stop=bath, &time=night. */
function applyDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const store = useStore.getState();
  if (params.get("time") === "night") store.setNight(true);
  const villa = VILLA_BY_ID[params.get("villa")];
  const zone = ZONES.find((z) => z.id === params.get("zone"));
  if (villa) {
    store.enter();
    store.openTour(villa.id, STOP_BY_ID[params.get("stop")] ?? 0);
    store.teleport();
  } else if (zone) {
    store.enter();
    store.walkTo(zone.dist + 1);
    store.teleport();
  }
}

export default function Intro({ ready }) {
  const { progress, active } = useProgress();
  const entered = useStore((s) => s.entered);
  const enter = useStore((s) => s.enter);
  const loaded = ready && !active && progress >= 100;

  useEffect(() => {
    if (loaded) applyDeepLink();
  }, [loaded]);

  if (entered) return null;
  return (
    <div className="intro">
      <div className="intro-card">
        <div className="brand brand-lg">
          <BrandMark />
          <span>
            SUNYI
            <small>Bali Jungle Retreat</small>
          </span>
        </div>
        <h1>
          Walk the resort.
          <br />
          <em>Choose your villa.</em>
        </h1>
        <p>
          Step through the temple gate, past the infinity pool and the rice terraces, and look inside five villas, from a
          thatched teak joglo to a glass pavilion on the cliff. See every room by day or by night, then book the one you want.
        </p>
        <ul className="controls">
          <li><kbd>Scroll</kbd> or <kbd>↑</kbd><kbd>↓</kbd> walk the path</li>
          <li><kbd>Drag</kbd> look around</li>
          <li><kbd>Click</kbd> a villa sign to tour inside</li>
          <li><kbd>N</kbd> day / night</li>
        </ul>
        <button className="btn btn-primary btn-lg" disabled={!loaded} onClick={enter}>
          {loaded ? "Enter the resort →" : `Preparing the resort… ${Math.round(progress)}%`}
        </button>
        <div className="intro-bar" aria-hidden="true">
          <span style={{ width: `${loaded ? 100 : progress}%` }} />
        </div>
      </div>
    </div>
  );
}

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="22" height="22">
        <path d="M4 23h24L16 7z" fill="currentColor" />
        <path d="M9 23v-4h14v4" stroke="#FAF6EE" strokeWidth="2" fill="none" />
      </svg>
    </span>
  );
}
