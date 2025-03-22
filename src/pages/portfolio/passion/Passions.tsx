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
      >
        <div>
          <h3>{t("portfolio.passion.other_activities.title")}</h3>
          <ul>
            <li>{t("portfolio.passion.other_activities.programming")}</li>
            <li>
              {t(
                "portfolio.passion.other_activities.member_of_board_game_club"
              )}
            </li>
            <li>{t("portfolio.passion.other_activities.solving_riddles")}</li>
            <li>{t("portfolio.passion.other_activities.escape_games")}</li>
            <li>{t("portfolio.passion.other_activities.news_monitoring")}</li>
            <li>{t("portfolio.passion.other_activities.reading")}</li>
          </ul>
        </div>
      </Realisations>
    </>
  );
}
