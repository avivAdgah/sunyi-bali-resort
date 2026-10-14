import { useStore } from "../store";
import { ALL_PHOTOS, credit, thumbUrl } from "../data/photos";

/** Photographers of every photo on the site (all from Unsplash). */
export default function Credits() {
  const open = useStore((s) => s.credits);
  const setOpen = useStore((s) => s.setCredits);
  if (!open) return null;
  return (
    <div className="overlay overlay-center" onClick={() => setOpen(false)}>
      <div className="modal credits" data-ui-scroll onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Photo credits">
        <button className="icon-btn modal-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        <h2>Photo credits</h2>
        <p className="muted">
          All photos are from <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a> and used under the
          Unsplash License. They show real places in Bali and elsewhere; SUNYI itself is fictional.
        </p>
        <ul className="credit-list">
          {ALL_PHOTOS.map((id) => {
            const c = credit(id);
            return (
              <li key={id}>
                <img src={thumbUrl(id)} alt="" loading="lazy" />
                <a href={c.page} target="_blank" rel="noreferrer">{c.name}</a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
