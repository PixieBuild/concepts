import { cn } from "@/lib/utils";

export function Shell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[80rem] px-5 sm:px-8 lg:px-10 2xl:max-w-[100rem] 2xl:px-14", className)}>
      {children}
    </div>
  );
}

export function Ornament({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("text-(--brass) text-[0.7rem] tracking-[0.6em]", className)}>
      ✦ ✦ ✦
    </span>
  );
}

// Every printed sheet on the page opens the same way: condensed caps, an italic
// line, three brass stars.
export function SheetTitle({
  title,
  line,
  className,
  tone = "ink",
}: {
  title: string;
  line?: string;
  className?: string;
  tone?: "ink" | "green";
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", className)}>
      <h2 className="poster text-[clamp(2rem,4.6vw,3rem)] leading-none font-medium tracking-[0.12em] uppercase">
        {title}
      </h2>
      {line && (
        <p
          className={cn(
            "max-w-[52ch] font-heading text-[0.95rem] italic sm:text-base",
            tone === "green" ? "text-(--brass-soft)" : "text-muted-foreground",
          )}
        >
          {line}
        </p>
      )}
      <Ornament className={cn("mt-1", tone === "green" && "text-(--brass-soft)")} />
    </div>
  );
}
