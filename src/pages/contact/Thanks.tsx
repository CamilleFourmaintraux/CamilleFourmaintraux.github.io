import { useTranslation } from "react-i18next";

export default function Thanks() {
  const { t } = useTranslation();
  return (
    <div className="container">
      <h2>
        <i className="fas fa-heart"></i> {t("thanks.title")}
      </h2>
      <p>{t("thanks.message")}</p>
    </div>
  );
}
