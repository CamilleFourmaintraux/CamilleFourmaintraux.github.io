import { useTranslation } from "react-i18next";

export default function Sae207() {
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
        <img src="/img/portfolio/donnes.png" alt="photo fichier de donnees" />
        <li>
          <h4>
            Utilisation de PostgreSQL et Access pour stocker et interroger les
            données
          </h4>
        </li>
        <p>
          Nous avons utilisé Postgresql et Access pour créer les tables et
          formuler les requêtes afin de pouvoir répondre aux interrogations du
          "client" sur les données.
        </p>
        <img
          src="/img/portfolio/scriptSQL.png"
          alt="photo fichier de script SQL"
        />
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
