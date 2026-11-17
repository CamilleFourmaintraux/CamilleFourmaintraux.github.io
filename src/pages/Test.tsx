import { useTranslation } from "react-i18next";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import BackHome from "@/ui/BackHome";
import Page from "@/ui/Page";

export default function Test() {
  const { t } = useTranslation();
  return (
    <Page
      title={t("test.title")}
      icon={faTriangleExclamation}
      lead={<p>{t("test.main")}</p>}
    >
      <BackHome />
    </Page>
  );
}
