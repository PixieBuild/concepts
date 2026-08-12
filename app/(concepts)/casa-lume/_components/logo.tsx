import Image from "next/image";

import { cn } from "@/lib/utils";
import { IMAGE_BASE } from "@/app/(concepts)/casa-lume/_lib/content";

export function Logo({
  className,
  showLocation = false,
}: {
  className?: string;
  showLocation?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-3.5", className)}>
      <span className="relative size-10 shrink-0">
        <Image
          src={`${IMAGE_BASE}/mark.png`}
          alt=""
          fill
          sizes="40px"
          className="object-contain"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-heading text-[1.45rem] leading-none font-normal tracking-[0.22em]">
          CASA LUME
        </span>
        <span className="mt-2 text-[0.58rem] leading-none tracking-[0.34em] opacity-55">
          {showLocation ? "LIGURIA, ITALY" : "BOUTIQUE HOTEL"}
        </span>
      </span>
    </span>
  );
}
