"use client";

import dynamic from "next/dynamic";

export const TerrainClient = dynamic(() => import("./terrain").then((m) => m.Terrain), { ssr: false });
