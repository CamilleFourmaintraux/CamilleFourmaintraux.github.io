import { useState } from "react";
import { Realisation, RealisationProps } from "./Realisation";
import { motion, AnimatePresence } from "framer-motion";

import { transformSaeID } from "../../Utils";

interface RealisationsProps {
  data: RealisationProps[]; // Corrigé ici
  pageTitle: string;
  pageSubtitle: string;
  pageDescription: string;
}

const Realisations: React.FC<RealisationsProps> = ({
  data,
  pageTitle,
  pageSubtitle,
  pageDescription,
}) => {
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
      {/* Bouton Toggle */}
      <div id="portfolioContainer">
        <div className="container">
          <h2> {pageTitle} </h2>
          <p>{pageDescription}</p>
          <div id="advancedSearchButtonContainer">
            <button
              id="advancedSearchButton"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            >
              {showAdvancedSearch
                ? "Masquer la recherche 🔼"
                : "Afficher la recherche 🔽"}
            </button>
          </div>
          {/* Menu de recherche avec animation */}
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
                    placeholder="Rechercher une réalisation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filtres par date */}
                <div className="date-filters next-to-each-other">
                  <label className="protected">Du :</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <label className="protected">Au :</label>
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
                    Trier{" "}
                    {orderAsc
                      ? "du plus ancien au plus récent"
                      : "du plus récent au plus ancien"}
                  </button>
                  {/* Boutons de tri */}
                  <button onClick={() => setOnlyInProgress(!onlyInProgress)}>
                    {onlyInProgress ? (
                      <i className="fa-solid fa-table-list">
                        {"‎ ‎ ‎ ‎ ‎ ‎ ‎  ‎ ‎ "}
                      </i>
                    ) : (
                      <i className="fa-solid fa-bars-progress" />
                    )}{" "}
                    Afficher{" "}
                    {onlyInProgress
                      ? "tous les projets"
                      : "les projets en cours"}
                  </button>
                </div>

                {/* Filtres par tags */}
                <div className="tags-container">
                  <button
                    onClick={() => setSelectedTag("")}
                    className={selectedTag === "" ? "active" : ""}
                  >
                    Tous
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
          <p>{filteredRealisations.length} résultat(s) trouvé(s)</p>

          {/* Affichage des réalisations filtrées avec animation */}
          <AnimatePresence>
            {filteredRealisations.map(
              (
                { idRealisation, title, date, dateEnd, tags, children },
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
                    title={`${index + 1}. ${transformSaeID(
                      idRealisation
                    )} ${title}`}
                    tags={tags}
                    date={date}
                    dateEnd={dateEnd}
                    current={selectedTag}
                    isInPeriod={startDate != "" && endDate != ""}
                    isInProgress={onlyInProgress}
                  >
                    {children}
                  </Realisation>
                </motion.div>
              )
            )}
          </AnimatePresence>

          {filteredRealisations.length === 0 && (
            <p>Aucune réalisation ne correspond aux critères.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Realisations;
