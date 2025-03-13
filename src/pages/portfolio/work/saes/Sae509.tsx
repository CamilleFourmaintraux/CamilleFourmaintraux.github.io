export default function Sae509() {
    return (
      <>
        <ul>
            <li><h4>Le projet</h4></li>
            <p>
                A la manière de prendreunrendezvous, de Doctolib ou de nombreux sites de prise de rendez-vous mis
                en place durant la crise COVID-19, l’objectif de ce projet consiste à réaliser un site internet de gestion de
                rendez-vous multi-utilisateurs. Le site permet d’une part de montrer aux utilisateurs les créneaux libres,
                d’autre part de permettre aux utilisateurs de saisir et gérer leurs rendez-vous, et évidemment de n’autoriser
                des rendez-vous que s’ils respectent les contraintes souhaitées.
                Le site s'appuie donc sur de nombreux paramètres permettant l’expression de
                contraintes afin de pouvoir être adapté à toutes les situations. Par exemple le planning de réservation des
                créneaux de piscine (avec la contrainte “pas plus de 30 personnes par heure”) ou le planning de réservation
                de créneaux chez le médecin (avec la contrainte “pas plus d’1 personne toutes les 15mn”).
            </p>
            <img src="/img/portfolio/saeProfile.png" alt="placeholder"/>
            <li><h4>Spring Framework</h4></li>
            <p>
                Spring est un framework open source pour construire et définir l'infrastructure d'une application Java, dont il facilite le développement et les tests.
                Spring Boot est un framework Java open source utilisé pour programmer des applications Spring autonomes de qualité production avec un ensemble de bibliothèques qui facilitent le démarrage et la gestion des projets.
                Grâce a ce projet, nous avons appris à utiliser le framework java back-end Spring, ainsi que Spring Security.
                Spring Security est un framework Java/Java EE qui fournit des fonctionnalités d'authentification,
                d'autorisation et d'autres fonctionnalités de sécurité pour les applications d'entreprise.
                Notre projet ne contenat que deux rôle : User et Admin. Un admin peut faire tout ce qu'un utilisateur connecté (User) peut faire,
                mais aussi accéder et modifier les rendez-vous des autres utilisateurs.
            </p>
            <img src="/img/portfolio/saeCalendrier.png" alt="placeholder"/>
            <h4>Compétences et savoir-faire acquis</h4>
            <ul>
                <li>Framework Spring</li>
                <li>JPA</li>
                <li>Spring Security</li>
                <li>Lombok</li>
            </ul>
          </ul>
      </>
    );
}