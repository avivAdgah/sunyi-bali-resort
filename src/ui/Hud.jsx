import { useEffect, useState } from "react";
import { ZONES, zoneAt, PATH_POLYLINE, frameAt, nearestDistance, PATH_LENGTH } from "../data/path";
import { VILLAS, VILLA_BY_ID, PLOT_Z, PLOT_W, money } from "../data/villas";
import { POOLS } from "../data/world";
import { useStore } from "../store";
import { input } from "../scene/CameraRig";
import { BrandMark } from "./Intro";

export default function Hud() {
  const entered = useStore((s) => s.entered);
  const currentDist = useStore((s) => s.currentDist);
  const tour = useStore((s) => s.tour);
  const setListOpen = useStore((s) => s.setListOpen);
  const openBooking = useStore((s) => s.openBooking);
  const night = useStore((s) => s.night);
  useEffect(() => {
    document.body.dataset.night = String(night);
  }, [night]);
  const zone = zoneAt(currentDist);
  const where = tour ? VILLA_BY_ID[tour.villaId].name : zone.name;

  return (
    <div className={`hud ${entered ? "is-on" : ""} ${tour ? "is-touring" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <BrandMark />
          <span>SUNYI</span>
        </div>
        <div className="topbar-zone" aria-live="polite">
          <span>{tour ? "Touring" : "You are at"}</span>
          <strong>{where}</strong>
        </div>
        <div className="topbar-actions">
          <TimeToggle />
          <button className="btn btn-ghost" onClick={() => setListOpen(true)}>
            Villas <span className="hide-sm">&amp; prices</span>
          </button>
          <button className="btn btn-gold hide-xs" onClick={() => openBooking()}>Book</button>
        </div>
      </header>

      {!tour && (
        <>
          <WalkHint dist={currentDist} />
          <nav className="route" aria-label="Resort areas">
            <HoldButton dir={-1} label="Walk back">‹</HoldButton>
            <ol>
              {ZONES.map((z) => (
                <li key={z.id}>
                  <button className={z.id === zone.id ? "is-current" : ""} onClick={() => useStore.getState().walkTo(z.dist + 1)}>
                    {z.short}
                  </button>
                </li>
              ))}
            </ol>
            <HoldButton dir={1} label="Walk forward">›</HoldButton>
            <div className="route-progress" style={{ width: `${(currentDist / PATH_LENGTH) * 100}%` }} />
          </nav>
          <Minimap dist={currentDist} />
        </>
      )}
    </div>
  );
}

/** Sun/moon switch; the whole scene eases between midday and night. */
export function TimeToggle({ label = false }) {
  const night = useStore((s) => s.night);
  const toggle = useStore((s) => s.toggleNight);
  return (
    <button className={`time-toggle ${night ? "is-night" : ""}`} onClick={toggle} role="switch" aria-checked={night} aria-label="Night view" title="Day / night (N)">
      <span className="time-knob">{night ? <MoonIcon /> : <SunIcon />}</span>
      {label && <span className="time-label">{night ? "Night" : "Day"}</span>}
    </button>
  );
}

function HoldButton({ dir, label, children }) {
  const start = () => (input.forward = dir);
  const stop = () => (input.forward = 0);
  return (
    <button
      className="route-step"
      aria-label={label}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && useStore.getState().walk(dir * 3)}
    >
      {children}
    </button>
  );
}

function WalkHint({ dist }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (dist > 6) setGone(true);
  }, [dist]);
  if (gone) return null;
  return <div className="hint">Scroll to walk · drag to look around · click a villa sign to step inside</div>;
}

// Minimap: x −32…100, z −18…46 (meters) → SVG units.
const MAP = { minX: -32, minZ: -18, w: 132, h: 64 };

function Minimap({ dist }) {
  const { point, tangent } = frameAt(dist);
  const heading = (Math.atan2(tangent.x, -tangent.z) * 180) / Math.PI;
  const onClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = MAP.minX + ((e.clientX - r.left) / r.width) * MAP.w;
    const z = MAP.minZ + ((e.clientY - r.top) / r.height) * MAP.h;
    const villa = VILLAS.find((v) => Math.abs(x - v.x) < PLOT_W / 2 && z < PLOT_Z && z > -16);
    if (villa) useStore.getState().openTour(villa.id);
    else useStore.getState().walkTo(nearestDistance(x, z));
  };
  return (
    <figure className="minimap">
      <svg viewBox={`${MAP.minX} ${MAP.minZ} ${MAP.w} ${MAP.h}`} onClick={onClick} role="img" aria-label="Resort map, click to go there">
        <rect x={-31} y={-16} width={130} height={38} rx={2} className="mm-ground" />
        <rect x={-31} y={-18} width={130} height={2} className="mm-valley" />
        <rect x={-4} y={22} width={8} height={24} className="mm-road" />
        {POOLS.filter((p) => !p.pond).map((p) => (
          <rect key={p.id} x={p.x0} y={p.z0} width={p.x1 - p.x0} height={p.z1 - p.z0} rx={0.6} className="mm-pool" />
        ))}
        <rect x={-8} y={2} width={16} height={13} rx={1} className="mm-building" />
        {VILLAS.map((v) => (
          <g key={v.id}>
            <rect x={v.x - PLOT_W / 2 + 0.5} y={-15.6} width={PLOT_W - 1} height={12.6} rx={1} className={`mm-villa mm-${v.style}`} />
            <text x={v.x} y={-6.5} className="mm-price">{money(v.price)}</text>
          </g>
        ))}
        <polyline points={PATH_POLYLINE.map((p) => p.join(",")).join(" ")} className="mm-path" />
        <g transform={`translate(${point.x} ${point.z}) rotate(${heading})`}>
          <circle r={4} className="mm-you-halo" />
          <path d="M0 -4 L3 3 L0 1.4 L-3 3 Z" className="mm-you" />
        </g>
      </svg>
      <figcaption>Resort map · click a villa to tour it</figcaption>
    </figure>
  );
}

export const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
  </svg>
);
export const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
  </svg>
);
