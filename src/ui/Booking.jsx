import { useState } from "react";
import { useStore, nightsBetween } from "../store";
import { VILLAS, VILLA_BY_ID, EXTRAS, TAX_RATE, money } from "../data/villas";

/** Booking sheet: villa, dates, guests, extras, live price breakdown. A demo: nothing is charged. */
export default function Booking() {
  const booking = useStore((s) => s.booking);
  const [form, setForm] = useState({ name: "", email: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  if (!booking) return null;
  const store = useStore.getState();
  const villa = VILLA_BY_ID[booking.villaId];
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const extras = EXTRAS.filter((e) => booking.extras.includes(e.id));
  const room = villa.price * nights;
  const extrasTotal = extras.reduce((n, e) => n + e.price * (e.per === "night" ? nights : 1), 0);
  const tax = Math.round((room + extrasTotal) * TAX_RATE);
  const total = room + extrasTotal + tax;
  const today = new Date().toISOString().slice(0, 10);

  const close = () => {
    store.closeBooking();
    setDone(null);
    setError("");
  };
  const toggleExtra = (id) =>
    store.updateBooking({ extras: booking.extras.includes(id) ? booking.extras.filter((x) => x !== id) : [...booking.extras, id] });
  const submit = (e) => {
    e.preventDefault();
    if (nights < 1) return setError("Check-out must be after check-in.");
    if (!form.name.trim()) return setError("Please add the name for the booking.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Please enter a valid email address.");
    const ref = `SUN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    store.confirmBooking({ ref, ...booking, total, name: form.name });
    setDone({ ref, total, nights, villa: villa.name, checkIn: booking.checkIn });
    setError("");
  };

  return (
    <div className="overlay overlay-center" onClick={close}>
      <div className="modal booking" data-ui-scroll onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Book your stay">
        <button className="icon-btn modal-close" onClick={close} aria-label="Close">✕</button>
        {done ? (
          <div className="done">
            <div className="done-check">✓</div>
            <h2>Terima kasih, {form.name.split(" ")[0]}!</h2>
            <p>
              Your {done.nights}-night stay in the <strong>{done.villa}</strong> from {new Date(done.checkIn).toLocaleDateString("en-GB", { day: "numeric", month: "long" })} is
              requested. Reference <strong>{done.ref}</strong> · {money(done.total)}.
            </p>
            <p className="muted small">This is a demo resort, so no email is sent and nothing is charged.</p>
            <button className="btn btn-primary" onClick={close}>Back to the resort</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2>Book your stay</h2>
            <div className="booking-grid">
              <div className="booking-fields">
                <label>
                  Villa
                  <select value={booking.villaId} onChange={(e) => store.updateBooking({ villaId: e.target.value, guests: Math.min(booking.guests, VILLA_BY_ID[e.target.value].guests) })}>
                    {VILLAS.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} · {money(v.price)}/night</option>
                    ))}
                  </select>
                </label>
                <div className="row-2">
                  <label>
                    Check-in
                    <input type="date" min={today} value={booking.checkIn} onChange={(e) => store.updateBooking({ checkIn: e.target.value })} />
                  </label>
                  <label>
                    Check-out
                    <input type="date" min={booking.checkIn} value={booking.checkOut} onChange={(e) => store.updateBooking({ checkOut: e.target.value })} />
                  </label>
                </div>
                <div className="guests">
                  <span>Guests <span className="muted small">(up to {villa.guests})</span></span>
                  <div className="qty">
                    <button type="button" onClick={() => store.updateBooking({ guests: Math.max(1, booking.guests - 1) })} aria-label="Fewer guests">−</button>
                    <span>{booking.guests}</span>
                    <button type="button" onClick={() => store.updateBooking({ guests: Math.min(villa.guests, booking.guests + 1) })} aria-label="More guests">+</button>
                  </div>
                </div>
                <fieldset className="extras">
                  <legend>Add to your stay</legend>
                  {EXTRAS.map((x) => (
                    <label key={x.id} className="check">
                      <input type="checkbox" checked={booking.extras.includes(x.id)} onChange={() => toggleExtra(x.id)} />
                      <span>{x.name}</span>
                      <span className="muted">{money(x.price)}{x.per === "night" ? "/night" : ""}</span>
                    </label>
                  ))}
                </fieldset>
                <div className="row-2">
                  <label>
                    Full name
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                  </label>
                  <label>
                    Email
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
                  </label>
                </div>
              </div>
              <div className="summary" style={{ "--accent": villa.accent }}>
                <span className={`chip chip-${villa.style}`}>{villa.style === "modern" ? "Modern" : "Rustic"}</span>
                <h3>{villa.name}</h3>
                <p className="muted small">{villa.size} m² · {villa.bed}</p>
                <dl className="totals">
                  <div><dt>{money(villa.price)} × {nights} night{nights === 1 ? "" : "s"}</dt><dd>{money(room)}</dd></div>
                  {extras.map((x) => (
                    <div key={x.id}><dt>{x.name}</dt><dd>{money(x.price * (x.per === "night" ? nights : 1))}</dd></div>
                  ))}
                  <div><dt>Tax &amp; service (21%)</dt><dd>{money(tax)}</dd></div>
                  <div className="grand"><dt>Total</dt><dd>{money(total)}</dd></div>
                </dl>
                <ul className="perks">
                  <li>Breakfast every morning</li>
                  <li>Free cancellation up to 14 days before</li>
                  <li>Buggy pick-up from the lobby</li>
                </ul>
              </div>
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary btn-lg btn-block" type="submit">Request booking · {money(total)}</button>
          </form>
        )}
      </div>
    </div>
  );
}
