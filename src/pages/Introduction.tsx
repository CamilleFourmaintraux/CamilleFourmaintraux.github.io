import { useTranslation } from "react-i18next";

export default function IntroductionPage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="container">
        <h2>
          <i className="fas fa-user"></i> {t("presentation.title")}
        </h2>
        <p>
          {t("presentation.greeting")}
          <br />
          {t("presentation.intro")}
          <br />
          <br />
          {t("presentation.motivation")}
          <br />
        </p>
      </div>
      <div className="container">
        <h2>
          <i className="fas fa-bullseye"></i> {t("goals.title")}
        </h2>
        <p>{t("goals.text")}</p>
      </div>
      <div className="container">
        <h2>
          <i className="fas fa-download"></i> {t("cv.title")}
        </h2>
        <p>
          {t("cv.download")}{" "}
          <a href="/files/resume.pdf" target="_blank" download>
            {t("cv.here")}
          </a>
          .<br />
        </p>
      </div>
      <div className="container">
        <h2>
          <i className="fas fa-circle-exclamation"></i> {t("dev.title")}
        </h2>
        <p>
          {t("dev.text")} <i className="fas fa-bug"></i>
        </p>
      </div>
    </>
  );
}
