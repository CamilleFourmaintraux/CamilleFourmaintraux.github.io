import Realisations from "../Realisations";
import Data from "./Data";

export default function Passions() {
  return (
    <>
      <Realisations
        data={Data}
        pageTitle="Ma passion"
        pageSubtitle="Mes réalisations personnelles"
        pageDescription="Ma plus grande passion reste avant tout la programmation.
        Je m'amuse donc à essayer de réaliser quelques projets (souvent des
        jeux) sur mon temps libre."
      />
    </>
  );
}
