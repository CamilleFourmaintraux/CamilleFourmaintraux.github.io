import { useTranslation } from "react-i18next";

export default function Sae105() {
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
        <img src="/img/portfolio/siteWeb.png" alt="photo site web" />
        <li>
          <h4>
            Utilisation de HTML et de CSS pour la création de la structure et du
            design
          </h4>
        </li>
        <p>
          Nous avions commencé par faire une maquette WordPress pour proposer un
          début de design et de solutions aux besoins, et une fois celle-ci
          validée, nous sommes passés à la conception directement en HTML et en
          CSS. L’objectif principal était de nous apprendre à coder avec ces
          langages dans des conditions semblables à un réel projet ainsi qu’à
          nous faire respecter une charte graphique particulière, le tout se
          devait d’être cohérent et appréciable à regarder.
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
          {t(`${projectsWorkPath}.linkText`)}{" "}
          <a href="https://github.com/CamilleFourmaintraux/plateforme_covoiturage">
            {t(`${projectsWorkPath}.link`)}
          </a>
        </p>
      </ul>
    </>
  );
}
