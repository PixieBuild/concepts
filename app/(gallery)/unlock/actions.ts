"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { GATE_COOKIE, GATE_MAX_AGE, gateToken } from "../_lib/gate";

export type UnlockState = { error?: string };

export async function unlock(
  _previous: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const token = gateToken();
  if (!token) {
    return { error: "Access is not available right now." };
  }

  const entered = String(formData.get("password") ?? "");
  if (entered !== process.env.GALLERY_PASSWORD) {
    return { error: "That password is not right." };
  }

  const store = await cookies();
  store.set(GATE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GATE_MAX_AGE,
    path: "/",
  });

  redirect("/");
}
