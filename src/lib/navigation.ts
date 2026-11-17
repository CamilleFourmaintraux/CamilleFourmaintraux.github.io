// Tells a page whether it is the first one displayed, or the result of a
// navigation inside the site (in which case its title receives the focus).
const initialAddress = window.location.href;
let navigated = false;

export const markNavigated = () => {
  navigated = true;
};

// The address is compared too: a page may render before the layout had the
// chance to record the navigation.
export const hasNavigated = () =>
  navigated || window.location.href !== initialAddress;

/** Scrolls to an in-page anchor, waiting for lazy pages to render it. */
export function scrollToAnchor(id: string, attempts = 40) {
  const target = document.getElementById(id);
  if (!target) {
    if (attempts > 0)
      requestAnimationFrame(() => scrollToAnchor(id, attempts - 1));
    return;
  }
  target.scrollIntoView({ block: "start" });
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}
