import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex h-7 w-full touch-none items-center select-none cursor-pointer",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/15 transition-colors hover:bg-white/20">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-3.5 cursor-grab rounded-full border-2 border-white bg-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.9),0_0_2px_rgba(0,0,0,0.5)] transition-transform duration-[var(--motion-quick)] ease-[var(--ease-out)] hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 active:cursor-grabbing" />
    </SliderPrimitive.Root>
  );
}

export { Slider };
