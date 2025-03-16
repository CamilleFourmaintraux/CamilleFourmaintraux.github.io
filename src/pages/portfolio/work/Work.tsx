import { useTranslation } from "react-i18next";
import Realisations from "../Realisations";
import Data from "./Data";

export default function Work() {
  const { t } = useTranslation();
  return (
    <Realisations
      data={Data}
      pageTitle={t("portfolio.work.page_title")}
      pageSubtitle={t("portfolio.work.page_subtitle")}
      pageDescription={t("portfolio.work.page_description")}
    />
  );
}
