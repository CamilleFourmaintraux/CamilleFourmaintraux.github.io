import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import BouncingImage from "./BouncingImage";

export default function PingPongPage() {
  const { t } = useTranslation();
  return (
    <div className="container">
      <h2>
        <i className="fas fa-triangle-exclamation"></i> {t("test.title")}
      </h2>
      <center>
        <BouncingImage
          width={800}
          height={500}
          imageSrc={"/img/passions/DVD_logo.png"}
        ></BouncingImage>
      </center>

      <p>{t("test.main")}</p>
      <NavLink to="/"> {t("test.back")}</NavLink>
    </div>
  );
}
