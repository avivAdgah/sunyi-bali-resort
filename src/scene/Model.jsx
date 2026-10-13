import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { glowAtNight } from "./time";

/** Kenney kit units → meters (a kit sofa is 0.98 units wide ≈ a 2 m sofa). */
export const KIT_SCALE = 2.1;

// Tropical defaults that replace the kit's bright colours: teak, linen, rattan, brass.
export const DEFAULT_COLORS = {
  carpet: "#E9E1D2",
  carpetBlue: "#A7B79C",
  carpetDarker: "#C9B79A",
  carpetWhite: "#F7F3EA",
  wood: "#8A5A35",
  woodDark: "#5E3B22",
  metal: "#C9A15A",
  metalMedium: "#8A7550",
  metalDark: "#3C3530",
  metalLight: "#F2F0EA",
  plant: "#4E8A3A",
  lamp: "#FFF0D2",
  glass: "#CFE3E0",
  _defaultMat: "#F1ECE2",
};

const boxes = new Map();
function modelBox(model, scene) {
  if (!boxes.has(model)) {
    scene.updateMatrixWorld(true);
    boxes.set(model, new THREE.Box3().setFromObject(scene));
  }
  return boxes.get(model);
}

/** A kit model (centred on x/z, standing on y = 0) with its own recoloured materials. */
export function KitModel({ model, colors, scale = 1, ...props }) {
  const { scene } = useGLTF(`/models/${model}.glb`);
  const { object, materials } = useMemo(() => {
    const object = scene.clone(true);
    const materials = {};
    object.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const own = (Array.isArray(o.material) ? o.material : [o.material]).map((m) => {
        const c = m.clone();
        c.roughness = c.name.startsWith("metal") ? 0.4 : 0.85;
        c.metalness = c.name.startsWith("metal") ? 0.5 : 0;
        (materials[c.name] ||= []).push(c);
        return c;
      });
      o.material = Array.isArray(o.material) ? own : own[0];
    });
    const box = modelBox(model, scene);
    const center = box.getCenter(new THREE.Vector3());
    object.position.set(-center.x, -box.min.y, -center.z);
    return { object, materials };
  }, [scene, model]);

  const colorKey = colors ? JSON.stringify(colors) : "";
  useLayoutEffect(() => {
    for (const [name, mats] of Object.entries(materials)) {
      const color = colors?.[name] ?? DEFAULT_COLORS[name];
      for (const m of mats) {
        if (color) m.color.set(color);
        if (name === "lamp" && !m.userData.glow) {
          m.emissive.set("#FFC56E");
          m.userData.glow = true;
          glowAtNight(m, 0.3, 2.6);
        } else if (name === "glass") {
          m.transparent = true;
          m.opacity = 0.45;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials, colorKey]);

  return (
    <group {...props} scale={KIT_SCALE * scale}>
      <primitive object={object} />
    </group>
  );
}

export const preloadModels = (names) => names.forEach((n) => useGLTF.preload(`/models/${n}.glb`));
