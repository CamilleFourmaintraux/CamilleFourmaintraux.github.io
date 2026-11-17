import { useTranslation } from "react-i18next";
import {
  faCircleInfo,
  faDownload,
  faFileCircleQuestion,
  faFilePdf,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "@/ui/Icon";
import Page, { Section } from "@/ui/Page";
import Reveal from "@/ui/Reveal";

// label: translation key, with an optional suffix such as the year.
const DOCUMENTS: { label: string; suffix?: string; file: string }[] = [
  { label: "resume_english", file: "resume_internship.pdf" },
  { label: "resume_french", file: "resume_stage.pdf" },
  { label: "dut_certificate", file: "DutCertificate.pdf" },
  {
    label: "internship_report",
    suffix: " 2025",
    file: "InternshipReportEmothep2025.pdf",
  },
  {
    label: "internship_report",
    suffix: " 2024",
    file: "InternshipReportEmothep2024.pdf",
  },
  { label: "kaplan", file: "kaplanCertificate.pdf" },
  { label: "pix", file: "pixCertificate.pdf" },
  { label: "studies_notice", file: "StudiesNotice.pdf" },
  // Lighter copy of ToeicCertification.pdf (1.3 MB instead of 19 MB).
  { label: "toeic", file: "ToeicCertification_web.pdf" },
];

export default function Documents() {
  const { t } = useTranslation();
  return (
    <Page title={t("footer.files")} icon={faFolderOpen}>
      <Section title={t("documents_intro.title")} icon={faCircleInfo}>
        <p>{t("documents_intro.description")}</p>
      </Section>

      <Section title={t("documents.title")} icon={faDownload}>
        <ul className="document-list">
          {DOCUMENTS.map(({ label, suffix = "", file }, index) => {
            const name = t(`documents.${label}`) + suffix;
            return (
              <Reveal as="li" key={file} index={index}>
                <Icon icon={faFilePdf} className="document-icon" />
                <span className="document-name">{name}</span>
                <a
                  className="button button-small"
                  href={`/files/${file}`}
                  target="_blank"
                  rel="noopener"
                  download
                >
                  <Icon icon={faDownload} />
                  {t("documents.download")}
                  <span className="sr-only">, {name} (PDF)</span>
                </a>
              </Reveal>
            );
          })}
        </ul>
      </Section>

      <Section title={t("pending.title")} icon={faFileCircleQuestion}>
        <p>{t("pending.description")}</p>
      </Section>
    </Page>
  );
}
