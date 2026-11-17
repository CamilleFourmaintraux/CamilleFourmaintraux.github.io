import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { faDice, faPuzzlePiece } from "@fortawesome/free-solid-svg-icons";
import Page, { Section } from "@/ui/Page";
import ProjectList from "./ProjectList";
import projects from "./passionData";

const ACTIVITIES = [
  "programming",
  "member_of_board_game_club",
  "solving_riddles",
  "escape_games",
  "news_monitoring",
  "reading",
];

export default function Passions() {
  const { t } = useTranslation();
  return (
    <Page
      title={t("portfolio.passion.page_title")}
      icon={faPuzzlePiece}
      lead={
        <>
          <p>{t("portfolio.passion.page_description")}</p>
          <p>
            <Trans
              i18nKey="portfolio.passion.steam_sentence"
              components={{
                steamLink: <Link to="/steam" className="nowrap" />,
              }}
            />
          </p>
        </>
      }
    >
      <Section
        title={t("portfolio.passion.other_activities.title")}
        icon={faDice}
      >
        <ul className="activity-list">
          {ACTIVITIES.map((activity) => (
            <li key={activity}>
              {t(`portfolio.passion.other_activities.${activity}`)}
            </li>
          ))}
        </ul>
      </Section>
      <Section stacked title={t("portfolio.passion.page_subtitle")}>
        <ProjectList projects={projects} />
      </Section>
    </Page>
  );
}
