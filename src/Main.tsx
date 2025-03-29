import { useLocation } from "react-router-dom";
import NavigationMenu, { subNavLink } from "./parts/nav/NavigationMenu";
import { useTranslation } from "react-i18next";

export default function Main() {
  const { t } = useTranslation();
  const location = useLocation();
  const subNavData: subNavLink[] = [];
  // Définition des sous-sections en fonction de la page actuelle
  if (location.pathname === "/cursus") {
    subNavData.push({ href: "formation", label: t("subnav.education") });
    subNavData.push({ href: "competences", label: t("subnav.skills") });
    subNavData.push({ href: "qualites", label: t("subnav.softskills") });
    subNavData.push({
      href: "experiences",
      label: t("subnav.experience"),
    });
  }
  return <NavigationMenu subNavLinks={subNavData} />;
}
