import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  faBars,
  faBook,
  faComment,
  faGraduationCap,
  faHouse,
  faMoon,
  faPuzzlePiece,
  faRobot,
  faSun,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { normalizeLanguage, setLanguage } from "@/i18n";
import { useTheme } from "@/lib/theme";
import Icon from "./Icon";

const LINKS = [
  { to: "/", key: "home", icon: faHouse },
  { to: "/cursus", key: "career", icon: faGraduationCap },
  { to: "/portfolio", key: "portfolio", icon: faBook },
  { to: "/passions", key: "interests", icon: faPuzzlePiece },
  { to: "/contact", key: "contact", icon: faComment },
  { to: "/chatbot", key: "chatbot", icon: faRobot },
] as const;

function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = normalizeLanguage(i18n.language);
  const next = current === "fr" ? "en" : "fr";
  const label = next === "en" ? "Switch to English" : "Passer en français";
  return (
    <button
      type="button"
      className="tool-button language-toggle"
      onClick={() => setLanguage(next)}
      title={label}
    >
      {/* Written in the language it switches to, for those who need it. */}
      <span className="sr-only" lang={next}>
        {label}
      </span>
      <span
        aria-hidden="true"
        className={current === "fr" ? "is-current" : undefined}
      >
        FR
      </span>
      <span
        aria-hidden="true"
        className={current === "en" ? "is-current" : undefined}
      >
        EN
      </span>
    </button>
  );
}

function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const label = theme === "dark" ? t("ui.themeLight") : t("ui.themeDark");
  return (
    <button
      type="button"
      className="tool-button theme-toggle"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        toggle({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }}
      aria-label={label}
      title={label}
    >
      <Icon icon={theme === "dark" ? faSun : faMoon} />
    </button>
  );
}

export default function TopBar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // The menu closes once a page was chosen.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NavLink to="/" className="brand" end>
          <span className="brand-mark" aria-hidden="true">
            CF
          </span>
          <span className="brand-name">Camille Fourmaintraux</span>
        </NavLink>

        <button
          type="button"
          ref={menuButtonRef}
          className="tool-button menu-button"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <Icon icon={open ? faXmark : faBars} />
          <span>{t("ui.menu")}</span>
        </button>

        <div
          id="site-menu"
          className={open ? "topbar-menu is-open" : "topbar-menu"}
        >
          <nav aria-label={t("ui.mainNav")}>
            <ul className="main-nav">
              {LINKS.map(({ to, key, icon }) => (
                <li key={to}>
                  <NavLink to={to} end={to === "/"} className="main-nav-link">
                    <Icon icon={icon} />
                    <span>{t(`header.mainnav.${key}`)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="topbar-tools">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
