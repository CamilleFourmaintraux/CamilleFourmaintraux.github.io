import { useTranslation } from "react-i18next";

export default function Pagil1() {
  const { t } = useTranslation();

  const projectsWorkPath = "portfolio.work.saes";
  const translationsPath = `${projectsWorkPath}.pagil1`;

  return (
    <>
      <ul>
        <li>
          <h4>{t(`${translationsPath}.title1`)}</h4>
        </li>
        <p>{t(`${translationsPath}.text1`)}</p>
        <img
          src="/img/portfolio/dino.png"
          alt={t(`${translationsPath}.alt1`)}
          title={t(`${translationsPath}.alt1`)}
        />
        <li>
          <h4>{t(`${translationsPath}.title2`)}</h4>
        </li>
        <p>{t(`${translationsPath}.text2`)}</p>
        <img
          src="/img/portfolio/tabScrum.jpg"
          alt={t(`${translationsPath}.alt2`)}
          title={t(`${translationsPath}.alt2`)}
        />
        <li>
          <h4>{t(`${projectsWorkPath}.know_how`)}</h4>
        </li>
        <ul>
          <li>{t(`${translationsPath}.know_how1`)}</li>
          <li>{t(`${translationsPath}.know_how2`)}</li>
          <li>{t(`${translationsPath}.know_how3`)}</li>
        </ul>
        <p>
          {t(`${projectsWorkPath}.linkText`)}{" "}
          <a href="https://github.com/CamilleFourmaintraux/projet-agile">
            {t(`${projectsWorkPath}.link`)}
          </a>
        </p>
      </ul>
    </>
  );
}
