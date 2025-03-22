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
        <img src="/img/portfolio/codeSwipe.gif" alt="codeSwipe" />
        <li>
          <h4>{t(`${translationsPath}.role`)}</h4>
        </li>
        <p>{t(`${translationsPath}.roleDescription`)}</p>
        <img src="/img/portfolio/tabScrum2.jpg" alt="photo Scrum" />
        <li>
          <h4>{t(`${projectsWorkPath}.knowHow`)}</h4>
        </li>
        <ul>
          <li>{t(`${translationsPath}.knowHow1`)}</li>
          <li>{t(`${translationsPath}.knowHow2`)}</li>
          <li>{t(`${translationsPath}.knowHow3`)}</li>
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
