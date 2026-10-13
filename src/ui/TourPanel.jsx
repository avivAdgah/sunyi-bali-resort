import { useStore } from "../store";
import { VILLAS, VILLA_BY_ID, STOPS, money } from "../data/villas";
import { TimeToggle } from "./Hud";

/** Villa details while touring: price, specs, tour stops, day/night, booking. */
export default function TourPanel() {
  const tour = useStore((s) => s.tour);
  const night = useStore((s) => s.night);
  if (!tour) return null;
  const villa = VILLA_BY_ID[tour.villaId];
  const store = useStore.getState();
  const index = VILLAS.indexOf(villa);
  const neighbour = (d) => VILLAS[(index + d + VILLAS.length) % VILLAS.length];

  return (
    <aside className="panel" data-ui-scroll key={villa.id} aria-label={`${villa.name} tour`}>
      <div className="panel-top">
        <span className={`chip chip-${villa.style}`}>{villa.style === "modern" ? "Modern" : "Rustic"}</span>
        <button className="icon-btn" onClick={store.exitTour} aria-label="Back to the path">✕</button>
      </div>
      <h2>{villa.name}</h2>
      <p className="tagline">{villa.tagline}</p>
      <div className="price-row">
        <span className="price">{money(villa.price)}</span>
        <span className="muted">per night · breakfast included</span>
      </div>
      <dl className="specs">
        <div><dt>Size</dt><dd>{villa.size} m²</dd></div>
        <div><dt>Guests</dt><dd>Up to {villa.guests}</dd></div>
        <div><dt>Bed</dt><dd>{villa.bed}</dd></div>
        <div><dt>Pool</dt><dd>{villa.pool ? `${villa.pool.w} × ${villa.pool.d} m${villa.pool.infinity ? " infinity" : ""}` : "Lily pond"}</dd></div>
      </dl>

      <div className="field-label">Virtual tour · {tour.stop + 1}/{STOPS.length}</div>
      <ol className="stops">
        {STOPS.map((s, i) => (
          <li key={s.id}>
            <button className={i === tour.stop ? "is-on" : ""} onClick={() => store.setStop(i)}>
              <span className="stop-num">{i + 1}</span>
              {s.name}
            </button>
          </li>
        ))}
      </ol>
      <div className="time-row">
        <div>
          <strong>{night ? "Night view" : "Day view"}</strong>
          <span className="muted small">{night ? "Lanterns, torches and a lit pool" : "Midday light over the terraces"}</span>
        </div>
        <TimeToggle label />
      </div>

      <ul className="perks">
        {villa.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <button className="btn btn-primary btn-block btn-lg" onClick={() => store.openBooking(villa.id)}>
        Book {villa.name} · {money(villa.price)}/night
      </button>
      <div className="panel-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => store.openTour(neighbour(-1).id)}>‹ {neighbour(-1).name}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => store.openTour(neighbour(1).id)}>{neighbour(1).name} ›</button>
      </div>
      <p className="muted small center">Drag to look around · ↑ ↓ next stop · Esc back to the path</p>
    </aside>
  );
}
