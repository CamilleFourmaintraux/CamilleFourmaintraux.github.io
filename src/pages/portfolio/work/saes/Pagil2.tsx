import { useTranslation } from "react-i18next";

export default function Pagil2() {
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
        <img src="/img/portfolio/codeSwipe.gif" alt="TOTO" title="TODO" />
        <li>
          <h4>{t(`${translationsPath}.role`)}</h4>
        </li>
        <p>{t(`${translationsPath}.roleDescription`)}</p>
        <img src="/img/portfolio/tabScrum2.jpg" alt="TOTO" title="TODO" />
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
