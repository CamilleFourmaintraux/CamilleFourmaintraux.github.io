import { useEffect, useRef, useState } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_QUERY).matches;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const query = window.matchMedia(REDUCED_QUERY);
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

let observer: IntersectionObserver | null = null;

function revealObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0 },
  );
  return observer;
}

/**
 * Fades the element in the first time it enters the viewport. `index`
 * staggers siblings. Elements already on screen are left untouched.
 */
export function useReveal<T extends HTMLElement>(index = 0) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;
    if (element.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    element.style.setProperty("--reveal-index", String(index % 6));
    element.classList.add("reveal");
    const io = revealObserver();
    io.observe(element);
    return () => io.unobserve(element);
  }, [index]);
  return ref;
}

/** Tells whether the element is currently on screen. */
export function useInView<T extends HTMLElement>(rootMargin = "0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin, threshold: 0.35 },
    );
    io.observe(element);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}
