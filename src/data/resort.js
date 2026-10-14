/** The walk through the resort: one station per facility, in walking order. Villas are not on the path. */
export const STATIONS = [
  {
    id: "arrival",
    name: "Temple Gate",
    short: "Arrival",
    text: "A candi bentar split gate frames the volcano. A host meets every arrival with a cold towel, a flower garland and a glass of lemongrass tea.",
    info: "Arrivals 24 h · 75 min from Denpasar airport",
    photos: [
      { id: "td-OU7M9t4k", caption: "The split gate at the top of the drive" },
      { id: "wSrUByFLLFU", caption: "Looking back through the gate at dusk" },
    ],
  },
  {
    id: "lobby",
    name: "Lobby Courtyard",
    short: "Lobby",
    text: "An open courtyard of paras stone and frangipani. Check in with a drink in hand, then a buggy takes you and your bags to the villa.",
    info: "Front desk 24 h · buggy on call",
    photos: [
      { id: "7mGOKWOr5F4", caption: "The courtyard behind the front desk" },
      { id: "Z76GWwaTCjQ", caption: "The resort from above: lawn, pool and thatched pavilions" },
    ],
  },
  {
    id: "pool",
    name: "Infinity Pool",
    short: "Pool",
    text: "A 30 m pool with thatched bale cabanas and loungers facing the hills. The pool bar serves fresh coconuts by day, and the water is lit after dark.",
    info: "Open 07:00–21:00 · towels and pool bar",
    photos: [
      { id: "Koei_7yYtIo", caption: "The main pool and its bale cabanas" },
      { id: "5YaD_J20DWY", caption: "Loungers and parasols on the pool deck" },
      { id: "zZkRzighcII", caption: "The pool garden after dark" },
    ],
  },
  {
    id: "restaurant",
    name: "Warung Restaurant",
    short: "Restaurant",
    text: "Balinese and Indonesian cooking on an open terrace facing the volcano: nasi campur, babi guling on Sundays and a long breakfast menu.",
    info: "Breakfast 07:00–11:00 · Dinner 18:00–22:00",
    photos: [
      { id: "GiZtJ4juG44", caption: "Breakfast tables with the volcano in view" },
      { id: "onXChRjOkqQ", caption: "The dining room" },
    ],
  },
  {
    id: "spa",
    name: "Jungle Spa",
    short: "Spa",
    text: "Balinese massage, hot stones, flower baths and a cedar sauna hidden among the ferns. Treatments use local coconut oil and lemongrass.",
    info: "Open 09:00–21:00 · book at the front desk",
    photos: [
      { id: "I9AKvh9NU18", caption: "A treatment room ready for two" },
      { id: "SMwCQZWayj0", caption: "Hot-stone massage" },
      { id: "HdIKEomMJPw", caption: "The cedar sauna in the garden" },
    ],
  },
  {
    id: "yoga",
    name: "Yoga Shala",
    short: "Yoga",
    text: "A teak deck open on three sides to the jungle. Sunrise flow every morning and a slower class before sunset, mats and blocks provided.",
    info: "Daily 07:00 and 17:30 · free for guests",
    photos: [
      { id: "xce530fBHrk", caption: "Morning light on the shala deck" },
      { id: "8w7b4SdhOgw", caption: "Meditation above the trees" },
    ],
  },
  {
    id: "terraces",
    name: "Rice Terrace Walk",
    short: "Rice terraces",
    text: "A trail leads down from the resort through the subak rice terraces, past coconut palms, to a thatched lookout above the river.",
    info: "Guided walk daily at 08:00 · 90 min",
    photos: [
      { id: "bWtN6lHJ5H4", caption: "The terraces below the resort" },
      { id: "HHEB--p-PvA", caption: "The valley from above" },
      { id: "qT3bvJ2fVlg", caption: "The lookout at the end of the trail" },
    ],
  },
  {
    id: "sunset",
    name: "Sunset Bar",
    short: "Sunset Bar",
    text: "Cocktails, cold Bintang and grilled seafood at the edge of the resort, as the sun goes down behind the volcano.",
    info: "Open 16:00–00:00 · happy hour 17:00–18:00",
    photos: [
      { id: "IFB0DU4mhxk", caption: "Drinks at dusk" },
      { id: "eXiZpmVTgYk", caption: "Sunset over the water and the volcano" },
    ],
  },
];

export const STATION_BY_ID = Object.fromEntries(STATIONS.map((s, i) => [s.id, i]));
