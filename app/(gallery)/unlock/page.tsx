import type { Metadata } from "next";
import Image from "next/image";

import { UnlockForm } from "./_components/unlock-form";

export const metadata: Metadata = {
  title: "Private",
  description: "This page requires a password.",
  robots: { index: false, follow: false, nocache: true },
};

export default function UnlockPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-152 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-border/70 bg-card p-8 shadow-sm sm:p-10">
          <Image
            src="/logo-mark.png"
            alt=""
            width={205}
            height={240}
            priority
            className="h-9 w-auto"
          />

          <h1 className="mt-7 text-2xl font-semibold tracking-tight">
            This page is private
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Enter the password to continue.
          </p>

          <UnlockForm />
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Remembered on this device for 30 days.
        </p>
      </div>
    </main>
  );
}
