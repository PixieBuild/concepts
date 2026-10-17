import Image from "next/image";

import { cn } from "@/lib/utils";
import { IMAGE_BASE, type Slot } from "../_lib/content";

/** A photograph cropped to its box, held on its own average colour until it loads. */
export function Frame({
  slot,
  className,
  sizes,
  edge,
  eager,
}: {
  slot: Slot;
  className?: string;
  sizes: string;
  edge?: boolean;
  eager?: boolean;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", edge && "after:pointer-events-none after:absolute after:inset-0 after:ring-1 after:ring-black/8 after:ring-inset", className)}
      style={{ backgroundColor: slot.tone }}
    >
      <Image
        src={`${IMAGE_BASE}/${slot.src}`}
        alt={slot.alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : undefined}
        fetchPriority={eager ? "low" : undefined}
        className="object-cover"
        style={{ objectPosition: slot.focus }}
      />
    </div>
  );
}
