# SUNYI – a walkable 3D Bali resort

A hotel-booking demo where the resort *is* the interface. Visitors walk in through a Balinese split gate (candi bentar), cross the open lobby pavilion to an infinity pool facing the rice terraces, then stroll a lane of five villas. Any villa can be toured inside (entrance, bedroom, bathroom, terrace & pool, the view), compared by price and booked. A switch eases the whole scene from midday through sunset to night: torches, lanterns, lit pools, fireflies and stars.

Built with **React**, **Vite**, **three.js / React Three Fiber**, **drei** and **zustand**. No backend: the booking form is a demo.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Walk the path | Scroll, ↑ / ↓ (or W / S), or hold the ‹ › buttons | Swipe up / down |
| Look around | Drag, or ← / → | Swipe sideways |
| Tour a villa | Click its carved sign or the house, *Villas & prices*, or the map | Tap |
| Next / previous tour stop | ↑ / ↓ or the stop list | Stop buttons |
| Day / night | **N** or the sun/moon switch | Switch |
| Back to the path | Esc or ✕ | ✕ |

Shareable links: `?zone=pool` starts at an area (`arrival`, `lobby`, `pool`, `villas`, `sunset`), `?villa=cliff-infinity-villa&stop=bath` opens a villa at a tour stop (`entrance`, `bedroom`, `bath`, `terrace`, `view`), and `&time=night` starts after dark.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (netlify.toml is included)
```

## Project structure

- `src/data/path.js` – the walking route (a Catmull-Rom curve) and resort areas
- `src/data/villas.js` – villas, prices, tour stops, booking extras
- `src/data/world.js` – pools, keep-clear areas and the valley profile (cliff, jungle slope, river, rice terraces, hills)
- `src/scene/` – terrain, vegetation (instanced palms, frangipani, jungle), resort buildings, villas, people, golf carts, day/night and the camera rig
- `src/ui/` – intro, HUD (areas, map, day/night), tour panel, villa list, booking

## Credits

Furniture models: [Furniture Kit](https://kenney.nl/assets/furniture-kit) by Kenney, licensed CC0 (see `public/models/LICENSE-kenney.txt`). Everything else (architecture, people, carts, plants, landscape, textures) is generated in code. SUNYI is a fictional resort made for a portfolio.
