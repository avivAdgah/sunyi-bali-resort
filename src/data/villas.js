/**
 * The five villas, listed at the side. Inside a villa you walk through its rooms in 3D:
 * each room is a photo raised into depth with its depth map (`<id>-d.png`, see
 * ui/RoomView). `exits` are the room's doorways: forward, left, right or back, each to
 * another room's index or "exit" to leave the villa. `cover` is the list card's photo.
 *
 * Room photos must show no people (resort photos may).
 */
export const VILLAS = [
  {
    id: "garden-joglo",
    name: "Garden Joglo",
    style: "rustic",
    price: 190,
    size: 48,
    guests: 2,
    bed: "1 king canopy bed",
    poolText: "Lily pond & plunge pool",
    view: "Garden view",
    rating: 9.1,
    reviews: 214,
    left: 3,
    tagline: "A teak joglo under a thatched alang-alang roof, wrapped in frangipani and a lily pond.",
    features: ["Antique teak & terracotta", "Flower bath in the garden", "Lily pond & daybed bale", "Breakfast in the villa"],
    cover: "6YnIxGgBdQA",
    photos: [
      { id: "6YnIxGgBdQA", room: "Garden", caption: "Through the gate: a lily pond, a stone plunge pool and frangipani all around.", exits: { forward: 2, right: 1, back: "exit" } },
      { id: "a3ly0RqbZdw", room: "Daybed bale", caption: "A thatched bale with a daybed by the water, for long afternoons.", exits: { left: 2, back: 0 } },
      { id: "OaQ-p0lCmRs", room: "Courtyard lounge", caption: "Rattan chairs, lime-washed walls and the plunge pool right outside the bedroom.", exits: { forward: 3, right: 1, back: 0 } },
      { id: "3jZd5h4nJDE", room: "Bedroom", caption: "A king canopy bed under the open teak roof, cooled by a ceiling fan.", exits: { right: 4, back: 2 } },
      { id: "ZNebRQbVvBg", room: "Flower bath", caption: "A stone tub filled with frangipani petals, open to the garden.", exits: { back: 3 } },
    ],
  },
  {
    id: "rice-terrace-suite",
    name: "Rice Terrace Suite",
    style: "rustic",
    price: 280,
    size: 65,
    guests: 2,
    bed: "1 king canopy bed",
    poolText: "Private plunge pool",
    view: "Rice terrace view",
    rating: 9.3,
    reviews: 187,
    left: 2,
    tagline: "Hand-carved timber, a plunge pool with a floating daybed and the rice terraces right below your terrace.",
    features: ["Private plunge pool", "Stone bathtub", "Net hammock over the valley", "Daily canang offerings"],
    cover: "qawgWgMATzQ",
    photos: [
      { id: "ABERsC7FzCM", room: "Lounge", caption: "A built-in daybed piled with cushions, just inside the carved door.", exits: { forward: 1, right: 3, back: "exit" } },
      { id: "WQysERfYbog", room: "Bedroom", caption: "A king canopy bed with a mosquito net and teak floors.", exits: { left: 2, forward: 3, back: 0 } },
      { id: "w8FEsHwwL10", room: "Bathroom", caption: "A carved stone bathtub beside a slate wall.", exits: { back: 1 } },
      { id: "qawgWgMATzQ", room: "Terrace & pool", caption: "The plunge pool with a floating daybed, right above the rice terraces.", exits: { forward: 4, left: 1, back: 0 } },
      { id: "lJF-vml60lA", room: "The view", caption: "A net hammock strung over the valley, facing the volcano.", exits: { back: 3 } },
    ],
  },
  {
    id: "jungle-pool-villa",
    name: "Jungle Pool Villa",
    style: "modern",
    price: 420,
    size: 95,
    guests: 3,
    bed: "1 king bed + daybed",
    poolText: "5 m private pool",
    view: "Jungle view",
    rating: 9.4,
    reviews: 302,
    left: 4,
    tagline: "Clean lines, paras stone and floor-to-ceiling glass opening straight onto a private pool.",
    features: ["5 m private pool", "Floor-to-ceiling sliding glass", "Freestanding bathtub", "Outdoor daybed & sun loungers"],
    cover: "4jpU5xBQFqA",
    photos: [
      { id: "RcF3AbDcdSc", room: "Arrival", caption: "The glass pavilion seen from the garden path, behind a reflecting pool.", exits: { forward: 1, back: "exit" } },
      { id: "4jpU5xBQFqA", room: "Pool deck", caption: "A 5 m private pool along the pavilion, loungers under the parasols.", exits: { forward: 2, right: 5, back: 0 } },
      { id: "clzNiSBuVAM", room: "Living room", caption: "Sunken seating with floor-to-ceiling glass onto the pool.", exits: { forward: 3, left: 1, back: 1 } },
      { id: "fBdlytm6Hp8", room: "Bedroom", caption: "A king bed in white linen, with sliding glass doors to the garden.", exits: { right: 4, left: 1, back: 2 } },
      { id: "nYfx6BtdEeE", room: "Bathroom", caption: "A freestanding stone bathtub in slatted afternoon light.", exits: { back: 3 } },
      { id: "FRMKzS3t4u8", room: "Sun loungers", caption: "Loungers set right into the shallow end of the pool.", exits: { left: 1, back: 1 } },
    ],
  },
  {
    id: "alang-alang-family",
    name: "Alang-Alang Family Villa",
    style: "rustic",
    price: 540,
    size: 140,
    guests: 4,
    bed: "1 king canopy bed + 1 queen bed",
    poolText: "6 m private pool",
    view: "Garden & pool view",
    rating: 9.0,
    reviews: 126,
    left: 1,
    tagline: "The big thatched house: two bedrooms, a 6 m pool and plenty of lawn for the kids.",
    features: ["Sleeps four in two bedrooms", "6 m private pool", "Copper bathtub & rain shower", "Free buggy service"],
    cover: "8v9Pi_tKQoA",
    photos: [
      { id: "8v9Pi_tKQoA", room: "Arrival", caption: "The big thatched house in its own walled garden, the pool beside it.", exits: { forward: 2, right: 1, back: "exit" } },
      { id: "A12OW0VfVMo", room: "Pool terrace", caption: "A 6 m pool with loungers on the timber deck.", exits: { left: 2, back: 0 } },
      { id: "007z3qCSXVo", room: "Living & bar", caption: "The living room and breakfast bar, open to the jungle.", exits: { forward: 3, right: 4, left: 1, back: 0 } },
      { id: "diNcGNMabFI", room: "Main bedroom", caption: "A king canopy bed under a high timber roof.", exits: { right: 5, back: 2 } },
      { id: "T5pL6ciEn-I", room: "Second bedroom", caption: "A queen bed in warm teak, with a private garden view.", exits: { back: 2 } },
      { id: "_EienJTUSWI", room: "Bathroom", caption: "A copper bathtub on a river-stone floor.", exits: { back: 3 } },
    ],
  },
  {
    id: "cliff-infinity-villa",
    name: "Cliff Infinity Villa",
    style: "modern",
    price: 690,
    size: 160,
    guests: 2,
    bed: "1 super-king bed",
    poolText: "7 m infinity pool",
    view: "Valley view",
    rating: 9.7,
    reviews: 98,
    left: 1,
    tagline: "Our signature: a glass pavilion on the cliff with an infinity pool that melts into the rice fields.",
    features: ["7 m infinity pool", "All-glass bedroom", "Rain shower with a view", "Butler & floating breakfast"],
    cover: "HFhYNeRTVrM",
    photos: [
      { id: "R091q4t2k44", room: "Arrival", caption: "The modern pavilion at the cliff edge, with its own sun deck.", exits: { forward: 1, right: 4, back: "exit" } },
      { id: "RAXD1BlJmSs", room: "Bedroom", caption: "A super-king bed behind a full wall of glass onto the jungle.", exits: { forward: 4, left: 2, right: 3, back: 0 } },
      { id: "5LXM3u4HESo", room: "Reading corner", caption: "An armchair by the window and a fruit plate every afternoon.", exits: { back: 1 } },
      { id: "VSCwUAzNTvA", room: "Rain shower", caption: "A rain shower with a view over the treetops.", exits: { back: 1 } },
      { id: "HFhYNeRTVrM", room: "Infinity pool", caption: "The 7 m infinity pool that melts into the rice fields.", exits: { forward: 5, back: 1 } },
      { id: "pFKQRc5nWhY", room: "After dark", caption: "The pool and the pavilion lit up at night.", exits: { back: 4 } },
    ],
  },
];

export const VILLA_BY_ID = Object.fromEntries(VILLAS.map((v) => [v.id, v]));

export const money = (n) => `$${n.toLocaleString("en-US")}`;
export const TAX_RATE = 0.21; // Bali hotels add 21% tax & service

export const ratingWord = (r) => (r >= 9.5 ? "Exceptional" : r >= 9 ? "Superb" : r >= 8.5 ? "Excellent" : "Very good");

export const EXTRAS = [
  { id: "transfer", name: "Airport transfer (Denpasar)", price: 45, per: "stay" },
  { id: "massage", name: "Balinese massage for two", price: 70, per: "stay" },
  { id: "dinner", name: "Candle-lit dinner at the sunset bar", price: 95, per: "stay" },
  { id: "floating", name: "Floating breakfast", price: 35, per: "night" },
];
