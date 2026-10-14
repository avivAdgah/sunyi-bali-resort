# SUNYI – Bali Jungle Retreat

A hotel-booking demo told in real photographs, in two parts.

**The resort.** A path through the resort's facilities (temple gate, lobby courtyard, infinity pool, warung restaurant, jungle spa, yoga shala, rice-terrace walk and sunset bar), one full-screen photo per place. Each step is a walk: the camera moves into the photo and the next place opens up from its middle while the light of the place you left lingers at the edges.

**The villas.** Five villas are listed Booking.com-style at the side, with rating, key facts and nightly price. Stepping into one lets you walk through its rooms in 3D. Each room is a real photo raised into depth with a depth map, so moving the camera gives true parallax: drag to turn your head and look around, hold ▲ / ↑ (or scroll) to walk into the room, and walk on past its end to go through the doorway into the next room. Side doorways and the way back are at the screen edges. Where a photo has no information (behind furniture, beyond its frame) a soft blurred copy fills in.

Built with **React**, **Vite**, **three.js / React Three Fiber** and **zustand**. No backend: the booking form is a demo.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Walk the resort | Scroll, ↑ / ↓, the ‹ › buttons or a stop on the path | Swipe |
| Step into a villa | *Walk in* in the list on the right | *Villas* button |
| Look around a room | Drag | Drag |
| Walk into a room / back | Hold ▲ ▼, ↑ ↓ (W S) or scroll | Hold ▲ ▼, or swipe up |
| Go through a doorway | Walk past the end of the room, the doorway buttons, or ← → | Doorway buttons |
| Leave the villa | *Back to the resort* or Esc | *Back to the resort* |

Shareable links: `?zone=pool` starts at a facility (`arrival`, `lobby`, `pool`, `restaurant`, `spa`, `yoga`, `terraces`, `sunset`) and `?villa=cliff-infinity-villa&room=2` steps into a villa at a given room.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (netlify.toml is included)
```

## Project structure

- `src/data/resort.js` – the facilities along the path, with text, opening hours and photos
- `src/data/villas.js` – villas, prices, ratings, and their rooms with the doorways between them
- `src/data/photos.js` – photo, thumbnail and depth-map URLs, and photographer credits
- `src/ui/Stage.jsx` – the resort path and the keyboard / scroll / swipe controls
- `src/ui/RoomView.jsx` – the villa rooms in 3D: depth-displaced photo meshes, walking, looking, doorways
- `src/ui/` – HUD, villa list, villa page, booking, credits, intro

## Photos and depth maps

All photos come from [Unsplash](https://unsplash.com) under the [Unsplash License](https://unsplash.com/license) and are stored in `public/photos` (`<id>.jpg` at 2000 px, `<id>-s.jpg` at 640 px). Each villa room photo also has `<id>-d.png`, a depth map (near = white) estimated with [Depth Anything V2](https://huggingface.co/onnx-community/depth-anything-v2-small). To add a room, add its photo, generate its depth map with the same model, and list it in `src/data/villas.js`. The photographers are listed in `src/data/photos.js` and in the *Photo credits* window on the site. SUNYI is a fictional resort made for a portfolio.
