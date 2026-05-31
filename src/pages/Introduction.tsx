import { useTranslation } from "react-i18next";

let ytbVideoRef = "EuAhIBpanhQ?si=NSjBc6L4-NPG9d3E";
let ytbLink = "https://www.youtube.com/embed/";

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
          <i className="fas fa-video"></i> {t("youtube.title")}
        </h2>
        <p>
          {t("youtube.mychannel")}
          <a href="https://youtube.com/@camille-we8dx?si=hSlOW24EazkZ0QTH">
            @Camille-we8dx
          </a>
        </p>
        <iframe
          width="666"
          height="420"
          src={ytbLink + ytbVideoRef}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>
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
