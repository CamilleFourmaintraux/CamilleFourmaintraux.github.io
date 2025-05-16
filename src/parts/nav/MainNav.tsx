import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

const MainNav: React.FC = () => {
  const { t } = useTranslation();
  return (
    <nav id="mainnav">
      <NavLink
        to="/"
        className={({ isActive }) => (isActive ? "current navlink" : "navlink")}
      >
        <i className="fas fa-home"></i> {t("header.mainnav.home")}
      </NavLink>
      <NavLink
        to="/cursus"
        className={({ isActive }) => (isActive ? "current navlink" : "navlink")}
      >
        <i className="fas fa-graduation-cap"></i> {t("header.mainnav.career")}
      </NavLink>
      <NavLink
        to="/portfolio"
        className={({ isActive }) => (isActive ? "current navlink" : "navlink")}
      >
        <i className="fas fa-book"></i> {t("header.mainnav.portfolio")}
      </NavLink>
      <NavLink
        to="/passions"
        className={({ isActive }) => (isActive ? "current navlink" : "navlink")}
      >
        <i className="fas fa-puzzle-piece"></i> {t("header.mainnav.interests")}
      </NavLink>
      <NavLink
        to="/contact"
        className={({ isActive }) => (isActive ? "current navlink" : "navlink")}
      >
        <i className="fas fa-comment"></i> {t("header.mainnav.contact")}
      </NavLink>
    </nav>
  );
};

export default MainNav;
