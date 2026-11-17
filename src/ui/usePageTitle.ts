import { useEffect, useRef } from "react";
import { hasNavigated } from "@/lib/navigation";

const SITE_NAME = "Camille Fourmaintraux";

/** Browser tab title, and focus on the page title after a navigation. */
export function usePageTitle(title: string | null) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  }, [title]);
  useEffect(() => {
    if (hasNavigated() && !window.location.hash.includes("#", 1)) {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, []);
  return headingRef;
}
