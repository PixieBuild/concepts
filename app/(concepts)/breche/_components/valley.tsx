import { SLOTS, VALLEY_CAPTION } from "../_lib/content";
import { Frame } from "./frame";
import { Reveal } from "./reveal";

export function Valley() {
  return (
    <figure className="bg-(--ink) text-(--snow)">
      <Reveal kind="photo">
        <Frame slot={SLOTS.valley} sizes="100vw" className="aspect-3/4 sm:aspect-4/3 md:aspect-auto md:h-[min(100svh,72rem)]" />
      </Reveal>
      <figcaption className="data px-6 pt-4 pb-5 text-(--snow)/75 sm:px-10 lg:px-14">
        {VALLEY_CAPTION.place} · <span className="whitespace-nowrap">{VALLEY_CAPTION.when}</span>
      </figcaption>
    </figure>
  );
}
