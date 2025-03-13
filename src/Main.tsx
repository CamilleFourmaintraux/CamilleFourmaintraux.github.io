import { useLocation } from "react-router-dom";
import NavigationMenu from "./parts/nav/NavigationMenu";

export default function Main() {
  const location = useLocation();
  const subNavData = [];
  // Définition des sous-sections en fonction de la page actuelle
  if (location.pathname === "/cursus") {
    subNavData.push({ href: "#formation", label: "Formation" });
    subNavData.push({ href: "#competences", label: "Compétences" });
    subNavData.push({ href: "#qualites", label: "Qualités" });
    subNavData.push({
      href: "#experiences",
      label: "Expériences professionnelles",
    });
  }
  return <NavigationMenu subNavLinks={subNavData} />;
}
