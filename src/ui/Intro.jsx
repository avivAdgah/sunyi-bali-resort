import { useEffect, useState } from "react";
import { useStore } from "../store";
import { STATIONS, STATION_BY_ID } from "../data/resort";
import { VILLA_BY_ID } from "../data/villas";
import { photoUrl } from "../data/photos";

/** Shareable links: ?zone=pool starts at a facility, ?villa=cliff-infinity-villa&room=2 steps into a villa. */
function applyDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const store = useStore.getState();
  const station = STATION_BY_ID[params.get("zone")];
  const villa = VILLA_BY_ID[params.get("villa")];
  if (station === undefined && !villa) return false;
  store.enter();
  if (station !== undefined) store.goTo(station);
  if (villa) store.openTour(villa.id, Math.min(Math.max((parseInt(params.get("room"), 10) || 1) - 1, 0), villa.photos.length - 1));
  return true;
}

export default function Intro() {
  const entered = useStore((s) => s.entered);
  const enter = useStore((s) => s.enter);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (applyDeepLink()) return;
    const img = new Image();
    img.onload = img.onerror = () => setLoaded(true);
    img.src = photoUrl(STATIONS[0].photos[0].id);
  }, []);

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
          <em>Step into your villa.</em>
        </h1>
        <p>
          Follow the path from the temple gate past the infinity pool, the restaurant, the spa and the rice terraces to the
          sunset bar. Then step into any of the five villas and walk through its rooms in 3D, made from real photographs.
        </p>
        <ul className="controls">
          <li><kbd>Scroll</kbd> walk the resort</li>
          <li><kbd>Drag</kbd> look around a room</li>
          <li><kbd>↑</kbd><kbd>↓</kbd> walk into a room</li>
          <li><kbd>Esc</kbd> back out</li>
        </ul>
        <button className="btn btn-primary btn-lg" disabled={!loaded} onClick={enter}>
          {loaded ? "Enter the resort →" : "Preparing the resort…"}
        </button>
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
