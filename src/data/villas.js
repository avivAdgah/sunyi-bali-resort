import { nearestDistance } from "./path";

/**
 * Villas along the lane. Each plot is 11 m wide, centred on `x`. Plot-local
 * coordinates: origin at the gate in the front wall (lane side), local −z runs
 * toward the valley, so world = [x + lx, ly, PLOT_Z + lz]. The cliff edge is at
 * local z ≈ −13.2.
 *
 *   front wall z −0.2 · garden · building z −2.6 … −8.2 · terrace · pool · cliff
 */
export const PLOT_Z = -2.8;
export const PLOT_W = 11;
export const DOOR_X = 0.8; // gate and front door sit on this local x

export const VILLAS = [
  {
    id: "garden-joglo",
    name: "Garden Joglo",
    style: "rustic",
    price: 190,
    size: 48,
    guests: 2,
    bed: "King canopy bed",
    x: 22,
    pool: null,
    pond: true,
    accent: "#B8643A",
    tagline: "A teak joglo under a thatched alang-alang roof, wrapped in frangipani and a lily pond.",
    features: ["Antique teak & terracotta", "Stone bathtub with a garden view", "Lily pond & daybed", "Breakfast in the villa"],
  },
  {
    id: "rice-terrace-suite",
    name: "Rice Terrace Suite",
    style: "rustic",
    price: 280,
    size: 65,
    guests: 2,
    bed: "King canopy bed",
    x: 34,
    pool: { w: 3.6, d: 3 },
    accent: "#8A9A3B",
    tagline: "Hand-carved timber, a plunge pool and the terraces right below your terrace.",
    features: ["Private plunge pool", "Carved timber & alang-alang roof", "Bath with a rice-terrace view", "Daily canang offerings"],
  },
  {
    id: "jungle-pool-villa",
    name: "Jungle Pool Villa",
    style: "modern",
    price: 420,
    size: 95,
    guests: 3,
    bed: "King bed + daybed",
    x: 46,
    pool: { w: 5.2, d: 3.1 },
    accent: "#2F6B5B",
    tagline: "Clean lines, paras stone and floor-to-ceiling glass opening onto a private pool.",
    features: ["5 m private pool", "Floor-to-ceiling sliding glass", "Freestanding bathtub", "Outdoor daybed & sun loungers"],
  },
  {
    id: "alang-alang-family",
    name: "Alang-Alang Family Villa",
    style: "rustic",
    price: 540,
    size: 140,
    guests: 4,
    bed: "King canopy bed + 2 daybeds",
    x: 58,
    pool: { w: 6, d: 3.2 },
    accent: "#9B6A3A",
    tagline: "The big thatched house: room for four, a 6 m pool and a kids' daybed by the view.",
    features: ["Sleeps four", "6 m private pool", "Outdoor bath & rain shower", "Free buggy service"],
  },
  {
    id: "cliff-infinity-villa",
    name: "Cliff Infinity Villa",
    style: "modern",
    price: 690,
    size: 160,
    guests: 2,
    bed: "Super-king bed",
    x: 70,
    pool: { w: 7, d: 3.2, infinity: true },
    accent: "#1F4E66",
    tagline: "Our signature: a glass pavilion on the cliff with an infinity pool that melts into the valley.",
    features: ["7 m infinity pool on the cliff edge", "All-glass bedroom", "Bathtub facing the volcano", "Butler & floating breakfast"],
  },
].map((v) => ({ ...v, dist: nearestDistance(v.x + DOOR_X, PLOT_Z + 1) }));

export const VILLA_BY_ID = Object.fromEntries(VILLAS.map((v) => [v.id, v]));

/** Tour viewpoints inside a villa (plot-local). The camera travels between them. */
export const STOPS = [
  { id: "entrance", name: "Entrance", pos: [DOOR_X, 1.9, -3.2], look: [-0.6, 1.1, -10] },
  { id: "bedroom", name: "Bedroom", pos: [1.1, 1.8, -6.9], look: [-1.5, 0.9, -3.8] },
  { id: "bath", name: "Bathroom", pos: [2.75, 1.8, -3.0], look: [3.0, 0.7, -8.5], via: [2.5, 1.8, -6.7] },
  { id: "terrace", name: "Terrace & pool", pos: [0.2, 1.9, -8.9], look: [-0.8, -1.6, -24] },
  { id: "view", name: "The view", pos: [4.5, 1.75, -12.6], look: [-3, -3.5, -60] },
];
export const STOP_BY_ID = Object.fromEntries(STOPS.map((s, i) => [s.id, i]));

/** Plot-local → world. */
export const toWorld = (villa, [x, y, z]) => [villa.x + x, y, PLOT_Z + z];

/** Waypoints the camera passes through when entering a villa from the lane. */
export const GATE_OUT = [DOOR_X, 1.7, 1.1];
export const GATE_IN = [DOOR_X, 1.85, -1.4];

export const money = (n) => `$${n.toLocaleString("en-US")}`;
export const TAX_RATE = 0.21; // Bali hotels add 21% tax & service

export const EXTRAS = [
  { id: "transfer", name: "Airport transfer (Denpasar)", price: 45, per: "stay" },
  { id: "massage", name: "Balinese massage for two", price: 70, per: "stay" },
  { id: "dinner", name: "Candle-lit dinner at the sunset bar", price: 95, per: "stay" },
  { id: "floating", name: "Floating breakfast", price: 35, per: "night" },
];
