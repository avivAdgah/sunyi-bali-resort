import { useState } from "react";
import { useStore } from "../store";
import { VILLAS, money } from "../data/villas";

/** All villas side by side, filterable by style and sortable by price. */
export default function VillaList() {
  const open = useStore((s) => s.listOpen);
  const [style, setStyle] = useState("all");
  const [sort, setSort] = useState("asc");
  if (!open) return null;
  const store = useStore.getState();
  const list = VILLAS.filter((v) => style === "all" || v.style === style).sort((a, b) => (sort === "asc" ? a.price - b.price : b.price - a.price));

  return (
    <div className="overlay" onClick={() => store.setListOpen(false)}>
      <aside className="drawer" data-ui-scroll onClick={(e) => e.stopPropagation()} aria-label="Villas and prices">
        <div className="panel-top">
          <h2>Villas &amp; prices</h2>
          <button className="icon-btn" onClick={() => store.setListOpen(false)} aria-label="Close">✕</button>
        </div>
        <p className="muted">Five villas, all with breakfast, buggy service and the valley view. Prices per night before 21% tax &amp; service.</p>
        <div className="filters">
          <div className="segmented" role="group" aria-label="Style">
            {[["all", "All"], ["rustic", "Rustic"], ["modern", "Modern"]].map(([id, label]) => (
              <button key={id} className={style === id ? "is-on" : ""} onClick={() => setStyle(id)}>{label}</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setSort(sort === "asc" ? "desc" : "asc")}>
            Price {sort === "asc" ? "↑" : "↓"}
          </button>
        </div>
        <ul className="villa-cards">
          {list.map((v) => (
            <li key={v.id} className="villa-card" style={{ "--accent": v.accent }}>
              <div className="villa-card-top">
                <span className={`chip chip-${v.style}`}>{v.style === "modern" ? "Modern" : "Rustic"}</span>
                <span className="villa-card-price">{money(v.price)}<small>/night</small></span>
              </div>
              <h3>{v.name}</h3>
              <p className="muted small">{v.tagline}</p>
              <p className="villa-card-specs">{v.size} m² · up to {v.guests} guests · {v.pool ? (v.pool.infinity ? "infinity pool" : "private pool") : "lily pond"}</p>
              <div className="villa-card-actions">
                <button className="btn btn-primary btn-sm btn-grow" onClick={() => store.openTour(v.id)}>Take the tour</button>
                <button className="btn btn-ghost btn-sm" onClick={() => store.openBooking(v.id)}>Book</button>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
