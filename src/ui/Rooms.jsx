import { useState } from "react";
import { useStore } from "../store";
import { VILLAS, VILLA_BY_ID, money, TAX_RATE, ratingWord } from "../data/villas";
import { thumbUrl, photoUrl } from "../data/photos";

/**
 * The villa list, Booking.com style: photo, rating, key facts and the nightly price.
 * Inside a villa it becomes that villa's panel. A fixed sidebar on wide screens, a
 * drawer on narrow ones.
 */
export default function Rooms() {
  const open = useStore((s) => s.roomsOpen);
  const setOpen = useStore((s) => s.setRoomsOpen);
  const tour = useStore((s) => s.tour);
  return (
    <>
      {open && <div className="rooms-backdrop" onClick={() => setOpen(false)} />}
      <aside className={`rooms ${open ? "is-open" : ""}`} data-ui-scroll aria-label={tour ? "Villa and price" : "Villas and prices"}>
        {tour ? <VillaPanel key={tour.villaId} tour={tour} onClose={() => setOpen(false)} /> : <RoomList onClose={() => setOpen(false)} />}
      </aside>
    </>
  );
}

function RoomList({ onClose }) {
  const [style, setStyle] = useState("all");
  const [sort, setSort] = useState("rating");
  const store = useStore.getState();
  const list = VILLAS.filter((v) => style === "all" || v.style === style).sort((a, b) =>
    sort === "rating" ? b.rating - a.rating : sort === "asc" ? a.price - b.price : b.price - a.price,
  );

  return (
    <>
      <div className="rooms-head">
        <div>
          <h2>Choose your villa</h2>
          <p className="muted small">{VILLAS.length} villas · breakfast included · prices per night</p>
        </div>
        <button className="icon-btn show-narrow" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="filters">
        <div className="segmented" role="group" aria-label="Style">
          {[["all", "All"], ["rustic", "Rustic"], ["modern", "Modern"]].map(([id, label]) => (
            <button key={id} className={style === id ? "is-on" : ""} onClick={() => setStyle(id)}>{label}</button>
          ))}
        </div>
        <label className="sort">
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="rating">Top rated</option>
            <option value="asc">Price: low to high</option>
            <option value="desc">Price: high to low</option>
          </select>
        </label>
      </div>

      <ul className="room-cards">
        {list.map((v) => (
          <li key={v.id} className="room-card" onPointerEnter={() => warmVilla(v)}>
            <button className="room-photo" onClick={() => store.openTour(v.id)} aria-label={`Walk through ${v.name}`}>
              <img src={thumbUrl(v.cover)} alt="" loading="lazy" />
              <span className="room-count">{v.photos.length} rooms</span>
            </button>
            <div className="room-body">
              <div className="room-top">
                <h3>
                  <button className="link" onClick={() => store.openTour(v.id)}>{v.name}</button>
                </h3>
                <Score rating={v.rating} reviews={v.reviews} compact />
              </div>
              <p className="room-specs">{v.size} m² · {v.bed} · {v.poolText}</p>
              <ul className="room-perks">
                <li>Free cancellation</li>
                <li>Breakfast included</li>
              </ul>
              {v.left <= 2 && <p className="room-left">Only {v.left} left on our site</p>}
              <div className="room-price">
                <div>
                  <strong>{money(v.price)}</strong>
                  <span className="muted small">+{money(Math.round(v.price * TAX_RATE))} taxes · per night</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => store.openTour(v.id)}>Walk in</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="muted small rooms-foot">
        SUNYI is a fictional resort made for a portfolio. <button className="link" onClick={() => store.setCredits(true)}>Photo credits</button>
      </p>
    </>
  );
}

/** Starts downloading a villa's first rooms so walking in is instant. */
const warmed = new Set();
function warmVilla(v) {
  if (warmed.has(v.id)) return;
  warmed.add(v.id);
  v.photos.slice(0, 3).forEach((p) => (new Image().src = photoUrl(p.id)));
}

export function Score({ rating, reviews, compact = false }) {
  return (
    <div className={`score ${compact ? "is-compact" : ""}`}>
      <div className="score-text">
        <strong>{ratingWord(rating)}</strong>
        <span>{reviews} reviews</span>
      </div>
      <span className="score-badge">{rating.toFixed(1)}</span>
    </div>
  );
}

/** While inside a villa: its price and Reserve, the rooms to walk to, and the way out. */
function VillaPanel({ tour, onClose }) {
  const villa = VILLA_BY_ID[tour.villaId];
  const store = useStore.getState();
  const index = VILLAS.indexOf(villa);
  const neighbour = (d) => VILLAS[(index + d + VILLAS.length) % VILLAS.length];
  return (
    <div className="villa-panel">
      <div className="rooms-head">
        <span className={`chip chip-${villa.style}`}>{villa.style === "modern" ? "Modern" : "Rustic"}</span>
        <button className="icon-btn show-narrow" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <h2>{villa.name}</h2>
      <p className="muted small">{villa.tagline}</p>
      <div className="price-box">
        <Score rating={villa.rating} reviews={villa.reviews} />
        <div className="price-line">
          <strong>{money(villa.price)}</strong>
          <span className="muted small">per night · +{money(Math.round(villa.price * TAX_RATE))} taxes &amp; service</span>
        </div>
        <ul className="room-perks">
          <li>Free cancellation up to 14 days before</li>
          <li>Breakfast included</li>
        </ul>
        <button className="btn btn-primary btn-lg btn-block" onClick={() => store.openBooking(villa.id)}>Reserve</button>
        {villa.left <= 2 && <p className="room-left center">Only {villa.left} left on our site</p>}
      </div>

      <h3 className="field-label">Rooms · {tour.stop + 1}/{villa.photos.length}</h3>
      <ol className="tour-rooms">
        {villa.photos.map((p, i) => (
          <li key={p.id}>
            <button className={i === tour.stop ? "is-on" : ""} onClick={() => { store.setStop(i); onClose(); }}>
              <img src={thumbUrl(p.id)} alt="" loading="lazy" />
              <span>{p.room}</span>
            </button>
          </li>
        ))}
      </ol>
      <dl className="specs">
        <div><dt>Size</dt><dd>{villa.size} m²</dd></div>
        <div><dt>Guests</dt><dd>Up to {villa.guests}</dd></div>
        <div><dt>Beds</dt><dd>{villa.bed}</dd></div>
        <div><dt>Pool</dt><dd>{villa.poolText}</dd></div>
      </dl>
      <button className="btn btn-ghost btn-block" onClick={() => store.openVilla(villa.id)}>All photos &amp; facilities</button>
      <div className="panel-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => store.openTour(neighbour(-1).id)}>‹ {neighbour(-1).name}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => store.openTour(neighbour(1).id)}>{neighbour(1).name} ›</button>
      </div>
      <button className="link center-block" onClick={store.exitTour}>Back to the resort</button>
    </div>
  );
}
