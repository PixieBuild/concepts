import Image from "next/image";

import { cn } from "@/lib/utils";
import { IMAGE_BASE, type Slot } from "../_lib/content";

// A photograph's place in the layout. Until the file arrives the slot shows the brief it
// was commissioned against, so nothing shifts when the picture lands.
export function Frame({
  slot,
  className,
  sizes,
  priority,
  quiet,
}: {
  slot: Slot;
  className?: string;
  sizes: string;
  priority?: boolean;
  /** Hide the written brief where the layout puts its own words over the picture. */
  quiet?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-(--glacier)", className)}>
      {slot.src ? (
        <Image src={`${IMAGE_BASE}/${slot.src}`} alt={slot.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div role="img" aria-label={slot.alt} className="absolute inset-0 flex flex-col justify-between p-4" style={{ backgroundColor: slot.tone }}>
          <span className="w-condensed text-[0.7rem] tracking-[0.04em] text-white/70">{slot.id}.webp</span>
          {!quiet && <span className="w-condensed max-w-[30ch] text-[0.82rem] leading-snug text-white/85">{slot.alt}</span>}
        </div>
      )}
    </div>
  );
}
