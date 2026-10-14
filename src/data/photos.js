/**
 * Every photo is from Unsplash (unsplash.com/license) and lives in public/photos as
 * `<id>.jpg` (2000 px) and `<id>-s.jpg` (640 px); villa rooms also have `<id>-d.png`, a
 * depth map. The id is the Unsplash photo id.
 */
const CREDITS = {
  // The resort
  "td-OU7M9t4k": "mahosadha-ong",
  wSrUByFLLFU: "sergei-bezzubov",
  "7mGOKWOr5F4": "nerissa-j",
  Z76GWwaTCjQ: "antonio-araujo",
  Koei_7yYtIo: "sara-dubler",
  "5YaD_J20DWY": "nerissa-j",
  zZkRzighcII: "luan-fonseca",
  GiZtJ4juG44: "polina-kuzovkova",
  onXChRjOkqQ: "ahmad-ardani",
  I9AKvh9NU18: "mayur-roxan",
  SMwCQZWayj0: "engin-akyurt",
  HdIKEomMJPw: "j-balla-photography",
  xce530fBHrk: "jared-rice",
  "8w7b4SdhOgw": "jared-rice",
  bWtN6lHJ5H4: "konrad-ziemlewski",
  "HHEB--p-PvA": "evgenii-rychkin",
  qT3bvJ2fVlg: "sebastien-goldberg",
  IFB0DU4mhxk: "daesun-kim",
  eXiZpmVTgYk: "didi-suprapta",
  // The villas
  "3jZd5h4nJDE": "alexander-davies",
  "6YnIxGgBdQA": "kate-branch",
  ZNebRQbVvBg: "antonio-araujo",
  a3ly0RqbZdw: "polina-kuzovkova",
  qawgWgMATzQ: "nerissa-j",
  WQysERfYbog: "mark-chaves",
  w8FEsHwwL10: "vije-vijendranath",
  "lJF-vml60lA": "johnny-africa",
  "4jpU5xBQFqA": "nerissa-j",
  fBdlytm6Hp8: "marvin-meyer",
  nYfx6BtdEeE: "polina-kuzovkova",
  FRMKzS3t4u8: "alexander-davies",
  RcF3AbDcdSc: "sanju-pandita",
  "8v9Pi_tKQoA": "antonio-araujo",
  diNcGNMabFI: "sidath-vimukthi",
  "T5pL6ciEn-I": "visualsofdana",
  _EienJTUSWI: "maverick-frame",
  A12OW0VfVMo: "antonio-araujo",
  HFhYNeRTVrM: "bernard-hermant",
  RAXD1BlJmSs: "marc-wieland",
  VSCwUAzNTvA: "villa-rental",
  pFKQRc5nWhY: "matthew-dlr",
  "5LXM3u4HESo": "tran-vinh",
  "OaQ-p0lCmRs": "pepita-martasya",
  ABERsC7FzCM: "ahya-agawis",
  clzNiSBuVAM: "nerissa-j",
  "007z3qCSXVo": "polina-kuzovkova",
  R091q4t2k44: "sanju-pandita",
};

export const photoUrl = (id) => `/photos/${id}.jpg`;
export const thumbUrl = (id) => `/photos/${id}-s.jpg`;
/** Depth map of a villa room photo (near = white), made with Depth Anything V2. */
export const depthUrl = (id) => `/photos/${id}-d.png`;

const titleCase = (slug) => slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

/** { id, name, page } for the credits list. */
export const credit = (id) => ({ id, name: titleCase(CREDITS[id]), page: `https://unsplash.com/photos/${id}` });
export const ALL_PHOTOS = Object.keys(CREDITS);
