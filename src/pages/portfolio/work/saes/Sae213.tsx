import { useTranslation } from "react-i18next";

export default function Sae213() {
  const { t } = useTranslation();

  const projectsWorkPath = "portfolio.work.saes";
  const translationsPath = `${projectsWorkPath}.pagil2`;
  return (
    <>
      <ul>
        <li>
          <h4>{t(`${translationsPath}.presentation`)}</h4>
        </li>
        <p>{t(`${translationsPath}.presentationDescription`)}</p>
        <img src="/img/portfolio/trello.png" alt="photo trello" />
        <p>
          Nous devions régulièrement organiser des réunions entre tous les
          membres de l’équipe, ces réunions permettaient de faire le point sur
          l’avancement du projet, sur les difficultés qu’un membre pouvait
          rencontrer, d’apporter de l’aide à ceux qui en aurait besoin et de
          permettre l’apparition de nouvelles idées à travers les échanges. Nous
          devions aussi documenter tous les progrès du projet et rédiger les
          comptes-rendus des réunions.
        </p>
        <img src="/img/portfolio/escapeGame.png" alt="photo escapeGame" />
        <p>
          On nous a fait installer et configurer Gitea pour nous faire
          configurer un réseau collaboratif et nous apprendre à l’utiliser.
          Enfin, il fallait rédiger un rapport pour garder trace et expliquer
          tout ce qu’on a fait. Ces rapports devaient être rédigés en balisage
          léger comme Markdom ou Ascii Doctor ce qui nous a permis d’obtenir les
          compétences nécessaires pour utiliser des langages de Balisages léger.
        </p>
        <li>
          <h4>{t(`${projectsWorkPath}.skills`)}</h4>
        </li>
        <ul>
          <li>{t(`${translationsPath}.skill1`)}</li>
          <li>{t(`${translationsPath}.skill2`)}</li>
          <li>{t(`${translationsPath}.skill3`)}</li>
        </ul>
        <p>
          <a href="https://view.genial.ly/63fcd8e96301550018245567/interactive-content-mysteres-et-disparitions-a-la-rentree-de-liut-avec-meilleur-timer">
            {t(`${translationsPath}.escapeGameLink`)}
          </a>
        </p>
      </ul>
    </>
  );
}
