import { useEffect } from "react";

export const PAGE_INERT_EVENT = "cuvette:page-inert";

// Popups, the toast region (Undo stays clickable over the bag) and parts that manage their own inert stay live.
const LIVE = '[data-base-ui-portal], [data-own-inert], section[aria-label^="Notifications"], script, nextjs-portal';

/** Base UI only aria-hides the page behind a modal, and its focus guards can be tabbed past, so the page goes inert. */
export function inertPage(): () => void {
  const page = [...document.body.children].filter((el): el is HTMLElement => el instanceof HTMLElement && !el.inert && !el.matches(LIVE));
  page.forEach((el) => (el.inert = true));
  window.dispatchEvent(new CustomEvent(PAGE_INERT_EVENT, { detail: true }));
  return () => {
    page.forEach((el) => (el.inert = false));
    window.dispatchEvent(new CustomEvent(PAGE_INERT_EVENT, { detail: false }));
  };
}

export function useInertPage(active: boolean) {
  useEffect(() => (active ? inertPage() : undefined), [active]);
}

/** True when an outside press landed on a toast, which sits above the overlay and must not dismiss the sheet. */
export function pressedToast(event: Event | undefined): boolean {
  return event?.target instanceof Element && !!event.target.closest("[data-sonner-toaster]");
}
