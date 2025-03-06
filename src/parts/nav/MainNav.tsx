import { NavLink } from "react-router";

const MainNav: React.FC = () => {
  return (
    <nav id="mainnav">
      <NavLink to="/" className={({ isActive }) => (isActive ? "current" : "")}>
        <i className="fas fa-home"></i> Accueil
      </NavLink>
      <NavLink to="/cursus" className={({ isActive }) => (isActive ? "current" : "")}>
        <i className="fas fa-graduation-cap"></i> Cursus
      </NavLink>
      <NavLink to="/portfolio" className={({ isActive }) => (isActive ? "current" : "")}>
        <i className="fas fa-book"></i> Portfolio
      </NavLink>
      <NavLink to="/passions" className={({ isActive }) => (isActive ? "current" : "")}>
        <i className="fas fa-puzzle-piece"></i> Centres d'intérêt
      </NavLink>
      <NavLink to="/contact" className={({ isActive }) => (isActive ? "current" : "")}>
        <i className="fas fa-comment"></i> Contact
      </NavLink>
    </nav>
  );
};

export default MainNav;