export default function Sae401() {
  return (
    <>
      <ul>
        <li>
          <h4>Structuration</h4>
        </li>
        <div>
          Cette saé portait sur réaliser un site web d'une pizzeria{" "}
          <em>'Pizzeria Mazzorello'</em> respectant l'architecture REST. Il
          devait donc y'avoir plusieurs end-points afin de permettre à des
          utilisateurs externes de récupérer les données et de les modifier dans
          la base de données. Les end-points étaient les suivants :
          <ul>
            <li>
              <b>Ingrédients</b> : id, nom, prix
            </li>
            <li>
              <b>Pizzas</b> : id, nom, type de pâte, ingrédient, prix de
              base{" "}
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

        <h4>Compétences et savoir-faire acquis</h4>
        <ul>
          <li>
            <b>Architecture REST</b> : Nous ne connaisions pas les architectures
            REST, ce projet nous à permis de les comprendre et d'apprendre à
            créer des site la respectant.
          </li>
          <li>
            <b> Postgresql </b> : Pour ce projet, l'utilisation d'une base de
            données était nécessaire.{" "}
          </li>
        </ul>
        <h4>Savoir-êtres acquis</h4>
        <ul>
          <li>
            <b> Autonomie </b> : Ce projet est le seul que nous avons eu à
            réaliser entièrement seul mais étant très autonome, cela ne m'a pas
            posé de problèmes.
          </li>
          <li>
            <b> Respect des délais </b> : Les délais pour ce projet étaient
            assez court, ce fut un bon exercice pour bien faire attention à
            rendre dans les temps tout en respectant le cachier des charges
          </li>
        </ul>
      </ul>
    </>
  );
}
