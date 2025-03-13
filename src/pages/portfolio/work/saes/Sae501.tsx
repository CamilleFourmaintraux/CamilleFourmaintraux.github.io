export default function Sae501() {
  return (
    <>
      <ul>
        <li>
          <h4>Langages de bas-niveaux</h4>
        </li>
        <p>
          Dans le cadre de cette SAÉ, nous avons été confrontés au développement
          d’un logiciel qui sort du périmètre dans lequel nous avions l’habitude
          d’évoluer. Nous avons développer un logiciel permettant d’émuler un
          ordinateur basé sur un processeur RISC-V, en utilisant le langage de
          programmation de notre choix. En raison des contraintes de performance
          liée au développement d’un émulateur, il était préférable de choisir
          un langage qui se compile vers du code natif, par exemple C, C++, Rust
          ou encore Go. Après avoir examiné ces différents lanaguages,
          particulièrement le RUST, nous avons décidé de coder l'émulateur en C.
        </p>
        <img src="/img/portfolio/riscV_encodage.png" alt="riscV_encodage" />
        <li>
          <h4>Programmation en C</h4>
        </li>
        <p>
          L’émulation est le fait de simuler le fonctionnement d’une
          architecture matérielle à l’aide d’un programme informatique. Le
          programme est en charge de modéliser et de faire évoluer l’état «
          virtuel » de l’architecture matérielle. Le logiciel d’émulation doit
          donc proposer une structure de données qui représente le matériel que
          l’on cherche à simuler et faire évoluer ces données au fur-et-à-mesure
          de l’avancée de la simulation. Les registres sont les plus petites
          unités de stockage du processeur. Ils sont intégrés à celui-ci et
          n’ont pas d’adresse car il ne sont pas en mémoire. Il sont directement
          utilisables dans les instructions machine et servent de stockage de
          traitement. L’unité arithmétique et logique travaille exclusivement
          avec eux sur la plupart des architectures.
        </p>
        <img
          src="/img/portfolio/riscV_codeExample.png"
          alt="riscV_codeExample"
        />
        <h4>Compétences et savoir-faire acquis</h4>
        <ul>
          <li>Programmation en C</li>
          <li>Apprendre un nouveau language</li>
          <li>Découvrir le fonctionnement d'un processeur</li>
          <li>Écrire un programme respectant une spécification stricte</li>
        </ul>
      </ul>
    </>
  );
}
