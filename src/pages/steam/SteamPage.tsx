import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AchievementList from "../../parts/steam/AchievementList";
import AchievementsDialog from "../../parts/steam/AchievementsDialog";
import WorkshopSection from "../../parts/steam/WorkshopSection";
import {
  fetchAchievementSummary,
  fetchOverview,
  headerImage,
  type AchievementSummary,
  type SteamGame,
  type SteamOverview,
} from "../../parts/steam/steamApi";
import {
  completion,
  formatDate,
  formatHours,
} from "../../parts/steam/steamFormat";

type SortKey = "playtime" | "recent" | "name" | "achievements";

const PAGE_SIZE = 24;

function GameImage({ game }: { game: SteamGame }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="steam-game-fallback">
        {game.icon && <img src={game.icon} alt="" width={48} height={48} />}
      </span>
    );
  }
  return (
    <img
      className="steam-game-image"
      src={headerImage(game.appid)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function SteamPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("fr") ? "fr" : "en";

  const [overview, setOverview] = useState<SteamOverview | null>(null);
  const [overviewError, setOverviewError] = useState(false);
  const [summary, setSummary] = useState<AchievementSummary | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("playtime");
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<SteamGame | null>(null);

  useEffect(() => {
    let active = true;
    setOverviewError(false);
    fetchOverview()
      .then((data) => active && setOverview(data))
      .catch(() => active && setOverviewError(true));
    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    let active = true;
    setSummaryError(false);
    fetchAchievementSummary(lang)
      .then((data) => active && setSummary(data))
      .catch(() => active && setSummaryError(true));
    return () => {
      active = false;
    };
  }, [lang, attempt]);

  const recent = useMemo(
    () =>
      (overview?.games ?? [])
        .filter((g) => g.minutes2Weeks > 0)
        .sort((a, b) => b.minutes2Weeks - a.minutes2Weeks),
    [overview],
  );

  const library = useMemo(() => {
    const query = search.trim().toLowerCase();
    const ratio = (g: SteamGame) => {
      const c = summary?.perGame[g.appid];
      return c ? c.unlocked / c.total : -1;
    };
    const sorters: Record<SortKey, (a: SteamGame, b: SteamGame) => number> = {
      playtime: (a, b) => b.minutes - a.minutes,
      recent: (a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0),
      name: (a, b) => a.name.localeCompare(b.name, lang),
      achievements: (a, b) => ratio(b) - ratio(a),
    };
    return (overview?.games ?? [])
      .filter((g) => g.name.toLowerCase().includes(query))
      .sort(sorters[sort]);
  }, [overview, summary, search, sort, lang]);

  const visibleGames =
    showAll || search ? library : library.slice(0, PAGE_SIZE);

  const statusLabel = (profile: SteamOverview["profile"]) =>
    profile.currentGame
      ? t("steam.profile.playing", { game: profile.currentGame })
      : t(`steam.profile.status.${profile.status}`, {
          defaultValue: t("steam.profile.status.0"),
        });

  const countryName = (code: string) => {
    try {
      return new Intl.DisplayNames([lang], { type: "region" }).of(code) ?? code;
    } catch {
      return code;
    }
  };

  if (overviewError) {
    return (
      <div className="container">
        <h2>
          <i className="fab fa-steam"></i> {t("steam.title")}
        </h2>
        <p>{t("steam.error")}</p>
        <button type="button" onClick={() => setAttempt((n) => n + 1)}>
          {t("steam.retry")}
        </button>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="container">
        <h2>
          <i className="fab fa-steam"></i> {t("steam.title")}
        </h2>
        <p className="steam-muted" role="status">
          {t("steam.loading")}
        </p>
      </div>
    );
  }

  const { profile, stats } = overview;
  const unavailable = summaryError || Boolean(summary?.achievementsPrivate);
  const achievementValue = (value: number | undefined) =>
    unavailable ? "–" : value === undefined ? "…" : value;
  const statusClass = profile.currentGame
    ? "in-game"
    : profile.status > 0
      ? "online"
      : "offline";

  return (
    <>
      <div className="container">
        <h2>
          <i className="fab fa-steam"></i> {t("steam.title")}
        </h2>
        <p>{t("steam.intro")}</p>

        <div className="steam-profile">
          <img
            className="steam-avatar"
            src={profile.avatar}
            alt=""
            width={96}
            height={96}
          />
          <div className="steam-profile-text">
            <div className="steam-profile-name">
              <h3>{profile.name}</h3>
              {profile.level !== null && (
                <span className="steam-level" title={t("steam.profile.level")}>
                  {t("steam.profile.level")} {profile.level}
                </span>
              )}
            </div>
            <p className={`steam-status ${statusClass}`}>
              <span className="steam-status-dot" aria-hidden="true"></span>
              {statusLabel(profile)}
            </p>
            <p className="steam-muted">
              {[
                profile.memberSince &&
                  t("steam.profile.memberSince", {
                    date: formatDate(profile.memberSince, lang),
                  }),
                profile.country && countryName(profile.country),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <a
            className="steam-profile-link"
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fab fa-steam"></i> {t("steam.profile.view")}
          </a>
        </div>

        <div className="steam-stats">
          <div className="steam-stat">
            <span className="steam-stat-value">{stats.gameCount}</span>
            <span className="steam-stat-label">{t("steam.stats.games")}</span>
          </div>
          <div className="steam-stat">
            <span className="steam-stat-value">
              {formatHours(stats.totalMinutes, lang)}
            </span>
            <span className="steam-stat-label">{t("steam.stats.hours")}</span>
          </div>
          <div className="steam-stat">
            <span className="steam-stat-value">{stats.recentCount}</span>
            <span className="steam-stat-label">{t("steam.stats.recent")}</span>
          </div>
          <div className="steam-stat">
            <span className="steam-stat-value">
              {achievementValue(summary?.totalUnlocked)}
            </span>
            <span className="steam-stat-label">
              {t("steam.stats.achievements")}
            </span>
            {summary && !unavailable && summary.totalAvailable > 0 && (
              <>
                <div className="steam-meter" aria-hidden="true">
                  <div
                    style={{
                      width: `${completion(summary.totalUnlocked, summary.totalAvailable)}%`,
                    }}
                  />
                </div>
                <span className="steam-stat-label">
                  {t("steam.stats.ofTotal", {
                    total: summary.totalAvailable,
                    percent: t("steam.percent", {
                      value: completion(
                        summary.totalUnlocked,
                        summary.totalAvailable,
                      ),
                    }),
                  })}
                </span>
              </>
            )}
          </div>
          <div className="steam-stat">
            <span className="steam-stat-value">
              {achievementValue(summary?.perfectGames)}
            </span>
            <span className="steam-stat-label">{t("steam.stats.perfect")}</span>
          </div>
        </div>
      </div>

      <div className="container">
        <h2>
          <i className="fas fa-clock-rotate-left"></i> {t("steam.recent.title")}
        </h2>
        {recent.length === 0 ? (
          <p className="steam-muted">{t("steam.recent.none")}</p>
        ) : (
          <div className="steam-games steam-games-recent">
            {recent.map((game) => (
              <button
                type="button"
                key={game.appid}
                className="steam-game"
                onClick={() => setSelected(game)}
              >
                <GameImage game={game} />
                <span className="steam-game-name">{game.name}</span>
                <span className="steam-muted">
                  {t("steam.recent.twoWeeks", {
                    hours: formatHours(game.minutes2Weeks, lang),
                  })}
                </span>
                <span className="steam-muted">
                  {t("steam.recent.total", {
                    hours: formatHours(game.minutes, lang),
                  })}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="container">
        <h2>
          <i className="fas fa-trophy"></i> {t("steam.latest.title")}
        </h2>
        {unavailable ? (
          <p className="steam-muted">{t("steam.latest.unavailable")}</p>
        ) : !summary ? (
          <p className="steam-muted" role="status">
            {t("steam.latest.loading")}
          </p>
        ) : summary.latestUnlocks.length === 0 ? (
          <p className="steam-muted">{t("steam.latest.none")}</p>
        ) : (
          <AchievementList achievements={summary.latestUnlocks} lang={lang} />
        )}
      </div>

      <WorkshopSection lang={lang} />

      <div className="container">
        <h2>
          <i className="fas fa-gamepad"></i> {t("steam.library.title")}
        </h2>
        <div className="steam-controls">
          <input
            id="steam-search"
            name="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("steam.library.search")}
            aria-label={t("steam.library.search")}
          />
          <label className="steam-sort">
            <span>{t("steam.library.sort")}</span>
            <select
              id="steam-sort"
              name="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="playtime">
                {t("steam.library.sortPlaytime")}
              </option>
              <option value="recent">{t("steam.library.sortRecent")}</option>
              <option value="name">{t("steam.library.sortName")}</option>
              <option value="achievements">
                {t("steam.library.sortAchievements")}
              </option>
            </select>
          </label>
        </div>

        {library.length === 0 ? (
          <p className="steam-muted">{t("steam.library.empty")}</p>
        ) : (
          <div className="steam-games">
            {visibleGames.map((game) => {
              const counts = summary?.perGame[game.appid];
              return (
                <button
                  type="button"
                  key={game.appid}
                  className="steam-game"
                  onClick={() => setSelected(game)}
                >
                  <GameImage game={game} />
                  <span className="steam-game-name">{game.name}</span>
                  <span className="steam-muted">
                    {game.minutes > 0
                      ? t("steam.library.hours", {
                          hours: formatHours(game.minutes, lang),
                        })
                      : t("steam.library.neverPlayed")}
                    {game.lastPlayed
                      ? ` · ${t("steam.library.lastPlayed", {
                          date: formatDate(game.lastPlayed, lang),
                        })}`
                      : ""}
                  </span>
                  {counts && (
                    <span className="steam-game-achievements">
                      <span className="steam-meter" aria-hidden="true">
                        <span
                          style={{
                            width: `${completion(counts.unlocked, counts.total)}%`,
                          }}
                        />
                      </span>
                      <span className="steam-muted">
                        <i className="fas fa-trophy"></i> {counts.unlocked} /{" "}
                        {counts.total}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!search && library.length > PAGE_SIZE && (
          <button
            type="button"
            className="steam-show-all"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll
              ? t("steam.library.showLess")
              : t("steam.library.showAll", { count: library.length })}
          </button>
        )}

        <NavLink to="/passions" className="steam-back-link">
          <i className="fas fa-arrow-left"></i> {t("steam.back")}
        </NavLink>
      </div>

      <AchievementsDialog
        game={selected}
        lang={lang}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
