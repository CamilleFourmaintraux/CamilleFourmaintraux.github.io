import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  faHouse,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "@/ui/Icon";
import Page from "@/ui/Page";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <Page
      title={t("redirection.title")}
      icon={faTriangleExclamation}
      lead={<p>{t("redirection.sorry")}</p>}
    >
      <p className="page-actions">
        <Link to="/" className="button button-primary">
          <Icon icon={faHouse} />
          {t("redirection.back")}
        </Link>
      </p>
    </Page>
  );
}
