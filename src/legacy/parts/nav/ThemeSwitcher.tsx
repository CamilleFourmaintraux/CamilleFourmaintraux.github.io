import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"),
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Saved on click only, so a simple visit does not freeze the system theme.
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  return (
    <button onClick={toggleTheme} id="themeSwitcher">
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
