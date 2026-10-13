import * as THREE from "three";

/**
 * The resort walk. Units are meters, the plateau is y = 0 and the valley (rice
 * terraces, jungle, volcano) lies toward −z beyond the cliff edge at z = −16.
 *
 *   Arrival drive (x=0, walking −z) → split gate → lobby pavilion → infinity pool
 *   → villa lane (z ≈ −1.6, walking +x past five villas) → sunset bar (x ≈ 88)
 */
const CONTROL = [
  [0, 44], [0, 32], [0, 22], [0, 12], [0, 2], [0.4, -3.2], [3.2, -5.4],
  [8.5, -5.2], [13.5, -2.6], [19, -1.6], [32, -1.6], [46, -1.6], [60, -1.6],
  [74, -1.6], [81.5, -2.4], [86, -6], [88, -10.5],
];

export const curve = new THREE.CatmullRomCurve3(
  CONTROL.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  "centripetal",
);
export const PATH_LENGTH = curve.getLength();

const SAMPLES = 1600;
const samples = curve.getSpacedPoints(SAMPLES);

export const clampDist = (d) => Math.min(Math.max(d, 0), PATH_LENGTH);

/** Point and unit tangent at a distance (meters) along the path. */
export function frameAt(dist, point = new THREE.Vector3(), tangent = new THREE.Vector3()) {
  const t = clampDist(dist) / PATH_LENGTH;
  curve.getPointAt(t, point);
  curve.getTangentAt(t, tangent);
  return { point, tangent };
}

/** Distance along the path of the path point closest to (x, z). */
export function nearestDistance(x, z) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i <= SAMPLES; i++) {
    const p = samples[i];
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return (best / SAMPLES) * PATH_LENGTH;
}

/** Horizontal distance from (x, z) to the walking path (coarse, for scattering plants). */
export function distanceToPath(x, z) {
  let bestD = Infinity;
  for (let i = 0; i <= SAMPLES; i += 4) {
    const p = samples[i];
    bestD = Math.min(bestD, (p.x - x) ** 2 + (p.z - z) ** 2);
  }
  return Math.sqrt(bestD);
}

/** Areas of the resort in walking order; `dist` is where each one starts on the path. */
export const ZONES = [
  { id: "arrival", name: "Arrival Court", short: "Arrival", at: [0, 44] },
  { id: "lobby", name: "Lobby Pavilion", short: "Lobby", at: [0, 15] },
  { id: "pool", name: "Infinity Pool", short: "Pool", at: [0, 1] },
  { id: "villas", name: "Villa Lane", short: "Villas", at: [15, -2.2] },
  { id: "sunset", name: "Sunset Bar", short: "Sunset Bar", at: [79, -1.8] },
].map((z) => ({ ...z, dist: nearestDistance(z.at[0], z.at[1]) }));

export function zoneAt(dist) {
  let zone = ZONES[0];
  for (const z of ZONES) if (dist + 0.01 >= z.dist) zone = z;
  return zone;
}

/** Path polyline in (x, z) for the minimap. */
export const PATH_POLYLINE = curve.getSpacedPoints(240).map((p) => [p.x, p.z]);
