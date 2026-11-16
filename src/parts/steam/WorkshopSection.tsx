import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchWorkshop, type Workshop } from "./steamApi";
import { formatDate } from "./steamFormat";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: Workshop };

export default function WorkshopSection({ lang }: { lang: string }) {
  const { t } = useTranslation();
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    fetchWorkshop()
      .then((data) => active && setState({ status: "ready", data }))
      .catch(() => active && setState({ status: "error" }));
    return () => {
      active = false;
    };
  }, [attempt]);

  if (state.status === "ready" && state.data.items.length === 0) return null;

  const number = (n: number) => new Intl.NumberFormat(lang).format(n);
  const count = (key: string, n: number) =>
    t(`steam.workshop.${key}`, { count: n, value: number(n) });

  return (
    <div className="container">
      <h2>
        <i className="fas fa-screwdriver-wrench"></i>{" "}
        {t("steam.workshop.title")}
      </h2>
      <p>{t("steam.workshop.intro")}</p>

      {state.status === "loading" && (
        <p className="steam-muted" role="status">
          {t("steam.workshop.loading")}
        </p>
      )}
      {state.status === "error" && (
        <p className="steam-muted">
          {t("steam.workshop.error")}{" "}
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            {t("steam.retry")}
          </button>
        </p>
      )}
      {state.status === "ready" && (
        <>
          <p className="steam-workshop-totals">
            <span>{count("items", state.data.totals.items)}</span>
            <span>
              <i className="fas fa-users" aria-hidden="true"></i>{" "}
              {count("subscribers", state.data.totals.subscriptions)}
            </span>
            <span>
              <i className="fas fa-star" aria-hidden="true"></i>{" "}
              {count("favorites", state.data.totals.favorites)}
            </span>
            <span>
              <i className="fas fa-eye" aria-hidden="true"></i>{" "}
              {count("views", state.data.totals.views)}
            </span>
          </p>
          <div className="steam-workshop">
            {state.data.items.map((item) => (
              <a
                key={item.id}
                className="steam-workshop-item"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.preview ? (
                  <img
                    src={item.preview}
                    alt=""
                    loading="lazy"
                    onError={(e) =>
                      (e.currentTarget.style.visibility = "hidden")
                    }
                  />
                ) : (
                  <span
                    className="steam-workshop-placeholder"
                    aria-hidden="true"
                  >
                    <i className="fas fa-puzzle-piece"></i>
                  </span>
                )}
                <span className="steam-workshop-body">
                  <span className="steam-game-name">{item.title}</span>
                  {item.game && (
                    <span className="steam-achievement-game">{item.game}</span>
                  )}
                  {item.description && (
                    <span className="steam-workshop-description steam-muted">
                      {item.description}
                    </span>
                  )}
                  <span className="steam-workshop-stats steam-muted">
                    <span>
                      <i className="fas fa-users" aria-hidden="true"></i>{" "}
                      {count("subscribers", item.subscriptions)}
                    </span>
                    <span>
                      <i className="fas fa-star" aria-hidden="true"></i>{" "}
                      {count("favorites", item.favorites)}
                    </span>
                    {item.positivePercent !== null && (
                      <span>
                        <i className="fas fa-thumbs-up" aria-hidden="true"></i>{" "}
                        {t("steam.workshop.rating", {
                          percent: t("steam.percent", {
                            value: item.positivePercent,
                          }),
                        })}
                      </span>
                    )}
                  </span>
                  {item.updated && (
                    <span className="steam-workshop-updated steam-muted">
                      {t("steam.workshop.updated", {
                        date: formatDate(item.updated, lang),
                      })}
                    </span>
                  )}
                </span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
