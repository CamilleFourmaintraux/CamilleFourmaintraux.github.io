import Realisations from "../Realisations";
import Data from "./Data";

export default function Work() {
  return (
    <Realisations
      data={Data}
      pageTitle="Mes travaux"
      pageSubtitle="Mes réalisations professionnelles"
      pageDescription="Cette page regroupe tous les projets auxquels j'ai participé dans un cadre professionnel."
    />
  );
}
