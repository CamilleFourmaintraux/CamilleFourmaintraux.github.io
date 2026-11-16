import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";

export default function PacManPage() {
  const { t } = useTranslation();
  const PacManStyle = {
    width: 342,
    height: 490,
    border: "none",
  };
  return (
    <div className="container">
      <h2>
        <i className="fas fa-triangle-exclamation"></i> PacMan
      </h2>
      <iframe
        className="PacManFrame"
        src="https://funhtml5games.com?embed=pacman"
        style={PacManStyle}
        frameBorder="0"
        scrolling="no"
      ></iframe>

      <NavLink to="/"> {t("test.back")}</NavLink>
    </div>
  );
}
