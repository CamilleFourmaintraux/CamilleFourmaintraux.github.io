import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  faEye,
  faPuzzlePiece,
  faScrewdriverWrench,
  faStar,
  faThumbsUp,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "@/ui/Icon";
import ExternalLink from "@/ui/ExternalLink";
import { Section } from "@/ui/Page";
import { fetchWorkshop, type Workshop } from "@/lib/steam/steamApi";
import { formatDate } from "@/lib/steam/steamFormat";

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
    <Section
      stacked
      title={t("steam.workshop.title")}
      icon={faScrewdriverWrench}
    >
      <p>{t("steam.workshop.intro")}</p>

      {state.status === "loading" && (
        <p className="steam-muted" role="status">
          {t("steam.workshop.loading")}
        </p>
      )}
      {state.status === "error" && (
        <p className="steam-muted">
          {t("steam.workshop.error")}{" "}
          <button
            type="button"
            className="button button-small"
            onClick={() => setAttempt((n) => n + 1)}
          >
            {t("steam.retry")}
          </button>
        </p>
      )}
      {state.status === "ready" && (
        <>
          <p className="steam-workshop-totals">
            <span>{count("items", state.data.totals.items)}</span>
            <span>
              <Icon icon={faUsers} />{" "}
              {count("subscribers", state.data.totals.subscriptions)}
            </span>
            <span>
              <Icon icon={faStar} />{" "}
              {count("favorites", state.data.totals.favorites)}
            </span>
            <span>
              <Icon icon={faEye} /> {count("views", state.data.totals.views)}
            </span>
          </p>
          <div className="steam-workshop">
            {state.data.items.map((item) => (
              <ExternalLink
                key={item.id}
                className="steam-workshop-item"
                href={item.url}
                plain
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
                    <Icon icon={faPuzzlePiece} />
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
                      <Icon icon={faUsers} />{" "}
                      {count("subscribers", item.subscriptions)}
                    </span>
                    <span>
                      <Icon icon={faStar} />{" "}
                      {count("favorites", item.favorites)}
                    </span>
                    {item.positivePercent !== null && (
                      <span>
                        <Icon icon={faThumbsUp} />{" "}
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
              </ExternalLink>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}
