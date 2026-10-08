import { useEffect, useRef, type ReactNode } from "react";
import {
  Eye,
  EyeOff,
  Keyboard,
  Orbit,
  Pause,
  Play,
  Spline,
  Telescope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PRIMARY_BODIES, getBody } from "@/lib/solar/bodies";
import {
  formatSpeed,
  formatYears,
  simClock,
  speedToSlider,
  sliderToSpeed,
  useSolarStore,
} from "@/lib/solar/store";
import { cn } from "@/lib/utils";

function ElapsedClock() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let id = 0;
    const tick = () => {
      if (ref.current) ref.current.textContent = formatYears(simClock.years);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <span ref={ref} className="tabular-nums text-foreground">
      0 d
    </span>
  );
}

function ToggleIcon({
  pressed,
  onPressed,
  label,
  on,
  off,
}: {
  pressed: boolean;
  onPressed: (v: boolean) => void;
  label: string;
  on: ReactNode;
  off: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={() => onPressed(!pressed)}
      className={cn(
        "size-8 rounded-full text-muted transition-all",
        pressed ? "bg-cyan-500/15 text-cyan-300" : "hover:bg-white/10 hover:text-foreground",
      )}
    >
      {pressed ? on : off}
    </Button>
  );
}

function InfoPanel() {
  const focusedId = useSolarStore((s) => s.focusedId);
  const setFocusedId = useSolarStore((s) => s.setFocusedId);
  const body = focusedId ? getBody(focusedId) : undefined;

  if (!body) {
    return (
      <aside className="pointer-events-none hidden max-w-sm md:block">
        <div className="rounded-xl border border-border bg-card/90 p-5">
          <p className="font-display text-xl italic text-foreground">Look closer</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Click a world to approach it. Drag to orbit, pinch or scroll to zoom.
            The clock at the bottom warps time.
          </p>
        </div>
      </aside>
    );
  }

  const stats = [
    { k: "Distance", v: body.facts.distance },
    { k: "Diameter", v: body.facts.diameter },
    { k: "Day", v: body.facts.day },
    { k: "Year", v: body.facts.year },
    { k: "Moons", v: body.facts.moons },
  ];

  return (
    <aside className="pointer-events-auto w-full max-w-md md:max-w-sm">
      <div className="panel-enter rounded-xl border border-border bg-card/95 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-kicker text-muted uppercase">
              {body.facts.subtitle}
            </p>
            <h2 className="mt-1 font-display text-3xl tracking-tight text-foreground italic">
              {body.name}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFocusedId(null)}
            aria-label="Return to system view"
          >
            System
          </Button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
          {stats.map((row) => (
            <div key={row.k}>
              <dt className="text-xs tracking-wide text-subtle uppercase">
                {row.k}
              </dt>
              <dd className="font-mono text-xs text-foreground tabular-nums">
                {row.v}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-muted">{body.facts.description}</p>
      </div>
    </aside>
  );
}

function BodyList() {
  const focusedId = useSolarStore((s) => s.focusedId);
  const setFocusedId = useSolarStore((s) => s.setFocusedId);

  return (
    <>
      <nav
        aria-label="Worlds"
        className="pointer-events-auto hidden w-44 flex-col gap-0.5 md:flex"
      >
        {PRIMARY_BODIES.map((b) => {
          const active = focusedId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setFocusedId(active ? null : b.id)}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                active
                  ? "bg-elevated text-foreground"
                  : "text-muted hover:bg-elevated/60 hover:text-foreground",
              )}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: b.color }}
                aria-hidden
              />
              {b.name}
            </button>
          );
        })}
      </nav>

      <nav
        aria-label="Worlds"
        className="pointer-events-auto -mx-1 flex w-full min-w-0 flex-nowrap gap-1 overflow-x-auto px-1 md:hidden"
      >
        {PRIMARY_BODIES.map((b) => {
          const active = focusedId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setFocusedId(active ? null : b.id)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm",
                active
                  ? "border-primary bg-elevated text-foreground"
                  : "border-border bg-card/90 text-muted",
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: b.color }}
                aria-hidden
              />
              {b.name}
            </button>
          );
        })}
      </nav>
    </>
  );
}

