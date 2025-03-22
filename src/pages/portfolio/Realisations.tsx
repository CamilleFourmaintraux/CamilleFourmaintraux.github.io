import { useState } from "react";
import { Realisation, RealisationProps } from "./Realisation";
import { motion, AnimatePresence } from "framer-motion";

import { transformSaeID } from "../../Utils";
import { useTranslation } from "react-i18next";

interface RealisationsProps {
  data: RealisationProps[];
  pageTitle: string;
  pageSubtitle: string;
  pageDescription: string;
  children: React.ReactNode;
}

const Realisations: React.FC<RealisationsProps> = ({
  data,
  pageTitle,
  pageSubtitle,
  pageDescription,
  children,
}) => {
  const { t } = useTranslation();
  // Extraire tous les tags uniques
  const allTags: string[] = Array.from(new Set(data.flatMap((r) => r.tags)));

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [orderAsc, setOrderAsc] = useState(true);
  const [onlyInProgress, setOnlyInProgress] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fonction de tri
  const sortedRealisations = [...data].sort((a, b) =>
    orderAsc
      ? b.date.getTime() - a.date.getTime()
      : a.date.getTime() - b.date.getTime()
  );

  // Fonction de filtrage
  const filteredRealisations = sortedRealisations.filter((r) => {
    const matchesTag = selectedTag ? r.tags.includes(selectedTag) : true;
    const matchesSearch = searchQuery
      ? r.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesDate =
      (!startDate || r.date >= new Date(startDate)) &&
      (!endDate || r.dateEnd <= new Date(endDate)) &&
      (!onlyInProgress || r.dateEnd >= new Date());

    return matchesTag && matchesSearch && matchesDate;
  });

  return (
    <>
      <div id="portfolioContainer">
        <div className="container">
          <h2>{pageTitle}</h2>
          <p>{pageDescription}</p>
          <div className="title-content">{children}</div>
          <div id="advancedSearchButtonContainer">
            <button
              id="advancedSearchButton"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            >
              {showAdvancedSearch
                ? t("portfolio.advancedsearch.toggle_hide")
                : t("portfolio.advancedsearch.toggle_show")}
            </button>
          </div>

          <AnimatePresence>
            {showAdvancedSearch && (
              <motion.div
                className="advancedSearch"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Barre de recherche */}
                <div className="searchbar">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input
                    type="text"
                    className="searchInput"
                    placeholder={t(
                      "portfolio.advancedsearch.search_placeholder"
                    )}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filtres par date */}
                <div className="date-filters next-to-each-other">
                  <label className="protected">
                    {t("portfolio.advancedsearch.filter_from")}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <label className="protected">
                    {t("portfolio.advancedsearch.filter_to")}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="next-to-each-other">
                  {/* Boutons de tri */}
                  <button onClick={() => setOrderAsc(!orderAsc)}>
                    {orderAsc ? (
                      <i className="fa-solid fa-arrow-down" />
                    ) : (
                      <i className="fa-solid fa-arrow-up" />
                    )}{" "}
                    {t("portfolio.advancedsearch.sort_button")}{" "}
                    {orderAsc
                      ? t("portfolio.advancedsearch.sort_asc")
                      : t("portfolio.advancedsearch.sort_desc")}
                  </button>

                  {/* Bouton projets en cours */}
                  <button onClick={() => setOnlyInProgress(!onlyInProgress)}>
                    {onlyInProgress ? (
                      <i className="fa-solid fa-table-list">
                        {"‎ ‎ ‎ ‎ ‎ ‎ ‎  ‎ ‎ "}
                      </i>
                    ) : (
                      <i className="fa-solid fa-bars-progress" />
                    )}{" "}
                    {t("portfolio.advancedsearch.filter_all")}{" "}
                    {onlyInProgress
                      ? t("portfolio.advancedsearch.filter_all")
                      : t("portfolio.advancedsearch.filter_inprogress")}
                  </button>
                </div>

                {/* Filtres par tags */}
                <div className="tags-container">
                  <button
                    onClick={() => setSelectedTag("")}
                    className={selectedTag === "" ? "active" : ""}
                  >
                    {t("portfolio.advancedsearch.tag_all")}
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={selectedTag === tag ? "active" : ""}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="container">
          <h2>{pageSubtitle}</h2>
          <p>
            {t("portfolio.advancedsearch.result_count", {
              count: filteredRealisations.length,
            })}
          </p>

          <AnimatePresence>
            {filteredRealisations.map(
              (
                {
                  idRealisation,
                  title,
                  date,
                  dateEnd,
                  tags,
                  tagsPath,
                  children,
                },
                index
              ) => (
                <motion.div
                  key={idRealisation}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Realisation
                    idRealisation={idRealisation}
                    title={`${index + 1}. ${transformSaeID(idRealisation)} ${t(
                      title
                    )}`}
                    tags={tags}
                    date={date}
                    dateEnd={dateEnd}
                    tagsPath={tagsPath}
                    current={selectedTag}
                    isInPeriod={startDate !== "" && endDate !== ""}
                    isInProgress={onlyInProgress}
                  >
                    {children}
                  </Realisation>
                </motion.div>
              )
            )}
          </AnimatePresence>

          {filteredRealisations.length === 0 && (
            <p>{t("portfolio.advancedsearch.no_results")}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Realisations;
