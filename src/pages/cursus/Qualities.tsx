import { useTranslation } from "react-i18next";

export default function Qualities() {
  const { t } = useTranslation();
  return (
    <div className="container" id="qualites">
      <h2>{t("skills.qualities.title")}</h2>
      <ul>
        <li>{t("skills.qualities.organized")}</li>
        <li>{t("skills.qualities.attentive")}</li>
        <li>{t("skills.qualities.curious")}</li>
        <li>{t("skills.qualities.autonomous")}</li>
      </ul>
    </div>
  );
}
