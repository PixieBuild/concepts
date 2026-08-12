import { cn } from "@/lib/utils";
import { FadeIn, Reveal } from "./motion-primitives";
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
        "mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-12",
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

export function PageHero({
  eyebrow,
  title,
  intro,
  photo,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  photo: { src: string; alt: string };
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority
        sizes="100vw"
        className="ken-burns object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-foreground/55 via-foreground/30 to-foreground/80"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-foreground/60 via-foreground/15 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-(--clay) opacity-25 mix-blend-soft-light"
      />
      <Shell className="relative flex min-h-[62svh] flex-col justify-end pt-36 pb-16 text-background sm:min-h-[68svh] sm:pb-20">
        <FadeIn delay={0.05}>
          <p className="eyebrow flex items-center gap-4 text-background/85">
            <span aria-hidden className="h-px w-12 bg-background/45" />
            {eyebrow}
          </p>
        </FadeIn>
        <FadeIn delay={0.18}>
          <h1 className="mt-7 max-w-[15ch] font-heading text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.96] font-light tracking-tight">
            {title}
          </h1>
        </FadeIn>
        {intro && (
          <FadeIn delay={0.32}>
            <p className="mt-7 max-w-lg text-[1.0625rem] leading-relaxed text-background/90">
              {intro}
            </p>
          </FadeIn>
        )}
      </Shell>
    </section>
  );
}
