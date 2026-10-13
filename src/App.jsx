import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import DayNight from "./scene/DayNight";
import Terrain from "./scene/Terrain";
import Vegetation from "./scene/Vegetation";
import Resort from "./scene/Resort";
import Villa from "./scene/Villa";
import People from "./scene/People";
import Carts from "./scene/Carts";
import CameraRig from "./scene/CameraRig";
import { preloadModels } from "./scene/Model";
import { VILLAS } from "./data/villas";
import Intro from "./ui/Intro";
import Hud from "./ui/Hud";
import TourPanel from "./ui/TourPanel";
import VillaList from "./ui/VillaList";
import Booking from "./ui/Booking";

preloadModels([
  "bedDouble", "rugRectangle", "rugRound", "cabinetBedDrawerTable", "lampRoundTable", "pillowLong", "loungeSofa",
  "loungeDesignChair", "tableCoffee", "lampRoundFloor", "pottedPlant", "books", "plantSmall2", "stoolBar",
  "tableRound", "chairCushion", "loungeChairRelax",
]);

/** Canvas textures draw text with the web fonts, so wait for them (with a timeout fallback). */
function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const fonts = ["700 40px 'Cormorant Garamond'", "600 40px Manrope", "800 40px Manrope"].map((f) => document.fonts.load(f));
    const timeout = new Promise((r) => setTimeout(r, 2500));
    Promise.race([Promise.all(fonts), timeout]).then(() => setReady(true));
  }, []);
  return ready;
}

export default function App() {
  const fontsReady = useFontsReady();
  return (
    <>
      <Canvas
        className="scene"
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh" }}
        resize={{ debounce: 0 }}
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 62, near: 0.1, far: 3000, position: [0, 1.62, 44] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <fog attach="fog" args={["#C7DAE0", 90, 520]} />
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={2} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#FFE2BC" position={[-20, 4, 0]} rotation-y={Math.PI / 2} scale={[30, 6, 1]} />
          <Lightformer form="rect" intensity={1} color="#D6EAF2" position={[20, 4, 0]} rotation-y={-Math.PI / 2} scale={[30, 6, 1]} />
        </Environment>
        <DayNight />
        {fontsReady && (
          <Suspense fallback={null}>
            <Terrain />
            <Vegetation />
            <Resort />
            {VILLAS.map((v) => (
              <Villa key={v.id} villa={v} />
            ))}
            <People />
            <Carts />
          </Suspense>
        )}
        <CameraRig />
      </Canvas>

      <Hud />
      <TourPanel />
      <VillaList />
      <Booking />
      <Intro ready={fontsReady} />
    </>
  );
}
