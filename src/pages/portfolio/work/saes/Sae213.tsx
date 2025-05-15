import { useTranslation } from "react-i18next";

export default function Sae213() {
  const { t } = useTranslation();

  const projectsWorkPath = "portfolio.work.saes";
  const translationsPath = `${projectsWorkPath}.sae213`;
  return (
    <>
      <ul>
        <li>
          <h4>{t(`${translationsPath}.presentation`)}</h4>
        </li>
        <p>{t(`${translationsPath}.presentationDescription`)}</p>
        <img src="/img/portfolio/trello.png" alt="TOTO" title="TODO" />
        <p>{t(`${translationsPath}.text1`)}</p>
        <img src="/img/portfolio/escapeGame.png" alt="TOTO" title="TODO" />
        <p>{t(`${translationsPath}.text2`)}</p>
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
