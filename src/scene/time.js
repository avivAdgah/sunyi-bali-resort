import * as THREE from "three";

/**
 * Day ↔ night blend shared by the whole scene. `TIME.mix` is 0 at midday and 1 at
 * night; DayNight eases it and calls every registered updater when it changes, so
 * lamps, water, glass and lanterns fade in together without React re-renders.
 */
export const TIME = { mix: 0, t: 0 };
const updaters = new Set();

export function onTime(fn) {
  updaters.add(fn);
  fn(TIME.mix);
  return () => updaters.delete(fn);
}

export function setMix(mix) {
  TIME.mix = mix;
  updaters.forEach((fn) => fn(mix));
}

export const lerp = THREE.MathUtils.lerp;

/** Three-stop colour ramp: day → dusk → night. */
export function ramp(out, day, dusk, night, mix) {
  if (mix < 0.5) return out.copy(day).lerp(dusk, mix * 2);
  return out.copy(dusk).lerp(night, (mix - 0.5) * 2);
}

/** Makes a material glow at night: emissiveIntensity eases from `day` to `night`. */
export function glowAtNight(material, day = 0, night = 1.5) {
  onTime((m) => {
    material.emissiveIntensity = lerp(day, night, m);
  });
  return material;
}

/** Fades a material's opacity with the night blend (glow halos, stars, flames). */
export function fadeAtNight(material, day = 0, night = 1) {
  onTime((m) => {
    material.opacity = lerp(day, night, m);
    material.visible = material.opacity > 0.01;
  });
  return material;
}
