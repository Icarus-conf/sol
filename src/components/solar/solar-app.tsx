import { lazy, Suspense, useEffect, useState } from "react";
import { PRIMARY_BODIES } from "@/lib/solar/bodies";
import { useSolarStore } from "@/lib/solar/store";
import { Hud } from "./hud";

const CanvasRoot = lazy(() =>
  import("./canvas-root").then((m) => ({ default: m.CanvasRoot })),
);

function VoidFallback() {
  return (
    <div className="absolute inset-0 bg-background" aria-hidden>
      <div className="absolute top-1/2 left-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border" />
      <div className="absolute top-1/2 left-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/70" />
      <div className="absolute top-1/2 left-1/2 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/40" />
    </div>
  );
}

export function SolarApp() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return;
      }
      const s = useSolarStore.getState();
      if (e.code === "Space") {
        e.preventDefault();
        s.togglePaused();
      }
      if (e.code === "Escape") s.setFocusedId(null);
      if (e.key === "l" || e.key === "L") s.setShowLabels(!s.showLabels);
      if (e.key === "o" || e.key === "O") s.setShowOrbits(!s.showOrbits);
      if (e.key === "t" || e.key === "T") s.setShowTrails(!s.showTrails);
      if (e.key === "[") s.setSpeed(Math.max(0.25, s.speed / 2));
      if (e.key === "]") s.setSpeed(Math.min(64, s.speed * 2));
      if (e.key >= "1" && e.key <= "9") {
        const body = PRIMARY_BODIES[Number(e.key) - 1];
        if (body) s.setFocusedId(body.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) useSolarStore.getState().setPaused(true);
  }, []);

  return (
    <main className="relative h-dvh overflow-hidden bg-background text-foreground">
      {mounted ? (
        <Suspense fallback={<VoidFallback />}>
          <CanvasRoot />
        </Suspense>
      ) : (
        <VoidFallback />
      )}
      <Hud />
    </main>
  );
}
