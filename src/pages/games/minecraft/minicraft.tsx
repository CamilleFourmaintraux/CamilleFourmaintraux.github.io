import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";

export default function MinicraftPage() {
  const { t } = useTranslation();
  const MinicraftStyle = {
    width: 480,
    height: 555,
    border: "none",
  };
  return (
    <div className="container">
      <h2>
        <i className="fas fa-triangle-exclamation"></i> Minecraft?
      </h2>
      <iframe
        src="https://funhtml5games.com?embed=minicraft"
        frameBorder="0"
        style={MinicraftStyle}
        scrolling="no"
      ></iframe>

      <NavLink to="/"> {t("test.back")}</NavLink>
    </div>
  );
}
