import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const CHANGE_EVENT = "themechange";
const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function currentTheme(): Theme {
  return storedTheme() ?? (darkQuery().matches ? "dark" : "light");
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#101b17" : "#f3f5ee");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Follows the system theme until the visitor picks one. The index.html
 * script applies the same rule before the first paint.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  useEffect(() => {
    const query = darkQuery();
    const onSystemChange = () => {
      if (!storedTheme()) setTheme(query.matches ? "dark" : "light");
    };
    query.addEventListener("change", onSystemChange);
    return () => query.removeEventListener("change", onSystemChange);
  }, []);

  const toggle = useCallback((origin?: { x: number; y: number }) => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Without storage the choice only lasts for this visit.
    }
    const update = () => {
      apply(next);
      setTheme(next);
    };
    const root = document.documentElement;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!document.startViewTransition || reduced || !origin) return update();
    // The new theme spreads from the button as a growing circle.
    root.style.setProperty("--reveal-x", `${origin.x}px`);
    root.style.setProperty("--reveal-y", `${origin.y}px`);
    root.dataset.themeSwitch = "";
    document
      .startViewTransition(update)
      .finished.finally(() => delete root.dataset.themeSwitch);
  }, []);

  return { theme, toggle };
}

/** Re-renders canvas drawings when the theme colors change. */
export function onThemeChange(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}
