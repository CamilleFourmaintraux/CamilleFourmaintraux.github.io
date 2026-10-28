import { useEffect, useRef } from "react";
import { NavLink, useMatch } from "react-router";
import { useTranslation } from "react-i18next";

// Shares the footer height with the CSS: it changes when the links wrap.
function useFooterHeight() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const footer = ref.current;
    if (!footer) return;
    const root = document.documentElement;
    const update = () =>
      root.style.setProperty("--footer-height", `${footer.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function Footer() {
  // <a  href="/files/resume.pdf" target="_blank" download> Cv <i className="fas fa-file-pdf"></i></a>
  const { t } = useTranslation();
  const footerRef = useFooterHeight();
  return (
    <>
      <div id="findepage" aria-hidden="true"></div>
      <footer ref={footerRef}>
        <a href={t("footer.resume_filename")} className="navlink">
          {" "}
          {t("footer.resume")} <i className="fas fa-file-pdf"></i>
        </a>
        <NavLink to="contact" className="navlink">
          {" "}
          {t("footer.email")} <i className="fas fa-envelope"></i>
        </NavLink>
        <a
          href="https://www.linkedin.com/in/camille-fourmaintraux-708b34275/"
          target="_blank"
          className="navlink"
        >
          {" "}
          {t("footer.linkedin")} <i className="fab fa-linkedin"></i>
        </a>
        <a
          href="https://github.com/CamilleFourmaintraux"
          target="_blank"
          className="navlink"
        >
          {" "}
          {t("footer.github")} <i className="fab fa-github"></i>
        </a>
        <NavLink
          to="documents"
          className={({ isActive }) =>
            isActive ? "current navlink" : "navlink"
          }
        >
          {" "}
          {t("footer.files")} <Icon />
        </NavLink>
        <NavLink
          to="privacy"
          className={({ isActive }) =>
            isActive ? "current navlink" : "navlink"
          }
        >
          {" "}
          {t("footer.privacy")} <i className="fas fa-shield-halved"></i>
        </NavLink>
      </footer>
    </>
  );
}

function Icon() {
  // Utilisation de `useMatch` pour vérifier si le lien est actif
  const match = useMatch("documents");

  return <i className={match ? "fas fa-folder-open" : "fas fa-folder"}></i>;
}
