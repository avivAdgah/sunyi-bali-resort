import { useEffect, useState } from "react";
import { useStore } from "../store";
import { VILLAS, VILLA_BY_ID, money, TAX_RATE } from "../data/villas";
import { photoUrl, thumbUrl, credit } from "../data/photos";
import { Score } from "./Rooms";

/** A villa's page: photo gallery, facts, facilities and the price box. */
export default function VillaDetail() {
  const id = useStore((s) => s.villa);
  const [viewer, setViewer] = useState(null); // photo index in the full-screen viewer
  useEffect(() => setViewer(null), [id]);
  if (!id) return null;
  const villa = VILLA_BY_ID[id];
  const store = useStore.getState();
  const index = VILLAS.indexOf(villa);
  const neighbour = (d) => VILLAS[(index + d + VILLAS.length) % VILLAS.length];
  const [hero, ...rest] = villa.photos;

  return (
    <div className="overlay overlay-center" onClick={store.closeVilla}>
      <article className="modal villa" data-ui-scroll onClick={(e) => e.stopPropagation()} role="dialog" aria-label={villa.name}>
        <button className="icon-btn modal-close" onClick={store.closeVilla} aria-label="Close">✕</button>
        <header className="villa-head">
          <span className={`chip chip-${villa.style}`}>{villa.style === "modern" ? "Modern" : "Rustic"}</span>
          <h2>{villa.name}</h2>
          <p className="muted">{villa.tagline}</p>
        </header>

        <div className={`gallery gallery-${Math.min(rest.length, 4)}`}>
          <button className="gallery-hero" onClick={() => setViewer(0)}>
            <img src={photoUrl(hero.id)} alt={hero.caption} />
          </button>
          {rest.slice(0, 4).map((p, i) => (
            <button key={p.id} onClick={() => setViewer(i + 1)}>
              <img src={thumbUrl(p.id)} alt={p.caption} loading="lazy" />
            </button>
          ))}
        </div>

        <div className="villa-grid">
          <div>
            <dl className="specs">
              <div><dt>Size</dt><dd>{villa.size} m²</dd></div>
              <div><dt>Guests</dt><dd>Up to {villa.guests}</dd></div>
              <div><dt>Beds</dt><dd>{villa.bed}</dd></div>
              <div><dt>Pool</dt><dd>{villa.poolText}</dd></div>
            </dl>
            <h3 className="field-label">Most popular facilities</h3>
            <ul className="facilities">
              {[...villa.features, villa.view, "Free WiFi", "Air conditioning", "Daily housekeeping"].map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <aside className="price-box">
            <Score rating={villa.rating} reviews={villa.reviews} />
            <div className="price-line">
              <strong>{money(villa.price)}</strong>
              <span className="muted small">per night · +{money(Math.round(villa.price * TAX_RATE))} taxes &amp; service</span>
            </div>
            <ul className="room-perks">
              <li>Free cancellation up to 14 days before</li>
              <li>Breakfast included</li>
              <li>No prepayment needed</li>
            </ul>
            <button className="btn btn-primary btn-lg btn-block" onClick={() => store.openBooking(villa.id)}>Reserve</button>
            <button className="btn btn-ghost btn-block" onClick={() => (store.tour?.villaId === villa.id ? store.closeVilla() : store.openTour(villa.id))}>
              Walk through the villa
            </button>
            {villa.left <= 2 && <p className="room-left center">Only {villa.left} left on our site</p>}
          </aside>
        </div>

        <div className="panel-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => store.openVilla(neighbour(-1).id)}>‹ {neighbour(-1).name}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => store.openVilla(neighbour(1).id)}>{neighbour(1).name} ›</button>
        </div>
      </article>
      {viewer !== null && <Viewer photos={villa.photos} index={viewer} setIndex={setViewer} />}
    </div>
  );
}

/** Full-screen photo viewer with arrows, keys and thumbnails. */
function Viewer({ photos, index, setIndex }) {
  const go = (d) => setIndex((index + d + photos.length) % photos.length);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") {
        e.stopImmediatePropagation();
        setIndex(null);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });
  const p = photos[index];
  const by = credit(p.id);
  return (
    <div className="viewer" onClick={(e) => { e.stopPropagation(); setIndex(null); }} role="dialog" aria-label="Photos">
      <button className="icon-btn viewer-close" aria-label="Close photos">✕</button>
      <figure onClick={(e) => e.stopPropagation()}>
        <img key={p.id} src={photoUrl(p.id)} alt={p.caption} />
        <figcaption>
          {p.caption} · {index + 1}/{photos.length} · <a href={by.page} target="_blank" rel="noreferrer">Photo: {by.name}</a>
        </figcaption>
      </figure>
      <button className="viewer-arrow is-prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo">‹</button>
      <button className="viewer-arrow is-next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo">›</button>
      <div className="viewer-thumbs" onClick={(e) => e.stopPropagation()}>
        {photos.map((x, i) => (
          <button key={x.id} className={i === index ? "is-on" : ""} onClick={() => setIndex(i)} aria-label={x.caption}>
            <img src={thumbUrl(x.id)} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}
