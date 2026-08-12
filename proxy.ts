import { NextResponse, type NextRequest } from "next/server";

import { GATE_COOKIE, gateToken } from "@/app/(gallery)/_lib/gate";

export function proxy(request: NextRequest) {
  const token = gateToken();
  const cookie = request.cookies.get(GATE_COOKIE)?.value;

  if (token && cookie === token) return NextResponse.next();

  return NextResponse.redirect(new URL("/unlock", request.url));
}

export const config = { matcher: "/" };
