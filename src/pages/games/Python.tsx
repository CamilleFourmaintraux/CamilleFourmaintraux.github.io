import { useTranslation } from "react-i18next";
import { faPython } from "@fortawesome/free-brands-svg-icons";
import BackHome from "@/ui/BackHome";
import Page from "@/ui/Page";

export default function Python() {
  const { t } = useTranslation();
  const title = t("portfolio.prog.python.title");
  return (
    <Page
      title={title}
      icon={faPython}
      lead={<p>{t("portfolio.prog.python.desc")}</p>}
    >
      <iframe
        className="embed embed-console"
        src="https://pyodide.org/en/stable/console.html"
        title={title}
        loading="lazy"
      />
      <BackHome />
    </Page>
  );
}
