import { useTranslation } from "react-i18next";

export default function MniaEnv() {
  const { t } = useTranslation();

  const projectsWorkPath = "portfolio.work.saes";
  const translationsPath = `${projectsWorkPath}.mnia-env`;
  return (
    <>
      <ul>
        <li>
          <h4>{t(`${translationsPath}.presentation`)}</h4>
        </li>
        <p>{t(`${translationsPath}.presentationDescription`)}</p>
        <img src="/img/portfolio/reseau.png" alt="TOTO" title="TODO" />

        <li>
          <h4>{t(`${translationsPath}.section`)}</h4>
        </li>
        <p>{t(`${translationsPath}.section_text`)}</p>
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
          <a href="https://github.com/CamilleFourmaintraux">
            {t(`${projectsWorkPath}.link`)}
          </a>
        </p>
      </ul>
    </>
  );
}
