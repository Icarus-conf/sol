export type BodyKind = "star" | "planet" | "dwarf" | "moon";

export type BodyFacts = {
  subtitle: string;
  distance: string;
  diameter: string;
  day: string;
  year: string;
  moons: string;
  description: string;
};

export type Body = {
  id: string;
  name: string;
  kind: BodyKind;
  parent?: string;
  /** Visual sphere radius in scene units. */
  radius: number;
  /** Visual orbital radius from parent. */
  orbitRadius: number;
  /** Seconds for one revolution at 1× simulation speed. */
  orbitPeriod: number;
  /** Seconds for one axial rotation at 1×; negative = retrograde. */
  rotationPeriod: number;
  /** Orbital inclination in radians. */
  inclination: number;
  /** Axial tilt in radians. */
  tilt: number;
  /** Starting true anomaly in radians. */
  phase: number;
  color: string;
  emissive?: string;
  atmosphere?: string;
  clouds?: boolean;
  rings?: { inner: number; outer: number };
  facts: BodyFacts;
};

/** One Earth year at 1× — inner worlds stay readable, warp handles the giants. */
export const EARTH_YEAR = 16;

const yr = (years: number) => EARTH_YEAR * years;
const deg = (d: number) => (d * Math.PI) / 180;

export const BODIES: Body[] = [
  {
    id: "sun",
    name: "Sun",
    kind: "star",
    radius: 3.05,
    orbitRadius: 0,
    orbitPeriod: 1,
    rotationPeriod: 28,
    inclination: 0,
    tilt: deg(7.25),
    phase: 0,
    color: "#f3c46a",
    emissive: "#ffb347",
    facts: {
      subtitle: "G-type main-sequence star",
      distance: "—",
      diameter: "1,391,000 km",
      day: "25.4 days (eq.)",
      year: "—",
      moons: "—",
      description:
        "The gravitational heart of the system. A vast sphere of hydrogen and helium whose light takes eight minutes to reach Earth, and whose mass holds every orbit in place.",
    },
  },
  {
    id: "mercury",
    name: "Mercury",
    kind: "planet",
    radius: 0.22,
    orbitRadius: 6.15,
    orbitPeriod: yr(0.241),
    rotationPeriod: 18,
    inclination: deg(7.0),
    tilt: deg(0.03),
    phase: 0.85,
    color: "#9a9086",
    facts: {
      subtitle: "Terrestrial planet",
      distance: "0.39 AU",
      diameter: "4,879 km",
      day: "176 Earth days",
      year: "88 Earth days",
      moons: "None",
      description:
        "A cratered messenger racing closest to the Sun. Days last longer than its year, and the surface swings from furnace heat to night far colder than anywhere on Earth.",
    },
  },
  {
    id: "venus",
    name: "Venus",
    kind: "planet",
    radius: 0.38,
    orbitRadius: 8.35,
    orbitPeriod: yr(0.615),
    rotationPeriod: -22,
    inclination: deg(3.4),
    tilt: deg(2.6),
    phase: 2.15,
    color: "#d9c19a",
    atmosphere: "#e8d2a8",
    facts: {
      subtitle: "Terrestrial planet",
      distance: "0.72 AU",
      diameter: "12,104 km",
      day: "243 Earth days",
      year: "225 Earth days",
      moons: "None",
      description:
        "Earth’s veiled twin, spinning slowly backwards under a crushing carbon-dioxide sky. The brightest planet in our night, and the hottest world in the system.",
    },
  },
  {
    id: "earth",
    name: "Earth",
    kind: "planet",
    radius: 0.42,
    orbitRadius: 10.85,
    orbitPeriod: yr(1),
    rotationPeriod: 6.2,
    inclination: deg(0),
    tilt: deg(23.4),
    phase: 5.35,
    color: "#3f7cac",
    atmosphere: "#7eb6ff",
    clouds: true,
    facts: {
      subtitle: "Terrestrial planet",
      distance: "1.00 AU",
      diameter: "12,742 km",
      day: "23 h 56 m",
      year: "365.25 days",
      moons: "1",
      description:
        "The only world known to harbor life. Oceans, weather, and a protective magnetic field make a thin blue shell of air into a home — for now, uniquely ours.",
    },
  },
  {
    id: "moon",
    name: "Moon",
    kind: "moon",
    parent: "earth",
    radius: 0.12,
    orbitRadius: 1.18,
    orbitPeriod: 4.4,
    rotationPeriod: 4.4,
    inclination: deg(5.1),
    tilt: deg(6.7),
    phase: 1.1,
    color: "#b9b6b0",
    facts: {
      subtitle: "Natural satellite of Earth",
      distance: "384,400 km",
      diameter: "3,475 km",
      day: "27.3 Earth days",
      year: "27.3 Earth days",
      moons: "—",
      description:
        "Tidally locked to Earth, the same face always turned toward us. Its pull raises the tides and steadies our axial tilt — a companion written into every calendar.",
    },
  },
  {
    id: "mars",
    name: "Mars",
    kind: "planet",
    radius: 0.28,
    orbitRadius: 13.7,
    orbitPeriod: yr(1.881),
    rotationPeriod: 6.4,
    inclination: deg(1.85),
    tilt: deg(25.2),
    phase: 3.55,
    color: "#c0714a",
    atmosphere: "#c48a6a",
    facts: {
      subtitle: "Terrestrial planet",
      distance: "1.52 AU",
      diameter: "6,779 km",
      day: "24 h 37 m",
      year: "687 Earth days",
      moons: "2",
      description:
        "A rusted desert of volcanoes and canyonlands. Ice caps of carbon dioxide and water still hint at a wetter past, and at the next place we might walk.",
    },
  },
  {
    id: "jupiter",
    name: "Jupiter",
    kind: "planet",
    radius: 1.48,
    orbitRadius: 22.2,
    orbitPeriod: yr(11.86),
    rotationPeriod: 3.1,
    inclination: deg(1.3),
    tilt: deg(3.1),
    phase: 1.25,
    color: "#d4b48a",
    atmosphere: "#c9a87a",
    facts: {
      subtitle: "Gas giant",
      distance: "5.20 AU",
      diameter: "139,820 km",
      day: "9 h 56 m",
      year: "11.9 Earth years",
      moons: "95+",
      description:
        "A failed star of hydrogen and helium, wrapped in bands of ammonia cloud. The Great Red Spot has raged longer than recorded history, and its gravity sculpts the outer system.",
    },
  },
  {
    id: "saturn",
    name: "Saturn",
    kind: "planet",
    radius: 1.22,
    orbitRadius: 29.4,
    orbitPeriod: yr(29.45),
    rotationPeriod: 3.4,
    inclination: deg(2.5),
    tilt: deg(26.7),
    phase: 4.72,
    color: "#e3d1a4",
    atmosphere: "#ddd0aa",
    rings: { inner: 1.55, outer: 2.55 },
    facts: {
      subtitle: "Gas giant",
      distance: "9.58 AU",
      diameter: "116,460 km",
      day: "10 h 33 m",
      year: "29.5 Earth years",
      moons: "146+",
      description:
        "The jewel of the solar system. Its rings are ice and dust only tens of meters thick, yet they span hundreds of thousands of kilometers — a disk you could see through.",
    },
  },
  {
    id: "uranus",
    name: "Uranus",
    kind: "planet",
    radius: 0.72,
    orbitRadius: 36.2,
    orbitPeriod: yr(84.02),
    rotationPeriod: -8.2,
    inclination: deg(0.8),
    tilt: deg(97.8),
    phase: 0.42,
    color: "#9fd7d4",
    atmosphere: "#b7e4e0",
    rings: { inner: 1.18, outer: 1.55 },
    facts: {
      subtitle: "Ice giant",
      distance: "19.2 AU",
      diameter: "50,724 km",
      day: "17 h 14 m",
      year: "84 Earth years",
      moons: "28",
      description:
        "An ice giant rolled onto its side, so each pole spends decades in sunlight or night. Methane in the haze drinks red light and leaves the world a pale sea-green.",
    },
  },
  {
    id: "neptune",
    name: "Neptune",
    kind: "planet",
    radius: 0.7,
    orbitRadius: 42.6,
    orbitPeriod: yr(164.8),
    rotationPeriod: 7.1,
    inclination: deg(1.8),
    tilt: deg(28.3),
    phase: 2.88,
    color: "#3f6dd4",
    atmosphere: "#5b86ea",
    facts: {
      subtitle: "Ice giant",
      distance: "30.1 AU",
      diameter: "49,244 km",
      day: "16 h 6 m",
      year: "165 Earth years",
      moons: "16",
      description:
        "The last true planet, found with mathematics before a telescope. Winds here are the fastest in the system, tearing across a deep, cold blue.",
    },
  },
  {
    id: "pluto",
    name: "Pluto",
    kind: "dwarf",
    radius: 0.14,
    orbitRadius: 49.2,
    orbitPeriod: yr(248),
    rotationPeriod: -12,
    inclination: deg(17.1),
    tilt: deg(119.6),
    phase: 5.05,
    color: "#c4a890",
    facts: {
      subtitle: "Dwarf planet",
      distance: "39.5 AU",
      diameter: "2,377 km",
      day: "6.4 Earth days",
      year: "248 Earth years",
      moons: "5",
      description:
        "A heart-shaped glacier at the edge of the classical system. Small, icy, and still beloved — proof that wonder is not a function of size.",
    },
  },
];

export const PRIMARY_BODIES = BODIES.filter((b) => !b.parent);

export function getBody(id: string): Body | undefined {
  return BODIES.find((b) => b.id === id);
}

export function childrenOf(id: string): Body[] {
  return BODIES.filter((b) => b.parent === id);
}

export function focusDistance(body: Body): number {
  const ring = body.rings?.outer ?? 1;
  return Math.max(body.radius * ring * 6.4, body.radius * 7.2, 2.8);
}
