import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import BouncingImageCanvas from "../../../parts/utils/BouncingImageCanvas";

export default function DemoPongPage() {
  const { t } = useTranslation();
  return (
    <div className="container">
      <h2>
        <i className="fas fa-triangle-exclamation"></i> {t("test.title")}
      </h2>
      <h3>Ceci est la page de Pong !</h3>
      <BouncingImageCanvas
        canvasWidth={600}
        canvasHeight={400}
        imageSrc="public/img/oldFavicon.ico"
        imageWidth={50}
        imageHeight={50}
        speedX={5}
        speedY={3}
        backgroundColor="transparent"
      />

      <p>{t("test.main")}</p>
      <NavLink to="/"> {t("test.back")}</NavLink>
    </div>
  );
}
