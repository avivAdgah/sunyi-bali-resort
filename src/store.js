import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clampDist } from "./data/path";
import { VILLA_BY_ID, STOPS } from "./data/villas";

export const START_DIST = 0.5;

const isoDay = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const useStore = create(
  persist(
    (set, get) => ({
      // ---- Walking ----
      targetDist: START_DIST,
      currentDist: START_DIST,
      entered: false,
      walk: (delta) => {
        if (get().tour) return;
        set({ targetDist: clampDist(get().targetDist + delta) });
      },
      walkTo: (dist) => set({ targetDist: clampDist(dist), tour: null }),
      teleportTick: 0,
      teleport: () => set({ teleportTick: get().teleportTick + 1 }),
      setCurrentDist: (d) => set({ currentDist: d }),
      enter: () => set({ entered: true }),

      // ---- Day / night ----
      night: false,
      setNight: (night) => set({ night }),
      toggleNight: () => set({ night: !get().night }),

      // ---- Villa tour ----
      /** { villaId, stop } while touring inside a villa, else null. */
      tour: null,
      hoveredVilla: null,
      openTour: (villaId, stop = 0) =>
        set({ tour: { villaId, stop }, targetDist: VILLA_BY_ID[villaId].dist, hoveredVilla: null, listOpen: false }),
      setStop: (stop) => {
        const tour = get().tour;
        if (tour) set({ tour: { ...tour, stop: (stop + STOPS.length) % STOPS.length } });
      },
      exitTour: () => set({ tour: null }),
      setHoveredVilla: (hoveredVilla) => set({ hoveredVilla }),

      // ---- Panels ----
      listOpen: false,
      setListOpen: (listOpen) => set({ listOpen }),

      // ---- Booking ----
      booking: null, // { villaId, checkIn, checkOut, guests, extras: [] } while the booking sheet is open
      bookings: [],
      openBooking: (villaId) =>
        set({
          booking: {
            villaId: villaId || get().tour?.villaId || "jungle-pool-villa",
            checkIn: isoDay(30),
            checkOut: isoDay(34),
            guests: 2,
            extras: [],
          },
          listOpen: false,
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

export const nightsBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
