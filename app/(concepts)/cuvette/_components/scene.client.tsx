"use client";

import dynamic from "next/dynamic";

export const SceneClient = dynamic(() => import("./scene").then((m) => m.Scene), { ssr: false });
