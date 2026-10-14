import { useStore } from "./store";
import Stage, { useControls } from "./ui/Stage";
import RoomView from "./ui/RoomView";
import Hud from "./ui/Hud";
import Rooms from "./ui/Rooms";
import VillaDetail from "./ui/VillaDetail";
import Booking from "./ui/Booking";
import Credits from "./ui/Credits";
import Intro from "./ui/Intro";

/** The resort is walked in real photos; inside a villa its rooms are walked in 3D. */
export default function App() {
  const touring = useStore((s) => !!s.tour);
  useControls();
  return (
    <>
      <Stage />
      {touring && <RoomView />}
      <Hud />
      <Rooms />
      <VillaDetail />
      <Booking />
      <Credits />
      <Intro />
    </>
  );
}
