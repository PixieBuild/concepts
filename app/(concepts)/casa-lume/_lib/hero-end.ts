// The hero's on-screen bottom edge without a layout read per scroll event: measured once, then only on resize.
export function trackHeroEnd(onResize: () => void) {
  let hero: HTMLElement | null = null;
  let end = 0;
  const measure = () => {
    if (hero) end = hero.getBoundingClientRect().bottom + window.scrollY;
  };
  const observer = new ResizeObserver(() => {
    measure();
    onResize();
  });

  return {
    get() {
      const current = document.getElementById("hero");
      if (current !== hero) {
        observer.disconnect();
        hero = current;
        measure();
        if (hero) observer.observe(hero);
      }
      return hero ? { hero, bottom: end - window.scrollY } : null;
    },
    stop: () => observer.disconnect(),
  };
}
