import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

export default function BackHome() {
  const { t } = useTranslation();
  return (
    <p className="page-actions">
      <Link to="/" className="button">
        <Icon icon={faArrowLeft} />
        {t("test.back")}
      </Link>
    </p>
  );
}
