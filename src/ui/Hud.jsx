import { useStore, exitsHere } from "../store";
import { STATIONS } from "../data/resort";
import { VILLA_BY_ID } from "../data/villas";
import { thumbUrl, credit } from "../data/photos";
import { roomInput } from "./RoomView";
import { BrandMark } from "./Intro";

/**
 * Everything over the view. On the resort path: the place you are at and the path
 * between the facilities. Inside a villa: the room, its doorways, walking controls and
 * the list of rooms.
 */
export default function Hud() {
  const entered = useStore((s) => s.entered);
  const tour = useStore((s) => s.tour);
  const villa = tour && VILLA_BY_ID[tour.villaId];
  return (
    <div className={`hud ${entered ? "is-on" : ""} ${villa ? "is-touring" : ""}`}>
      {villa ? <VillaHud villa={villa} stop={tour.stop} /> : <ResortHud />}
    </div>
  );
}

function ResortHud() {
  const index = useStore((s) => s.station);
  const store = useStore.getState();
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <BrandMark />
          <span>SUNYI</span>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost show-narrow" onClick={() => store.setRoomsOpen(true)}>
            Villas <span className="hide-sm">&amp; prices</span>
          </button>
          <button className="btn btn-gold" onClick={() => store.openBooking()}>Book</button>
        </div>
      </header>

      <StationCard key={STATIONS[index].id} station={STATIONS[index]} index={index} />

      <nav className="route" aria-label="Walk through the resort">
        <button className="route-step" onClick={() => store.goTo(index - 1)} disabled={index === 0} aria-label="Walk back">‹</button>
        <ol style={{ "--progress": index / (STATIONS.length - 1) }}>
          {STATIONS.map((s, i) => (
            <li key={s.id} className={i === index ? "is-current" : i < index ? "is-past" : ""}>
              <button onClick={() => store.goTo(i)} aria-current={i === index ? "step" : undefined}>
                <span className="route-dot" />
                <span className="route-name">{s.short}</span>
              </button>
            </li>
          ))}
        </ol>
        <button className="route-step" onClick={() => store.goTo(index + 1)} disabled={index === STATIONS.length - 1} aria-label="Walk on">›</button>
      </nav>
    </>
  );
}

function StationCard({ station, index }) {
  const photo = useStore((s) => s.photo);
  const setPhoto = useStore((s) => s.setPhoto);
  const current = station.photos[photo];
  const by = credit(current.id);
  return (
    <section className="station" aria-live="polite">
      <span className="station-kicker">Stop {index + 1} of {STATIONS.length}</span>
      <h1>{station.name}</h1>
      <p>{station.text}</p>
      <p className="station-info"><ClockIcon />{station.info}</p>
      {station.photos.length > 1 && (
        <div className="station-thumbs">
          {station.photos.map((p, i) => (
            <button key={p.id} className={i === photo ? "is-on" : ""} onClick={() => setPhoto(i)} aria-label={p.caption}>
              <img src={thumbUrl(p.id)} alt="" />
            </button>
          ))}
        </div>
      )}
      <p className="station-caption">
        {current.caption} · <a href={by.page} target="_blank" rel="noreferrer">Photo: {by.name}</a>
      </p>
      {index === 0 && <p className="station-hint">Scroll, swipe or use the arrows to walk through the resort</p>}
    </section>
  );
}

function VillaHud({ villa, stop }) {
  const store = useStore.getState();
  const room = villa.photos[stop];
  const by = credit(room.id);
  return (
    <>
      <header className="topbar">
        <button className="btn btn-ghost" onClick={store.exitTour}>‹ Back to the resort</button>
        <div className="topbar-actions">
          <button className="btn btn-ghost show-narrow" onClick={() => store.setRoomsOpen(true)}>Villa &amp; price</button>
          <button className="btn btn-gold" onClick={() => store.openBooking()}>Reserve</button>
        </div>
      </header>

      <Doorways key={`doors:${villa.id}:${stop}`} />

      <section className="station room-caption" key={`${villa.id}:${stop}`} aria-live="polite">
        <span className="station-kicker">{villa.name} · room {stop + 1} of {villa.photos.length}</span>
        <h1>{room.room}</h1>
        <p>{room.caption}</p>
        <p className="station-caption">
          <a href={by.page} target="_blank" rel="noreferrer">Photo: {by.name}</a> · 3D from the photo's depth
        </p>
        {stop === 0 && <p className="station-hint">Drag to look around · hold ▲ or scroll to walk in</p>}
      </section>

      <div className="walk-pad" aria-label="Walk">
        <HoldButton dir={1} label="Walk forward">▲</HoldButton>
        <HoldButton dir={-1} label="Step back">▼</HoldButton>
      </div>

      <nav className="route" aria-label={`Rooms of ${villa.name}`}>
        <button className="route-step" onClick={() => store.setStop(stop - 1)} disabled={stop === 0} aria-label="Previous room">‹</button>
        <ol style={{ "--progress": stop / (villa.photos.length - 1) }}>
          {villa.photos.map((p, i) => (
            <li key={p.id} className={i === stop ? "is-current" : i < stop ? "is-past" : ""}>
              <button onClick={() => store.setStop(i)} aria-current={i === stop ? "step" : undefined}>
                <span className="route-dot" />
                <span className="route-name">{p.room}</span>
              </button>
            </li>
          ))}
        </ol>
        <button className="route-step" onClick={() => store.setStop(stop + 1)} disabled={stop === villa.photos.length - 1} aria-label="Next room">›</button>
      </nav>
    </>
  );
}

/**
 * The room's doorways, always in the same places: ahead at the top, the side rooms at
 * the edges, the way back in the corner. Walking to the end of a room or turning hard
 * toward a side also takes them.
 */
function Doorways() {
  const tour = useStore((s) => s.tour);
  const go = useStore((s) => s.go);
  return (
    <div className="arrows">
      {exitsHere({ tour }).map((e) => (
        <button key={e.move} className={`arrow arrow-${e.move}`} onClick={() => go(e.move)} title={`${e.label} (${KEY[e.move]})`}>
          <span className="arrow-icon"><Chevron move={e.move} /></span>
          <span className="arrow-label">{e.move === "back" && e.to !== "exit" ? `Back to ${e.label}` : e.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Hold to keep walking (into the room or back). */
function HoldButton({ dir, label, children }) {
  const start = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    roomInput.walk = dir;
  };
  const stop = () => (roomInput.walk = 0);
  return (
    <button className="walk-btn" aria-label={label} onPointerDown={start} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
      {children}
    </button>
  );
}

const KEY = { forward: "↑", back: "↓", left: "←", right: "→" };
const ROTATE = { forward: 0, right: 90, back: 180, left: -90 };

const Chevron = ({ move }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${ROTATE[move]}deg)` }} aria-hidden="true">
    <path d="M5 15l7-7 7 7" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
