import { cn } from "@/lib/utils";
import { Reveal, RevealImage } from "./motion-primitives";
import Image from "next/image";

export function Shell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-24",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "start",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        align === "center" && "mx-auto text-center",
        "max-w-3xl",
        className,
      )}
    >
      <p className="eyebrow text-primary">{eyebrow}</p>
      <h2 className="mt-5 font-heading text-[clamp(2.25rem,5.5vw,4.25rem)] leading-[1.02] font-light tracking-[-0.015em] text-balance">
        {title}
      </h2>
      {intro && (
        <p
          className={cn(
            "mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          {intro}
        </p>
      )}
    </Reveal>
  );
}

export function PageOpener({
  eyebrow,
  title,
  intro,
  photo,
  ratio = "aspect-3/2",
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  photo: { src: string; alt: string };
  ratio?: string;
}) {
  return (
    <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-32">
      <Shell className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-16">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow text-primary">{eyebrow}</p>
          <h1 className="mt-6 font-heading text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.02] font-light tracking-[-0.015em] text-balance">
            {title}
          </h1>
          {intro && (
            <p className="mt-7 max-w-md text-[1.0625rem] leading-relaxed text-muted-foreground">
              {intro}
            </p>
          )}
        </Reveal>
        <RevealImage className="lg:col-span-7" delay={0.1}>
          <div className={cn("relative overflow-hidden", ratio)}>
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              preload
              sizes="(min-width:1600px) 900px, (min-width:1024px) 57vw, 100vw"
              className="object-cover"
            />
          </div>
        </RevealImage>
      </Shell>
    </section>
  );
}
