import EMothep from "../parts/E-Mothep";

export default function IntroductionPage() {
  return (
    <>
      <div className="container">
        <h2>
          <i className="fas fa-user"></i> Présentation
        </h2>
        <p>
          Bonjour/Bonsoir !<br />
          Je suis étudiant en troisième année de BUT Informatique à l'IUT de
          Lille.
          <br />
          <br />
          J'ai récemment obtenu un stage de 16 semaines au sein d'une équipe de
          développement chez <EMothep /> du 10 mars jusqu'au 27 juin 2025.
          <br />
          J'avais déjà réalisé mon précédent stage dans cette entreprise, qui
          avait été très satisfait de mon travail et a donc décidé de me
          reprendre.
          <br />
          <EMothep /> est une société de conseil et d'intégration de solutions
          avec plus de 20 ans d'expériences. L'entreprise accompagne ses clients
          dans leurs démarches d'urbanisation de leurs systèmes d'informations,
          afin de les rendre plus efficace et évolutif.
          <br />
          <br />
          Mon parcours académique et ma passion pour l'informatique me motivent
          à m'engager pleinement dans ce domaine en constante évolution. Je suis
          déterminé à contribuer de manière significative et à apporter une
          valeur ajoutée à l'entreprise qui me fera confiance.
          <br />
        </p>
      </div>
      <div className="container">
        <h2>
          <i className="fas fa-bullseye"></i> Mes objectifs{" "}
        </h2>
        <p>
          Une fois mon BUT obtenu, je souhaite poursuivre mes études en école
          d'ingénieur ou en Master, et suivre une formation spécialisée dans le
          développement logiciel et back-end.
          <br />
          Poursuivre un niveau d'étude Bac+5 me permettra d'approfondir mes
          compétences et mes connaisances et de me spécialiser dans ces
          domaines, ce qui me permettra de m'intégrer pleinement dans une équipe
          de développement logiciel
        </p>
      </div>
      <div className="container">
        <h2>
          <i className="fas fa-download"></i> Mon CV{" "}
        </h2>
        <p>
          Vous pouvez télécharger mon CV en pdf en cliquant{" "}
          <a href="/files/resume.pdf" target="_blank" download>
            {" "}
            ici
          </a>
          .<br />
        </p>
      </div>
      <div className="container">
        <h2>
          <i className="fas fa-circle-exclamation"></i> En développement
        </h2>
        <p>
          Mon site est encore en développement, il pourrait encore y avoir de
          nouveaux ajouts, des modifications (et des bugs).{" "}
          <i className="fas fa-bug"></i>
        </p>
      </div>
    </>
  );
}
