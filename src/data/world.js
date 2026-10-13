import { VILLAS, PLOT_Z, PLOT_W } from "./villas";

export const EDGE_Z = -16; // the plateau ends here and the valley drops away

/** Every body of water on the plateau, in world coordinates. Holes are cut in the lawn for these. */
export const POOLS = [
  { id: "main", x0: -14, x1: 8, z0: -15.4, z1: -7.6, depth: 1.4, infinity: true },
  { id: "lotus", x0: 41, x1: 49, z0: 3.2, z1: 7.4, depth: 0.5, pond: true },
  ...VILLAS.flatMap((v) => {
    if (v.pool) {
      const x0 = v.x - 4.6;
      const z1 = PLOT_Z - 9.9;
      return [{ id: v.id, x0, x1: x0 + v.pool.w, z0: z1 - v.pool.d, z1, depth: 1.3, infinity: v.pool.infinity }];
    }
    if (v.pond) return [{ id: v.id, x0: v.x - 4.4, x1: v.x - 0.6, z0: PLOT_Z - 12.4, z1: PLOT_Z - 10, depth: 0.5, pond: true }];
    return [];
  }),
];

/** Footprints that plants must keep clear of: [x0, z0, x1, z1]. */
export const KEEP_CLEAR = [
  [-9, 1, 9, 15.5], // lobby
  [-17, -16, 11, -3], // pool deck
  [-23, -14, -14, -6], // pool bar
  [-4.5, 15, 4.5, 60], // arrival drive
  [-3.5, 13, 90, 21], // service road
  [24, 4, 37, 12.5], // restaurant
  [51, 4, 63, 12.5], // spa
  [40, 2.6, 50, 8], // lotus pond
  [67, 4, 75, 11], // yoga bale
  [77, -16, 97, 0], // sunset deck
  ...VILLAS.map((v) => [v.x - PLOT_W / 2, -16, v.x + PLOT_W / 2, -0.3]),
];

export const inRect = (x, z, [x0, z0, x1, z1], pad = 0) => x > x0 - pad && x < x1 + pad && z > z0 - pad && z < z1 + pad;
export const isClear = (x, z, pad = 0) => !KEEP_CLEAR.some((r) => inRect(x, z, r, pad));

const smoothstep = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** Valley profile, by distance d from the cliff edge. */
export const VALLEY = { cliff: 3, cliffDrop: 4.5, slopeEnd: 44, floor: -24, river: 53, floorEnd: 62, step: 3.8, rise: 1, terraceEnd: 250 };

/**
 * Ground below the cliff (z < EDGE_Z), Tegallalang style: a short cliff, a steep jungle
 * slope down to a river, then rice terraces climbing the far side toward the viewer,
 * then jungle hills. Returns { h, k, f, d, zone }: height, terrace index (−1 off the
 * terraces), position across the terrace (0…1, riser near 1), distance from the edge.
 * `stepped = false` gives a smooth surface that always lies at or below the stepped one.
 */
export function valley(x, z, stepped = true) {
  const V = VALLEY;
  const d = Math.max(0, EDGE_Z - z);
  if (d < V.cliff) return { h: -(d / V.cliff) * V.cliffDrop, k: -1, f: 0, d, zone: "cliff" };
  if (d < V.slopeEnd) {
    const t = (d - V.cliff) / (V.slopeEnd - V.cliff);
    const bumps = Math.sin(x * 0.21 + d * 0.3) * Math.sin(d * 0.5) * 0.6 * t * (1 - t) * 4;
    return { h: -V.cliffDrop + (V.floor + V.cliffDrop) * (1 - (1 - t) * (1 - t)) + bumps, k: -1, f: 0, d, zone: "slope" };
  }
  if (d < V.floorEnd) {
    const r = Math.abs(d - V.river + Math.sin(x * 0.03) * 3);
    return { h: V.floor - Math.max(0, 1 - r / 3.2) * 1.4, k: -1, f: 0, d, zone: r < 2.4 ? "river" : "floor" };
  }
  const wave = (Math.sin(x * 0.04) * 5 + Math.sin(x * 0.1 + 1.3) * 2) * smoothstep(V.floorEnd, V.floorEnd + 15, d);
  const td = Math.max(0, d - V.floorEnd + wave);
  const k = Math.floor(td / V.step);
  const f = td / V.step - k;
  const linear = V.floor + (td / V.step) * V.rise;
  const terr = stepped ? V.floor + (k + smoothstep(0.84, 1, f)) * V.rise : linear - V.rise;
  // Beyond the terraces: jungle hills rising toward the horizon.
  const far = smoothstep(V.terraceEnd - 10, V.terraceEnd + 50, d);
  const hills =
    (Math.sin(x * 0.011 + 0.6) * Math.sin(z * 0.014 + 1.1) * 0.5 + 0.5) * 45 +
    Math.sin(x * 0.031 + z * 0.02) * 7 +
    Math.max(0, d - 320) * 0.25;
  const hillH = linear + hills * smoothstep(V.terraceEnd - 10, V.terraceEnd + 160, d);
  return { h: terr * (1 - far) + hillH * far, k: far > 0.5 ? -1 : k, f, d, zone: far > 0.5 ? "hills" : "terrace" };
}
