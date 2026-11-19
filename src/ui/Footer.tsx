import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  faClockRotateLeft,
  faEnvelope,
  faFileLines,
  faFilePdf,
  faFolderOpen,
  faQrcode,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { hasLegacyVersion, legacyPath } from "@/lib/paths";
import { GITHUB_URL, LINKEDIN_URL } from "@/lib/links";
import ExternalLink from "./ExternalLink";
import Icon from "./Icon";

export default function Footer() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <nav aria-label={t("ui.footerNav")}>
          <ul className="footer-links">
            <li>
              <a href={t("footer.resume_filename")}>
                <Icon icon={faFilePdf} /> {t("footer.resume")}
                <span className="sr-only"> (PDF)</span>
              </a>
            </li>
            <li>
              <NavLink to="/contact">
                <Icon icon={faEnvelope} /> {t("footer.email")}
              </NavLink>
            </li>
            <li>
              <ExternalLink href={LINKEDIN_URL} plain>
                <Icon icon={faLinkedin} /> {t("footer.linkedin")}
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={GITHUB_URL} plain>
                <Icon icon={faGithub} /> {t("footer.github")}
              </ExternalLink>
            </li>
            <li>
              <NavLink to="/documents">
                <Icon icon={faFolderOpen} /> {t("footer.files")}
              </NavLink>
            </li>
            <li>
              <NavLink to="/cv-generator">
                <Icon icon={faFileLines} /> {t("ui.cvGenerator")}
              </NavLink>
            </li>
            <li>
              <NavLink to="/qr-code-generator">
                <Icon icon={faQrcode} /> {t("ui.qrGenerator")}
              </NavLink>
            </li>
            <li>
              <NavLink to="/privacy">
                <Icon icon={faShieldHalved} /> {t("footer.privacy")}
              </NavLink>
            </li>
          </ul>
        </nav>
        {hasLegacyVersion(pathname) && (
          <p className="footer-legacy">
            <NavLink to={legacyPath(pathname)}>
              <Icon icon={faClockRotateLeft} /> {t("ui.oldVersion")}
            </NavLink>
          </p>
        )}
      </div>
    </footer>
  );
}
