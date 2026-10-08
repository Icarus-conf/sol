import { create } from "zustand";

export const simClock = {
  /** Simulated Earth years since session start. */
  years: 0,
  /** Accumulated simulation seconds (pauses do not advance). */
  time: 0,
};

type SolarState = {
  paused: boolean;
  speed: number;
  showLabels: boolean;
  showOrbits: boolean;
  showTrails: boolean;
  focusedId: string | null;
  hoveredId: string | null;
  setPaused: (paused: boolean) => void;
  togglePaused: () => void;
  setSpeed: (speed: number) => void;
  setShowLabels: (v: boolean) => void;
  setShowOrbits: (v: boolean) => void;
  setShowTrails: (v: boolean) => void;
  setFocusedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
};

export const useSolarStore = create<SolarState>()((set) => ({
  paused: false,
  speed: 2,
  showLabels: true,
  showOrbits: true,
  showTrails: true,
  focusedId: null,
  hoveredId: null,
  setPaused: (paused) => set({ paused }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setSpeed: (speed) => set({ speed }),
  setShowLabels: (showLabels) => set({ showLabels }),
  setShowOrbits: (showOrbits) => set({ showOrbits }),
  setShowTrails: (showTrails) => set({ showTrails }),
  setFocusedId: (focusedId) => set({ focusedId }),
  setHoveredId: (hoveredId) => set({ hoveredId }),
}));

export function formatYears(years: number): string {
  if (years < 0.01) return `${(years * 365.25).toFixed(1)} d`;
  if (years < 1) return `${(years * 365.25).toFixed(0)} d`;
  if (years < 10) return `${years.toFixed(2)} yr`;
  return `${years.toFixed(1)} yr`;
}

/** Map a 0–1 slider to 0.25× … 64× on a log2 scale. */
export function sliderToSpeed(t: number): number {
  return 0.25 * 2 ** (t * 8);
}

export function speedToSlider(speed: number): number {
  return Math.min(1, Math.max(0, Math.log2(speed / 0.25) / 8));
}

export function formatSpeed(speed: number): string {
  if (speed < 1) return `${speed.toFixed(2)}×`;
  if (speed < 10) return `${speed.toFixed(1)}×`;
  return `${Math.round(speed)}×`;
}
