/** Scrolls to an in-page hash and moves focus there; `#top` focuses the masthead's wordmark.
    Under Lenis a synthetic anchor click hands Lenis the scroll, with the browser's own jump cancelled. */
export function goTo(hash: string) {
  const top = hash === "#top";
  const target = document.getElementById(top ? "brand" : hash.slice(1));
  if (document.documentElement.classList.contains("lenis")) {
    const link = document.createElement("a");
    link.href = hash;
    link.addEventListener("click", (event) => event.preventDefault());
    document.body.append(link);
    link.click();
    link.remove();
  } else if (target && !top) {
    target.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
  history.replaceState(null, "", top ? location.pathname : hash);
  target?.focus({ preventScroll: true });
}

export function onAnchorClick(event: React.MouseEvent<HTMLAnchorElement>) {
  const hash = event.currentTarget.getAttribute("href");
  if (!hash?.startsWith("#") || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  goTo(hash);
}

export const ASK_EVENT = "breche:ask";

/** Preselects an objective in the enquiry form, then takes the visitor there. */
export function askAbout(slug: string) {
  window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: slug }));
  goTo("#enquire");
}
