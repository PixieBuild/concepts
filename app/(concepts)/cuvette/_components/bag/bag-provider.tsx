"use client";

import type { ReactNode } from "react";

import { useBag } from "../../_lib/cart";
import { useInertPage } from "../../_lib/modal";

export function BagProvider({ children }: { children: ReactNode }) {
  useInertPage(useBag().open);
  return children;
}
