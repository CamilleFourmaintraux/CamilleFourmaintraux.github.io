import { useTranslation } from "react-i18next";

export default function Sae105() {
  const { t } = useTranslation();

  const projectsWorkPath = "portfolio.work.saes";
  const translationsPath = `${projectsWorkPath}.sae105`;
  return (
    <>
      <ul>
        <li>
          <h4>{t(`${translationsPath}.presentation`)}</h4>
        </li>
        <p>{t(`${translationsPath}.presentationDescription`)}</p>
        <img src="/img/portfolio/siteWeb.png" alt="TOTO" title="TODO" />
        <li>
          <h4>{t(`${translationsPath}.wordpress`)}</h4>
        </li>
        <p>{t(`${translationsPath}.wordpress_text`)}</p>
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
