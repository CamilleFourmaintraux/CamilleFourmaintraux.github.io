import { useEffect, useId, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  faArrowDownWideShort,
  faArrowUpWideShort,
  faBarsProgress,
  faMagnifyingGlass,
  faRotateLeft,
  faSliders,
  faTableList,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "@/ui/Icon";
import ProjectCard from "./ProjectCard";
import type { Project, Tag } from "./types";

type Props = { projects: Project[] };

/** Searchable, filterable list of projects. */
export default function ProjectList({ projects }: Props) {
  const { t } = useTranslation();
  const { hash } = useLocation();
  const anchor = hash.slice(1);
  const advancedId = useId();

  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<Tag | "">("");
  const [newestFirst, setNewestFirst] = useState(true);
  const [onlyInProgress, setOnlyInProgress] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const tags = useMemo(
    () => Array.from(new Set(projects.flatMap((project) => project.tags))),
    [projects],
  );

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    const now = new Date();
    return projects
      .filter(
        (project) =>
          (!tag || project.tags.includes(tag)) &&
          (!search || t(project.title).toLowerCase().includes(search)) &&
          (!from || project.start >= new Date(from)) &&
          (!to || project.end <= new Date(to)) &&
          (!onlyInProgress || project.end >= now),
      )
      .sort((a, b) =>
        newestFirst
          ? b.start.getTime() - a.start.getTime()
          : a.start.getTime() - b.start.getTime(),
      );
  }, [projects, query, tag, from, to, onlyInProgress, newestFirst, t]);

  const filtered = Boolean(query || tag || from || to || onlyInProgress);
  const reset = () => {
    setQuery("");
    setTag("");
    setFrom("");
    setTo("");
    setOnlyInProgress(false);
  };

  // A link such as #/portfolio#sae401 must find its project in the list.
  useEffect(() => {
    if (anchor && projects.some((project) => project.id === anchor)) reset();
  }, [anchor, projects]);

  return (
    <>
      <form
        className="filters"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="filters-row">
          <label className="search-field">
            <span className="sr-only">
              {t("portfolio.advancedsearch.search_placeholder")}
            </span>
            <Icon icon={faMagnifyingGlass} />
            <input
              type="search"
              name="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("portfolio.advancedsearch.search_placeholder")}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="button button-small"
            aria-expanded={showAdvanced}
            aria-controls={advancedId}
            onClick={() => setShowAdvanced((value) => !value)}
          >
            <Icon icon={faSliders} />
            {showAdvanced ? t("ui.fewerFilters") : t("ui.moreFilters")}
          </button>
        </div>

        <div
          id={advancedId}
          className={
            showAdvanced ? "filters-advanced is-open" : "filters-advanced"
          }
          inert={!showAdvanced}
        >
          <div className="filters-advanced-inner">
            <div className="filters-row">
              <label className="date-field">
                <span>{t("portfolio.advancedsearch.filter_from")}</span>
                <input
                  type="date"
                  name="from"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </label>
              <label className="date-field">
                <span>{t("portfolio.advancedsearch.filter_to")}</span>
                <input
                  type="date"
                  name="to"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </label>
            </div>
            <div className="filters-row">
              <button
                type="button"
                className="button button-small"
                onClick={() => setNewestFirst((value) => !value)}
              >
                <Icon
                  icon={newestFirst ? faArrowUpWideShort : faArrowDownWideShort}
                />
                {t("portfolio.advancedsearch.sort_button")}{" "}
                {newestFirst
                  ? t("portfolio.advancedsearch.sort_asc")
                  : t("portfolio.advancedsearch.sort_desc")}
              </button>
              <button
                type="button"
                className="button button-small"
                onClick={() => setOnlyInProgress((value) => !value)}
              >
                <Icon icon={onlyInProgress ? faTableList : faBarsProgress} />
                {t("portfolio.advancedsearch.show")}{" "}
                {onlyInProgress
                  ? t("portfolio.advancedsearch.filter_all")
                  : t("portfolio.advancedsearch.filter_inprogress")}
              </button>
            </div>
          </div>
        </div>

        {tags.length > 0 && (
          <fieldset className="tag-filter">
            <legend className="sr-only">{t("ui.filterByTag")}</legend>
            <button
              type="button"
              className="chip"
              aria-pressed={tag === ""}
              onClick={() => setTag("")}
            >
              {t("portfolio.advancedsearch.tag_all")}
            </button>
            {tags.map((value) => (
              <button
                key={value}
                type="button"
                className="chip"
                aria-pressed={tag === value}
                onClick={() => setTag(tag === value ? "" : value)}
              >
                {t(`portfolio.tags.${value}`)}
              </button>
            ))}
          </fieldset>
        )}
      </form>

      <div className="results-bar">
        <p role="status">
          {t("portfolio.advancedsearch.result_count", {
            count: results.length,
            plural: results.length >= 2 ? "s" : "",
          })}
        </p>
        {filtered && (
          <button type="button" className="link-button" onClick={reset}>
            <Icon icon={faRotateLeft} /> {t("ui.resetFilters")}
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="empty">{t("portfolio.advancedsearch.no_results")}</p>
      ) : (
        <div className="project-grid">
          {results.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              activeTag={tag}
              defaultOpen={project.id === anchor}
            />
          ))}
        </div>
      )}
    </>
  );
}
