import * as THREE from "three";
import {
  thatchTexture,
  woodTexture,
  brickTexture,
  stoneTexture,
  renderTexture,
  terrazzoTexture,
  terracottaTexture,
  polengTexture,
  glowTexture,
} from "./textures";
import { glowAtNight, fadeAtNight } from "./time";

/** Box whose texture repeats every `tile` meters on every face. */
export function mBox(w, h, d, tile = 1) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  // Face order: +x, −x, +y, −y, +z, −z (4 vertices each).
  const sizes = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++)
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, (uv.getX(i) * sizes[f][0]) / tile, (uv.getY(i) * sizes[f][1]) / tile);
    }
  return g;
}

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });

export const M = {
  thatch: std({ map: thatchTexture(), roughness: 1, side: THREE.DoubleSide }),
  teak: std({ map: woodTexture("teak"), roughness: 0.7 }),
  lightWood: std({ map: woodTexture("light"), roughness: 0.7 }),
  deck: std({ map: woodTexture("deck"), roughness: 0.8 }),
  brick: std({ map: brickTexture() }),
  stone: std({ map: stoneTexture() }),
  render: std({ map: renderTexture(), roughness: 0.92 }),
  terrazzo: std({ map: terrazzoTexture(), roughness: 0.45 }),
  terracotta: std({ map: terracottaTexture(), roughness: 0.7 }),
  poleng: std({ map: polengTexture(), roughness: 0.9 }),
  darkStone: std({ color: "#5D5A50", roughness: 0.95 }),
  bamboo: std({ color: "#C8A867", roughness: 0.7 }),
  linen: std({ color: "#F6F1E7", roughness: 0.95 }),
  cushion: std({ color: "#EFE7D8", roughness: 0.95 }),
  black: std({ color: "#2A2826", roughness: 0.6 }),
  brass: std({ color: "#C9A15A", roughness: 0.35, metalness: 0.7 }),
  white: std({ color: "#FAF8F3", roughness: 0.4 }),
  sheer: new THREE.MeshStandardMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.35, side: THREE.DoubleSide, roughness: 1, depthWrite: false }),
  glass: new THREE.MeshStandardMaterial({
    color: "#BFD8DA",
    transparent: true,
    opacity: 0.18,
    roughness: 0.05,
    metalness: 0.3,
    emissive: new THREE.Color("#FFB866"),
    emissiveIntensity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  // Lamp shades, lantern panes and window glow: dim by day, warm by night.
  lamp: std({ color: "#FFE9C2", emissive: new THREE.Color("#FFC56E"), roughness: 0.6 }),
  flowerRed: std({ color: "#D8344F" }),
  flowerYellow: std({ color: "#F4C430" }),
  leaf: std({ color: "#4E8A35", side: THREE.DoubleSide }),
};
glowAtNight(M.lamp, 0.15, 2.4);
glowAtNight(M.glass, 0, 0.32);

/** Additive glow halo material per colour; invisible by day. */
const halos = {};
export function haloMaterial(color = "#FFC778", strength = 0.9) {
  const key = `${color}:${strength}`;
  if (!halos[key]) {
    halos[key] = fadeAtNight(
      new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      0,
      strength,
    );
  }
  return halos[key];
}

// Shared geometries.
export const G = {
  unitBox: new THREE.BoxGeometry(1, 1, 1),
  post: new THREE.CylinderGeometry(0.09, 0.1, 1, 8),
  sphere: new THREE.SphereGeometry(1, 16, 12),
};
