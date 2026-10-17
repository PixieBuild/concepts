"use client";

import { onAnchorClick } from "../_lib/scroll";

export function AnchorLink(props: React.ComponentProps<"a"> & { href: `#${string}` }) {
  return <a {...props} onClick={onAnchorClick} />;
}
