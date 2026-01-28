import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

export default function Matrices() {
  const { t } = useTranslation();
  const projectsPassionPath = `portfolio.passion.projects`;
  const translationsPath = `${projectsPassionPath}.matrices`;
  return (
    <>
      <p>{t(`${translationsPath}.text`)}</p>
      <NavLink to="/matrix">{t(`${translationsPath}.link`)}</NavLink>
    </>
  );
}
