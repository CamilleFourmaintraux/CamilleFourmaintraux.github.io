import { legacyPath } from "@/lib/paths";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

const MainNav: React.FC = () => {
  const { t } = useTranslation();
  return (
    <nav id="mainnav">
      <NavLink
        to={legacyPath("/")}
        className={({ isActive }) => (isActive ? "current navlink" : "navlink")}
      >
        <i className="fas fa-home"></i> {t("header.mainnav.home")}
      </NavLink>
      <NavLink
        to={legacyPath("/cursus")}
        className={({ isActive }) => (isActive ? "current navlink" : "navlink")}
      >
        <i className="fas fa-graduation-cap"></i> {t("header.mainnav.career")}
      </NavLink>
      <NavLink
        to={legacyPath("/portfolio")}
        className={({ isActive }) => (isActive ? "current navlink" : "navlink")}
      >
        <i className="fas fa-book"></i> {t("header.mainnav.portfolio")}
      </NavLink>
      <NavLink
        to={legacyPath("/passions")}
        className={({ isActive }) => (isActive ? "current navlink" : "navlink")}
      >
        <i className="fas fa-puzzle-piece"></i> {t("header.mainnav.interests")}
      </NavLink>
      <NavLink
        to={legacyPath("/contact")}
        className={({ isActive }) => (isActive ? "current navlink" : "navlink")}
      >
        <i className="fas fa-comment"></i> {t("header.mainnav.contact")}
      </NavLink>
      <NavLink
        to={legacyPath("/chatbot")}
        className={({ isActive }) => (isActive ? "current navlink" : "navlink")}
      >
        <i className="fas fa-robot"></i> {t("header.mainnav.chatbot")}
      </NavLink>
    </nav>
  );
};

export default MainNav;
