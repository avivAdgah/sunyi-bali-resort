import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STATIONS } from "./data/resort";
import { VILLA_BY_ID } from "./data/villas";

const isoDay = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const clampStation = (i) => Math.min(Math.max(i, 0), STATIONS.length - 1);

export const useStore = create(
  persist(
    (set, get) => ({
      entered: false,
      enter: () => set({ entered: true }),

      // ---- The resort path: a station per facility, a photo within the station ----
      station: 0,
      photo: 0,
      /** How the last step moved you ("forward", "back", "left" or "right"); picks the transition. */
      move: "forward",
      goTo: (i) => {
        const station = clampStation(i);
        if (station !== get().station) set({ station, photo: 0, move: station > get().station ? "forward" : "back" });
      },
      setPhoto: (photo) => set({ photo }),

      // ---- Inside a villa: rooms you walk through in 3D ----
      /** { villaId, stop } while inside a villa, else null. */
      tour: null,
      openTour: (villaId, stop = 0) => set({ tour: { villaId, stop }, move: "forward", villa: null, roomsOpen: false }),
      setStop: (i, move) => {
        const tour = get().tour;
        const stop = Math.min(Math.max(i, 0), VILLA_BY_ID[tour.villaId].photos.length - 1);
        if (stop !== tour.stop) set({ tour: { ...tour, stop }, move: move || (stop > tour.stop ? "forward" : "back") });
      },
      /** Takes the doorway in direction `move` from this room, if it has one. */
      go: (move) => {
        const exit = exitsHere(get()).find((e) => e.move === move);
        if (!exit) return false;
        if (exit.to === "exit") get().exitTour();
        else get().setStop(exit.to, move);
        return true;
      },
      exitTour: () => set({ tour: null, roomsOpen: false }),

      // ---- Villas ----
      /** Villa id whose page (all photos and facilities) is open, else null. */
      villa: null,
      openVilla: (villa) => set({ villa, roomsOpen: false }),
      closeVilla: () => set({ villa: null }),
      /** The villa list on narrow screens, where it is a drawer. */
      roomsOpen: false,
      setRoomsOpen: (roomsOpen) => set({ roomsOpen }),

      credits: false,
      setCredits: (credits) => set({ credits }),

      // ---- Booking ----
      booking: null, // { villaId, checkIn, checkOut, guests, extras: [] } while the booking sheet is open
      bookings: [],
      openBooking: (villaId) =>
        set({
          booking: {
            villaId: villaId || get().villa || get().tour?.villaId || "jungle-pool-villa",
            checkIn: isoDay(30),
            checkOut: isoDay(34),
            guests: 2,
            extras: [],
          },
          roomsOpen: false,
        }),
      updateBooking: (patch) => set({ booking: { ...get().booking, ...patch } }),
      closeBooking: () => set({ booking: null }),
      confirmBooking: (record) => set({ bookings: [...get().bookings, record] }),
    }),
    {
      name: "sunyi-resort",
      partialize: (s) => ({ bookings: s.bookings }),
    },
  ),
);

/** The doorways of the room you stand in: { move, to, label }, where `to` is a room index or "exit". */
export function exitsHere({ tour }) {
  if (!tour) return [];
  const rooms = VILLA_BY_ID[tour.villaId].photos;
  return Object.entries(rooms[tour.stop].exits).map(([move, to]) => ({
    move,
    to,
    label: to === "exit" ? "Exit to the resort" : rooms[to].room,
  }));
}

export const nightsBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
