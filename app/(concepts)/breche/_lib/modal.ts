export const PAGE_INERT_EVENT = "breche:page-inert";

/** Base UI only aria-hides the page behind a sheet, and its focus guards can be tabbed past, so the page goes inert.
    Parts that own their `inert` prop opt out with data-own-inert and follow the event instead. */
export function inertPage(): () => void {
  const page = [...document.body.children].filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el.tagName !== "SCRIPT" && !el.inert && !el.hasAttribute("data-base-ui-portal") && !el.hasAttribute("data-own-inert"),
  );
  page.forEach((el) => (el.inert = true));
  window.dispatchEvent(new CustomEvent(PAGE_INERT_EVENT, { detail: true }));
  return () => {
    page.forEach((el) => (el.inert = false));
    window.dispatchEvent(new CustomEvent(PAGE_INERT_EVENT, { detail: false }));
  };
}
