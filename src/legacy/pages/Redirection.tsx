import { legacyPath } from "@/lib/paths";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";

export default function RedirectionPage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="container">
        <h2>
          <i className="fas fa-triangle-exclamation"></i>{" "}
          {t("redirection.title")}{" "}
        </h2>
        <p>{t("redirection.sorry")}</p>
        <NavLink to={legacyPath("/")}> {t("redirection.back")}</NavLink>
      </div>
    </>
  );
}
