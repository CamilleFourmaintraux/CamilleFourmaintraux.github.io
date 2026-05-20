import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Internship() {
  const { t } = useTranslation();
  const projectsWorkPath = "portfolio.work.saes";
  const translationsPath = `${projectsWorkPath}.internship1`;
  return (
    <p>
      <Link to="/cursus#experiences">{t(`${translationsPath}.text`)}</Link>
    </p>
  );
}
