import { useTranslation } from "react-i18next";
import { faBriefcase } from "@fortawesome/free-solid-svg-icons";
import ExternalLink from "@/ui/ExternalLink";
import { Picture } from "@/ui/Media";
import { Section } from "@/ui/Page";
import PdfLink from "@/ui/PdfLink";
import Reveal from "@/ui/Reveal";

const EMothep = () => (
  <strong className="nowrap">
    <ExternalLink href="https://e-mothep.fr/">E-Mothep</ExternalLink>
  </strong>
);

const MISSIONS = [
  "main_project",
  "api",
  "documentation",
  "internal_project",
  "pm",
  "skills",
  "tools",
];

const withoutColon = (label: string) => label.replace(/\s*:\s*$/, "");

export default function Experiences() {
  const { t } = useTranslation();
  return (
    <Section id="experiences" title={t("experience.title")} icon={faBriefcase}>
      <div className="experience-list">
        <Reveal as="article" className="card experience" id="stage2025">
          <h3>
            {t("experience.stage2025.title")} <EMothep /> [Lille]
          </h3>
          <p>{t("experience.stage2025.description")}</p>
          <p>
            <PdfLink href="/files/InternshipReportEmothep2025.pdf">
              {t("experience.stage2025.full_report")}
            </PdfLink>
          </p>
        </Reveal>

        <Reveal as="article" className="card experience" id="tutorat" index={1}>
          <h3>{t("experience.tutor.title")}</h3>
          <ul>
            <li>{t("experience.tutor.support")}</li>
            <li>{t("experience.tutor.group")}</li>
            <li>{t("experience.tutor.responsibilities")}</li>
          </ul>
        </Reveal>

        <Reveal as="article" className="card experience" id="stage2024">
          <div className="experience-header">
            <h3>
              {t("experience.stage2024.title")} <EMothep /> [Lille]
            </h3>
            <Picture
              src="cursus/emothep_logo.png"
              alt={t("experience.stage2024.logo_alt")}
              className="experience-logo"
              sizes="6rem"
            />
          </div>
          <p>
            <EMothep /> {t("experience.stage2024.company_desc")}
          </p>
          <dl className="mission-list">
            {MISSIONS.map((mission) => (
              <div key={mission}>
                <dt>
                  {withoutColon(t(`experience.stage2024.${mission}.title`))}
                </dt>
                <dd>{t(`experience.stage2024.${mission}.desc`)}</dd>
              </div>
            ))}
          </dl>
          <p>
            <PdfLink href="/files/InternshipReportEmothep2024.pdf">
              {t("experience.stage2024.full_report")}
            </PdfLink>
          </p>
        </Reveal>

        <Reveal
          as="article"
          className="card experience"
          id="carrefour"
          index={1}
        >
          <h3>{t("experience.carrefour.title")}</h3>
          <ul>
            <li>{t("experience.carrefour.team")}</li>
            <li>{t("experience.carrefour.autonomy")}</li>
            <li>{t("experience.carrefour.initiative")}</li>
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
