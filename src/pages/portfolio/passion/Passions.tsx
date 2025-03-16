import { useTranslation } from "react-i18next";
import Realisations from "../Realisations";
import Data from "./Data";

export default function Passions() {
  const { t } = useTranslation();
  return (
    <>
      <Realisations
        data={Data}
        pageTitle={t("portfolio.passion.page_title")}
        pageSubtitle={t("portfolio.passion.page_subtitle")}
        pageDescription={t("portfolio.passion.page_description")}
      />
    </>
  );
}
