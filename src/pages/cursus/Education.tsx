import { useTranslation } from "react-i18next";
import { faSchool } from "@fortawesome/free-solid-svg-icons";
import { Picture } from "@/ui/Media";
import { Section } from "@/ui/Page";
import PdfLink from "@/ui/PdfLink";
import Reveal from "@/ui/Reveal";

export default function Education() {
  const { t } = useTranslation();
  const iut = t("formation.iut");
  return (
    <Section id="formation" title={t("formation.title")} icon={faSchool}>
      <ol className="timeline">
        <Reveal as="li" className="timeline-step">
          <h3 className="timeline-date">{t("formation.since_2025")}</h3>
          <ul>
            <li>
              {t("formation.current.degree")} - {t("formation.polytech")}
            </li>
            <li>{t("formation.current.year")}</li>
            <li>{t("formation.current.courses")}</li>
          </ul>
        </Reveal>

        <Reveal as="li" className="timeline-step">
          <h3 className="timeline-date">2025</h3>
          <ul>
            <li>
              {t("formation.2025.but")} - {iut}
            </li>
            <li>
              <PdfLink href="/files/StudiesNotice.pdf">
                {t("formation.2025.notice")}
              </PdfLink>
            </li>
            <li>
              {t("formation.2025.toeic")}{" "}
              <PdfLink href="/files/ToeicCertification_web.pdf">
                TOEIC {t("formation.2025.toeic_level")}
              </PdfLink>{" "}
              - {iut}
            </li>
          </ul>
        </Reveal>

        <Reveal as="li" className="timeline-step">
          <h3 className="timeline-date">2024</h3>
          <ul>
            <li>
              <PdfLink href="/files/kaplanCertificate.pdf">
                {t("formation.2024.kaplan")}
              </PdfLink>{" "}
              {t("formation.2024.kaplan_desc")}
            </li>
            <li>
              <PdfLink href="/files/DutCertificate.pdf">
                {t("formation.2024.dut")}
              </PdfLink>{" "}
              - {iut}
            </li>
          </ul>
          <Picture
            src="cursus/iut.jpg"
            alt={t("formation.2024.iut_img_alt")}
            className="timeline-picture"
          />
        </Reveal>

        <Reveal as="li" className="timeline-step">
          <h3 className="timeline-date">2022</h3>
          <ul>
            <li>{t("formation.2022.bac")}</li>
            <li>
              <PdfLink href="/files/pixCertificate.pdf">
                {t("formation.2022.pix")}
              </PdfLink>{" "}
              - {t("formation.lycee")}
            </li>
            <li>{t("formation.2022.driving")}</li>
          </ul>
          <Picture
            src="cursus/lycee.png"
            alt={t("formation.2022.lyc_img_alt")}
            className="timeline-picture"
          />
        </Reveal>
      </ol>
    </Section>
  );
}
