import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AchievementList from "./AchievementList";
import {
  fetchGameAchievements,
  headerImage,
  storePage,
  type GameAchievements,
  type SteamGame,
} from "./steamApi";
import { completion, formatHours } from "./steamFormat";

type Props = { game: SteamGame | null; lang: string; onClose: () => void };

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: GameAchievements };

export default function AchievementsDialog({ game, lang, onClose }: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (game && !dialog.open) dialog.showModal();
    if (!game && dialog.open) dialog.close();
  }, [game]);

  useEffect(() => {
    if (!game) return;
    let active = true;
    setState({ status: "loading" });
    fetchGameAchievements(game.appid, lang)
      .then((data) => active && setState({ status: "ready", data }))
      .catch(() => active && setState({ status: "error" }));
    return () => {
      active = false;
    };
  }, [game, lang, attempt]);

  return (
    <dialog
      ref={dialogRef}
      className="steam-dialog"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-labelledby="steam-dialog-title"
    >
      {game && (
        <div className="steam-dialog-content">
          <img
            className="steam-dialog-header"
            src={headerImage(game.appid)}
            alt=""
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <div className="steam-dialog-title">
            <h3 id="steam-dialog-title">{game.name}</h3>
            <button
              type="button"
              className="steam-icon-button"
              onClick={onClose}
              aria-label={t("steam.game.close")}
            >
              <i className="fas fa-xmark"></i>
            </button>
          </div>
          <p className="steam-muted">
            {game.minutes > 0
              ? t("steam.library.hours", {
                  hours: formatHours(game.minutes, lang),
                })
              : t("steam.library.neverPlayed")}
            {" · "}
            <a
              href={storePage(game.appid)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("steam.game.openStore")}
            </a>
          </p>

          {state.status === "loading" && (
            <p className="steam-muted">{t("steam.game.loading")}</p>
          )}
          {state.status === "error" && (
            <p>
              {t("steam.game.error")}{" "}
              <button type="button" onClick={() => setAttempt((n) => n + 1)}>
                {t("steam.retry")}
              </button>
            </p>
          )}
          {state.status === "ready" &&
            (state.data.total === 0 ? (
              <p className="steam-muted">{t("steam.game.none")}</p>
            ) : (
              <>
                <div className="steam-progress-label">
                  <span>
                    {t("steam.game.progress", {
                      unlocked: state.data.unlocked,
                      total: state.data.total,
                    })}
                  </span>
                  <span>
                    {t("steam.percent", {
                      value: completion(state.data.unlocked, state.data.total),
                    })}
                  </span>
                </div>
                <div className="steam-meter" aria-hidden="true">
                  <div
                    style={{
                      width: `${completion(state.data.unlocked, state.data.total)}%`,
                    }}
                  />
                </div>
                <AchievementList
                  achievements={state.data.achievements}
                  lang={lang}
                />
              </>
            ))}
        </div>
      )}
    </dialog>
  );
}
