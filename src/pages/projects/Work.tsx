import { useTranslation } from "react-i18next";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import Page, { Section } from "@/ui/Page";
import ProjectList from "./ProjectList";
import projects from "./workData";

export default function Work() {
  const { t } = useTranslation();
  return (
    <Page
      title={t("portfolio.work.page_title")}
      icon={faBook}
      lead={
        <>
          <p>{t("portfolio.work.page_description")}</p>
          <p className="note">
            <i>{t("portfolio.work.sae_explanation")}</i>
          </p>
        </>
      }
    >
      <Section stacked title={t("portfolio.work.page_subtitle")}>
        <ProjectList projects={projects} />
      </Section>
    </Page>
  );
}
