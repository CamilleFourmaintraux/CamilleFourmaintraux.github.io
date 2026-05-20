import { NavLink, useMatch } from "react-router";
import { useTranslation } from "react-i18next";

export default function Footer() {
  // <a  href="/files/resume.pdf" target="_blank" download> Cv <i className="fas fa-file-pdf"></i></a>
  const { t } = useTranslation();
  return (
    <>
      <span id="findepage"></span>
      <footer>
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
      </footer>
    </>
  );
}

function Icon() {
  // Utilisation de `useMatch` pour vérifier si le lien est actif
  const match = useMatch("documents");

  return <i className={match ? "fas fa-folder-open" : "fas fa-folder"}></i>;
}
