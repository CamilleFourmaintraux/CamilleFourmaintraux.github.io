import { useTranslation } from "react-i18next";

export default function Sae207() {
  const { t } = useTranslation();

  const projectsWorkPath = "portfolio.work.saes";
  const translationsPath = `${projectsWorkPath}.sae207`;
  return (
    <>
      <ul>
        <li>
          <h4>{t(`${translationsPath}.presentation`)}</h4>
        </li>
        <p>{t(`${translationsPath}.presentationDescription`)}</p>
        <img src="/img/portfolio/donnes.png" alt="TOTO" title="TODO"/>
        <li>
          <h4>{t(`${translationsPath}.postgresql`)}</h4>
        </li>
        <p>{t(`${translationsPath}.postgresql_text`)}</p>
        <img
          src="/img/portfolio/scriptSQL.png"
          alt="TODO"
          title="TODO"
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
