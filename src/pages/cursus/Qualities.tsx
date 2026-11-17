import { useTranslation } from "react-i18next";
import { faHandshake } from "@fortawesome/free-solid-svg-icons";
import { Section } from "@/ui/Page";

const QUALITIES = ["organized", "attentive", "curious", "autonomous"];

export default function Qualities() {
  const { t } = useTranslation();
  return (
    <Section
      id="qualites"
      title={t("skills.qualities.title")}
      icon={faHandshake}
    >
      <ul className="quality-list">
        {QUALITIES.map((quality) => (
          <li key={quality}>{t(`skills.qualities.${quality}`)}</li>
        ))}
      </ul>
    </Section>
  );
}
