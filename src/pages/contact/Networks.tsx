import { useTranslation } from "react-i18next";

export default function Networks() {
  const { t } = useTranslation();
  return (
    <div className="container">
      <h2>
        <i className="fas fa-comment"></i> {t("contact.title")}
      </h2>
      <p>
        {t("contact.intro")}
        <br />
        <br />
        {t("contact.mail")}{" "}
        <a
          href="mailto:fourmaintrauxcamille2004@gmail.com"
          className="persecuted"
        >
          <i className="fas fa-envelope"></i> fourmaintrauxcamille2004@gmail.com
        </a>
        <br />
        {t("contact.linkedin")}{" "}
        <a
          href="https://www.linkedin.com/in/camille-fourmaintraux-708b34275/"
          target="_blank"
          className="persecuted"
        >
          <i className="fab fa-linkedin"></i>{" "}
          www.linkedin.com/in/camille-fourmaintraux-708b34275
        </a>
        <br />
        {t("contact.github")}{" "}
        <a
          href="https://github.com/CamilleFourmaintraux"
          target="_blank"
          className="persecuted"
        >
          <i className="fab fa-github"></i>{" "}
          https://github.com/CamilleFourmaintraux
        </a>
        <br />
        <br />
        {t("contact.footer")}
      </p>
    </div>
  );
}
