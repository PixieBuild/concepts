"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CuvetteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="flex flex-1 flex-col justify-center px-(--gutter) py-24 sm:py-32">
      <p className="label text-muted-foreground">
        <Link href="/cuvette" className="inline-flex min-h-11 items-center">
          Cuvette
        </Link>
        {error.digest && <span> · Ref {error.digest}</span>}
      </p>
      <h1 className="display mt-5 max-w-[14ch]">
        The shelf didn&apos;t load. <span className="text-muted-foreground">Nothing in your bag is lost.</span>
      </h1>
      <p className="lead mt-8 max-w-[44ch] text-muted-foreground">
        We couldn&apos;t reach the stock list just now. It is usually back within a moment.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2">
        <Button type="button" onClick={retry} className="h-12 rounded-(--radius) px-5 text-[0.95rem] font-normal">
          Try again
        </Button>
        <Link href="/cuvette" className="link inline-flex min-h-11 items-center text-[0.9375rem]">
          Back to the front page
        </Link>
      </div>
    </main>
  );
}
