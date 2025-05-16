import { useTranslation } from "react-i18next";

export default function MazeGenerator() {
  const { t } = useTranslation();
  const projectsPassionPath = `portfolio.passion.projects`;
  const translationsPath = `${projectsPassionPath}.mazegenerator`;
  return (
    <ul>
      <li>
        <h4>{t(`${translationsPath}.title1`)}</h4>
      </li>
      <p>{t(`${translationsPath}.text1`)}</p>
      <img src="/img/passions/laby.png" alt={t(`${translationsPath}.alt1`)} title={t(`${translationsPath}.alt1`)} />
      <li>
        <h4>{t(`${translationsPath}.title2`)}</h4>
      </li>
      <p>{t(`${translationsPath}.text2`)}</p>
      <li>
        <h4>{t(`${translationsPath}.skills_title`)}</h4>
      </li>
      <ul>
        <li>{t(`${translationsPath}.skills_list.algo`)}</li>
        <li>{t(`${translationsPath}.skills_list.javafx`)}</li>
      </ul>
    </ul>
  );
}
