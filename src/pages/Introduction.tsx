import { useTranslation } from "react-i18next";
const myYoutubeChannel =
  "https://youtube.com/@camille-we8dx?si=hSlOW24EazkZ0QTH";
const myYoutubeID = "@Camille-we8dx";
let ytbVideoRef = "Zwbzhw_zF74";
const ytbLink = "https://www.youtube.com/embed/";

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
          <a href={myYoutubeChannel}>{myYoutubeID}</a>
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
      {/* <div className="container">
        <h2>
          <i className="fas fa-hand-holding-dollar"></i> {t("donation.title")}
        </h2>
        <p>
          {" "}
          {t("donation.text")}
          <a href="https://gofund.me/5ec8669bb">gofund.me/5ec8669bb</a>
        </p>

        <img
          src="/img/qr-code_gofundme1.png"
          alt={t("donation.img.alt")}
          title={t("donation.img.alt")}
        />
        <img
          src="/img/qr-code_gofundme2.png"
          alt={t("donation.img.alt")}
          title={t("donation.img.alt")}
        />
        <div
          className="gfm-embed"
          data-url="https://www.gofundme.com/f/help-us-fight-back-against-unfair-business-practices/widget/large?sharesheet=undefined&attribution_id=sl:4d30830d-8c9b-44f9-8ffb-9b3d113ff850"
        ></div>
        <script
          defer
          src="https://www.gofundme.com/static/js/embed.js"
        ></script>
      </div> */}

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
