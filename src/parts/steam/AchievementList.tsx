import { useTranslation } from "react-i18next";
import type { Achievement } from "./steamApi";
import { formatDate, formatPercent } from "./steamFormat";

type Props = {
  achievements: (Achievement & { game?: string })[];
  lang: string;
};

export default function AchievementList({ achievements, lang }: Props) {
  const { t } = useTranslation();
  return (
    <ul className="steam-achievements">
      {achievements.map((a, i) => (
        <li
          key={`${a.id}-${i}`}
          className={`steam-achievement${a.achieved ? "" : " locked"}`}
        >
          <img src={a.icon} alt="" width={48} height={48} loading="lazy" />
          <div className="steam-achievement-text">
            <strong>{a.name}</strong>
            <span className="steam-muted">
              {a.description ?? t("steam.game.hidden")}
            </span>
            {a.game && <span className="steam-achievement-game">{a.game}</span>}
          </div>
          <div className="steam-achievement-meta">
            <span>
              {a.achieved && a.unlockTime
                ? formatDate(a.unlockTime, lang)
                : t("steam.game.locked")}
            </span>
            {a.percent !== null && (
              <span className="steam-muted">
                {t("steam.latest.rarity", {
                  percent: formatPercent(a.percent, lang),
                })}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
