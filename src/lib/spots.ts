export type SpotType = "library" | "cafe" | "park" | "museum" | "cowork";

/** 1 = lively chat · 5 = pin-drop quiet */
export type QuietLevel = 1 | 2 | 3 | 4 | 5;

export type Spot = {
  id: string;
  name: string;
  type: SpotType;
  area: string;
  lat: number;
  lng: number;
  quiet: QuietLevel;
  wifi: boolean;
  plugs: boolean;
  hours: string;
  blurb: string;
};

export const TYPE_LABEL: Record<SpotType, string> = {
  library: "Library",
  cafe: "Café",
  park: "Park / outdoor",
  museum: "Museum / gallery",
  cowork: "Coworking lobby",
};

export const QUIET_LABEL: Record<QuietLevel, string> = {
  1: "Lively",
  2: "Soft chat",
  3: "Hush",
  4: "Whisper",
  5: "Silent",
};

export function quietLabel(n: number) {
  const clamped = Math.min(5, Math.max(1, Math.round(n))) as QuietLevel;
  return QUIET_LABEL[clamped];
}

/** Curated London starters — real venues, quietness is a practical estimate. */
export const LONDON_SPOTS: Spot[] = [
  {
    id: "bl-reading",
    name: "British Library — Humanities Reading Room",
    type: "library",
    area: "King’s Cross",
    lat: 51.5299,
    lng: -0.1275,
    quiet: 5,
    wifi: true,
    plugs: true,
    hours: "Reader pass · Mon–Sat",
    blurb: "Proper silence. Bags in lockers. Best deep-work room in London if you plan ahead.",
  },
  {
    id: "wellcome",
    name: "Wellcome Collection — Reading Room",
    type: "museum",
    area: "Euston",
    lat: 51.5258,
    lng: -0.134,
    quiet: 4,
    wifi: true,
    plugs: true,
    hours: "Free · Tue–Sun",
    blurb: "Soft museum hush, sofas, and free Wi‑Fi. Quieter mid-week mornings.",
  },
  {
    id: "barbican-library",
    name: "Barbican Library",
    type: "library",
    area: "City",
    lat: 51.5202,
    lng: -0.0938,
    quiet: 4,
    wifi: true,
    plugs: true,
    hours: "Public library hours",
    blurb: "Quiet floors above the arts centre — solid plugs and a calm crowd.",
  },
  {
    id: "tate-members",
    name: "Tate Modern — freestanding seating (Level 2)",
    type: "museum",
    area: "Bankside",
    lat: 51.5076,
    lng: -0.0994,
    quiet: 3,
    wifi: true,
    plugs: false,
    hours: "Free galleries",
    blurb: "Not silent, but calmer than most cafés. Good for reading between rooms.",
  },
  {
    id: "regents-park",
    name: "Regent’s Park — Queen Mary’s Gardens edge",
    type: "park",
    area: "Marylebone",
    lat: 51.5286,
    lng: -0.1527,
    quiet: 3,
    wifi: false,
    plugs: false,
    hours: "Daylight",
    blurb: "Outdoor focus when weather allows. Avoid weekends near the rose garden peak.",
  },
  {
    id: "lincoln-inn",
    name: "Lincoln’s Inn Fields — north benches",
    type: "park",
    area: "Holborn",
    lat: 51.516,
    lng: -0.1165,
    quiet: 3,
    wifi: false,
    plugs: false,
    hours: "Daylight",
    blurb: "City lunchtime is busy; mid-morning can feel almost village-quiet.",
  },
  {
    id: "ozone",
    name: "Ozone Coffee — Leonard St (upstairs)",
    type: "cafe",
    area: "Shoreditch",
    lat: 51.525,
    lng: -0.0814,
    quiet: 2,
    wifi: true,
    plugs: true,
    hours: "Café hours",
    blurb: "Upstairs is softer than the ground floor grinders. Still a café — not a library.",
  },
  {
    id: "workshop-fitz",
    name: "Workshop Coffee — Fitzrovia",
    type: "cafe",
    area: "Fitzrovia",
    lat: 51.5195,
    lng: -0.1378,
    quiet: 2,
    wifi: true,
    plugs: true,
    hours: "Café hours",
    blurb: "Laptop-friendly with a steady murmur. Arrive early for a corner table.",
  },
  {
    id: "look-mum",
    name: "Look Mum No Hands",
    type: "cafe",
    area: "Old Street",
    lat: 51.5244,
    lng: -0.0965,
    quiet: 2,
    wifi: true,
    plugs: true,
    hours: "Café / bar hours",
    blurb: "Bike-café energy. Fine for light work; skip if you need whisper-level focus.",
  },
  {
    id: "idea-store",
    name: "Idea Store Whitechapel",
    type: "library",
    area: "Whitechapel",
    lat: 51.5194,
    lng: -0.0594,
    quiet: 4,
    wifi: true,
    plugs: true,
    hours: "Library hours",
    blurb: "Bright public library with study desks. Quieter upstairs study areas.",
  },
  {
    id: "southbank-under",
    name: "Southbank Centre — undercroft seating (dry weather)",
    type: "park",
    area: "South Bank",
    lat: 51.5065,
    lng: -0.1165,
    quiet: 2,
    wifi: false,
    plugs: false,
    hours: "Public riverside",
    blurb: "Skate noise nearby — better for people-watching than deep focus.",
  },
  {
    id: "second-home",
    name: "Second Home Holland Park (lobby / café)",
    type: "cowork",
    area: "Holland Park",
    lat: 51.5045,
    lng: -0.2065,
    quiet: 3,
    wifi: true,
    plugs: true,
    hours: "Member / café access varies",
    blurb: "Design-forward hush in the public-ish café zone. Check day access before you go.",
  },
];

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistanceKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
