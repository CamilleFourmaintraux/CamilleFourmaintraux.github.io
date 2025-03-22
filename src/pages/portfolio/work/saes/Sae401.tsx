import { useTranslation } from "react-i18next";

export default function Sae401() {
  const { t } = useTranslation();

  const projectsWorkPath = "portfolio.work.saes";
  const translationsPath = `${projectsWorkPath}.pagil2`;
  return (
    <>
      <ul>
        <li>
          <h4>{t(`${translationsPath}.presentation`)}</h4>
        </li>
        <div>
          <p>{t(`${translationsPath}.presentationDescription`)}</p>
          <ul>
            <li>
              <b>Ingrédients</b> : id, nom, prix
            </li>
            <li>
              <b>Pizzas</b> : id, nom, type de pâte, ingrédient, prix de base{" "}
            </li>
            <li>
              <b>Commandes</b> : id, client, date,{" "}
            </li>
          </ul>
        </div>
        <img src="/img/portfolio/siteWebRestRequests.png" alt="requetesRest" />

        <li>
          <h4>Sécurité</h4>
        </li>
        <p>
          {" "}
          Mise en place de différents système d'authentification notamment API
          Token et JWT token.
        </p>
        <img
          src="/img/portfolio/jwt-primer-token.png"
          alt="authentificationRest"
        />

        <h4>{t(`${projectsWorkPath}.skills`)}</h4>
        <ul>
          <li>
            <b> {t(`${translationsPath}.skill1`)} </b> : Nous ne connaisions pas
            les architectures REST, ce projet nous à permis de les comprendre et
            d'apprendre à créer des site la respectant.
          </li>
          <li>
            <b> {t(`${translationsPath}.skill2`)} </b> : Pour ce projet,
            l'utilisation d'une base de données était nécessaire.{" "}
          </li>
        </ul>
        <h4>{t(`${translationsPath}.knowHow`)}</h4>
        <ul>
          <li>
            <b> {t(`${translationsPath}.knowHow1`)} </b> : Ce projet est le seul
            que nous avons eu à réaliser entièrement seul mais étant très
            autonome, cela ne m'a pas posé de problèmes.
          </li>
          <li>
            <b> {t(`${translationsPath}.knowHow2`)} </b> : Les délais pour ce
            projet étaient assez court, ce fut un bon exercice pour bien faire
            attention à rendre dans les temps tout en respectant le cachier des
            charges
          </li>
        </ul>
      </ul>
    </>
  );
}
