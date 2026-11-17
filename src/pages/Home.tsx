import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  faBug,
  faBullseye,
  faCircleExclamation,
  faDownload,
  faEnvelope,
  faUser,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { YOUTUBE_HANDLE, YOUTUBE_URL } from "@/lib/links";
import ExternalLink from "@/ui/ExternalLink";
import Icon from "@/ui/Icon";
import MazeCanvas from "@/ui/MazeCanvas";
import { Section } from "@/ui/Page";
import Portrait from "@/ui/Portrait";
import { usePageTitle } from "@/ui/usePageTitle";
import YouTubeEmbed from "@/ui/YouTubeEmbed";

const VIDEO_ID = "Zwbzhw_zF74";

export default function Home() {
  const { t } = useTranslation();
  const headingRef = usePageTitle(null);
  const resume = t("footer.resume_filename");

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <MazeCanvas className="hero-maze" cell={32} interactive />
        <div className="hero-inner">
          <div className="hero-text">
            <h1 id="hero-title" ref={headingRef} tabIndex={-1}>
              <span className="hero-first">Camille</span>{" "}
              <span className="hero-last">Fourmaintraux</span>
            </h1>
            <p className="hero-subtitle">{t("header.subtitle_sentence")}</p>
            <div className="hero-actions">
              <a
                className="button button-primary"
                href={resume}
                target="_blank"
                rel="noopener"
                download
              >
                <Icon icon={faDownload} />
                {t("cv.title")}
                <span className="sr-only"> (PDF)</span>
              </a>
              <Link className="button" to="/contact">
                <Icon icon={faEnvelope} />
                {t("header.mainnav.contact")}
              </Link>
            </div>
          </div>
          <Portrait />
        </div>
      </section>

      <div className="page-body">
        <Section title={t("presentation.title")} icon={faUser}>
          <p className="greeting">{t("presentation.greeting")}</p>
          <p>{t("presentation.intro")}</p>
          <p>{t("presentation.career_path")}</p>
          <p className="callout">{t("presentation.internship")}</p>
          <p>{t("presentation.motivation")}</p>
        </Section>

        <Section title={t("goals.title")} icon={faBullseye}>
          <p>{t("goals.text")}</p>
        </Section>

        <Section title={t("cv.title")} icon={faDownload}>
          <p>
            {t("cv.download")}{" "}
            <a
              href={resume}
              target="_blank"
              rel="noopener"
              download
              // The visible word alone ("here") says nothing out of context.
              aria-label={`${t("cv.here")}, ${t("cv.title")} (PDF)`}
            >
              {t("cv.here")}
            </a>
            .
          </p>
        </Section>

        <Section title={t("youtube.title")} icon={faVideo}>
          <p>
            {t("youtube.mychannel")}
            <ExternalLink href={YOUTUBE_URL}>{YOUTUBE_HANDLE}</ExternalLink>
          </p>
          <YouTubeEmbed videoId={VIDEO_ID} title={t("youtube.title")} />
        </Section>

        <Section title={t("dev.title")} icon={faCircleExclamation}>
          <p>
            {t("dev.text")} <Icon icon={faBug} />
          </p>
        </Section>
      </div>
    </>
  );
}