export function Hud() {
  const paused = useSolarStore((s) => s.paused);
  const speed = useSolarStore((s) => s.speed);
  const showLabels = useSolarStore((s) => s.showLabels);
  const showOrbits = useSolarStore((s) => s.showOrbits);
  const showTrails = useSolarStore((s) => s.showTrails);
  const togglePaused = useSolarStore((s) => s.togglePaused);
  const setSpeed = useSolarStore((s) => s.setSpeed);
  const setShowLabels = useSolarStore((s) => s.setShowLabels);
  const setShowOrbits = useSolarStore((s) => s.setShowOrbits);
  const setShowTrails = useSolarStore((s) => s.setShowTrails);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 md:p-5">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 48%, color-mix(in oklab, var(--color-background) 55%, transparent) 100%)",
        }}
        aria-hidden
      />

      <header className="pointer-events-auto relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/favicon.png"
            alt="Better Call Sol icon"
            className="size-10 rounded-full drop-shadow-[0_0_12px_rgba(56,189,248,0.4)] md:size-12"
          />
          <div>
            <p className="text-xs tracking-kicker text-muted uppercase">Sol system</p>
            <h1 className="font-display text-3xl tracking-tight text-foreground italic md:text-5xl">
              Better Call Sol
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-card/80 p-1 shadow-lg backdrop-blur-xl">
          <ToggleIcon
            pressed={showLabels}
            onPressed={setShowLabels}
            label={showLabels ? "Hide labels (L)" : "Show labels (L)"}
            on={<Eye className="size-4" />}
            off={<EyeOff className="size-4" />}
          />
          <ToggleIcon
            pressed={showOrbits}
            onPressed={setShowOrbits}
            label={showOrbits ? "Hide orbits (O)" : "Show orbits (O)"}
            on={<Orbit className="size-4" />}
            off={<Orbit className="size-4" />}
          />
          <ToggleIcon
            pressed={showTrails}
            onPressed={setShowTrails}
            label={showTrails ? "Hide trails (T)" : "Show trails (T)"}
            on={<Spline className="size-4" />}
            off={<Spline className="size-4" />}
          />
          <div className="mx-0.5 h-4 w-px bg-white/10" aria-hidden />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={paused ? "Resume simulation" : "Pause simulation"}
            title={paused ? "Resume (Space)" : "Pause (Space)"}
            onClick={togglePaused}
            className="size-8 rounded-full text-foreground hover:bg-white/10"
          >
            {paused ? (
              <Play className="size-3.5 fill-current" />
            ) : (
              <Pause className="size-3.5 fill-current" />
            )}
          </Button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 items-stretch justify-between gap-4 py-4">
        <div className="hidden md:flex md:items-end">
          <BodyList />
        </div>
        <div className="ml-auto flex items-end">
          <InfoPanel />
        </div>
      </div>

      <footer className="pointer-events-none relative flex flex-col items-center gap-3">
        <div className="pointer-events-auto w-full md:hidden">
          <BodyList />
        </div>

        {/* Floating Glass Dock */}
        <div className="pointer-events-auto group/dock relative flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-full border border-white/10 bg-card/85 px-3 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(56,189,248,0.12)] backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_28px_rgba(56,189,248,0.2)] md:gap-3 md:px-4 md:py-2">
          {/* Play/Pause Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={paused ? "Resume simulation" : "Pause simulation"}
            title={paused ? "Resume (Space)" : "Pause (Space)"}
            onClick={togglePaused}
            className={cn(
              "size-8 rounded-full border transition-all duration-200",
              paused
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.25)]",
            )}
          >
            {paused ? (
              <Play className="size-3.5 fill-current" />
            ) : (
              <Pause className="size-3.5 fill-current" />
            )}
          </Button>

          {/* Speed Indicator Badge & Quick Reset */}
          <button
            type="button"
            onClick={() => setSpeed(1)}
            title="Click to reset speed to 1.0×"
            className="group/spd flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs font-medium text-foreground transition-all hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-300"
          >
            <span className="text-[10px] tracking-wider text-muted uppercase group-hover/spd:text-cyan-300/80">
              Speed
            </span>
            <span className="tabular-nums font-semibold">
              {formatSpeed(speed)}
            </span>
          </button>

          {/* Compact Scrubber Slider */}
          <div className="w-24 sm:w-36 md:w-48">
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[speedToSlider(speed)]}
              onValueChange={(v) => setSpeed(sliderToSpeed(v[0] ?? 0.375))}
              aria-label="Simulation speed slider"
            />
          </div>

          {/* Vertical Divider */}
          <div className="h-4 w-px bg-white/15" aria-hidden />

          {/* Elapsed Clock */}
          <div
            className="flex items-center gap-1.5 text-xs text-muted"
            title="Elapsed simulation time"
          >
            <Telescope className="size-3.5 text-cyan-400 shrink-0" aria-hidden />
            <span className="font-mono text-foreground tabular-nums">
              <ElapsedClock />
            </span>
          </div>

          {/* Keyboard Shortcuts Trigger & Floating Cheat Sheet */}
          <div className="relative group/help">
            <button
              type="button"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts"
              className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <Keyboard className="size-3.5" />
            </button>

            {/* Hover Tooltip / Popover card */}
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover/help:pointer-events-auto group-hover/help:opacity-100 group-hover/help:-translate-y-1">
              <div className="w-56 rounded-xl border border-white/15 bg-card/95 p-3 shadow-2xl backdrop-blur-xl">
                <p className="mb-2 text-[10px] font-semibold tracking-wider text-muted uppercase">
                  Keyboard Shortcuts
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Pause / Resume</span>
                    <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-cyan-300">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">System View</span>
                    <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-cyan-300">Esc</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Time Warp</span>
                    <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-cyan-300">[ / ]</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Toggle Labels</span>
                    <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-cyan-300">L</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Toggle Orbits</span>
                    <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-cyan-300">O</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Toggle Trails</span>
                    <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-cyan-300">T</kbd>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-1.5">
                    <span className="text-muted">Focus Body</span>
                    <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-cyan-300">1 - 9</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
