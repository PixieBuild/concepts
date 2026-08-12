"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { path } from "@/app/(concepts)/casa-lume/site";

export function MobileBookBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith(path("/booking"))) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <Button
        size="lg"
        className="w-full"
        nativeButton={false}
        render={<Link href={path("/booking")} />}
      >
        Book your stay
      </Button>
    </div>
  );
}
