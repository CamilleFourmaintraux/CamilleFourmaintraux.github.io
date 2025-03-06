import { useState, useRef } from "react";

const tabTextPopup = [
  {title:"Spring-Boot",description:"Formation et projet sur Spring-Boot et Spring security pour la conception du back-end d'un site de prise de rendez-vous."},
  {title:"Modélisation Mathématique",description:"L’objectif de cette ressource était d’approfondir plusieurs domaines d’applications en donnant des éléments de formalisation, de connaissances et d’usages spécifiques à ces domaines, en particulier dans le domaine des mathématiques et de l’algorithmique sous-jacentes."},
  {title:"MongoDB, Redis, Cassandra",description:"Formation sur les Base de Données NoSQl. Introduction à MongoDb, Redis et à Cassandra pour la distribution de données : scalabilité horizontale."},
  {title:"React",description:"Formation et projet pour développer un front-end en React. Utilisation d'API, appels AJAX, Formulaires, Components, Refs, Redux."},
  {title:"Qualité de code",description:"Formation sur la qualité de développement, qualité algorithmique et aide à la décision. Algorithmes glouton, Apprentissage supervisé/K-NN, Classification Bayesienne et arbre de décisions."},
  {title:"CI/CD",description:"L’objectif de cette ressource est de concrétiser la chaîne de production d’une application afin de développer les aptitudes nécessaires pour travailler efficacement dans une équipe informatique."},
  {title:"Postman, Bruno",description:"Utilisation de Postman et de Bruno pour émettre des requêtes afin de tester des APIS."},
  {title:"Programmation multimédia",description:"Sensibilisation à la programmation multimédia. Manipulation d'images 2D, Historigrammes, Convolution et filtrage spatiale et Détections de contours. L'objectif de cette formation était de nous familiariser avec des méthodes classiques d’analyse et de traitement d’images."},
  {title:"Outils Collaboratifs",description:"Utilisation régulière d'outils de collaborations tels que Gitlab, GitHub, Trello, Mantis, Microsoft Teams."},
  {title:"Software AG Designer",description:"WebMethods était une société de logiciels d’entreprise qui se concentrait sur l’intégration d’applications, l’intégration de processus commerciaux et également l’intégration de partenaires B2B. En 2007, WebMethods a été rachetée par Software AG est devenue une filiale de cette entreprise. Software AG a conservé le nom WebMethods. Elle l’utilise pour identifier une suite logicielle englobant l’amélioration des processus, la mise en place d’une SOA, la modernisation informatique ainsi que l’intégration des entreprises."},
  {title:"Certification Toeic",description:"Certification au Toeic de niveau C1, correspondant à un utilisateur expérimenté, c'est-à-dire : Capable de comprendre des textes longs, de saisir des significations implicite, ainsi que de s'exprimer spontanément et couramment sans trop devoir chercher ses mots."}
]

function normalizeString(input:string) {
  return input
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .toLowerCase() // Met en minuscule
      .replace(/\s+/g, '-') // Remplace les espaces par des tirets
      .replace(/[^a-z0-9\-_.]/g, ""); // Supprime les caractères non autorisés
}

export default function Skills() {
    const [popupData, setPopupData] = useState<{ title: string; description: string }>({ title: "Erreur", description: "Une erreur est survenue." });
    
    const cardContainerRef = useRef<HTMLDivElement | null>(null);
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);

    const handleCardClick = (index: number) => {
        console.log(`Card n°${index} clicked !`);
        if (!cardContainerRef.current || !carouselRef.current || !cardContainerRef.current.children[index] || !popupRef) {console.log("Error! No Popup.");return};
      
        const card = cardContainerRef.current.children[index] as HTMLElement;
        const cardWidth = card.offsetWidth;
        const carouselWidth = carouselRef.current.offsetWidth;
        const cardOffset = card.offsetLeft;
      
        cardContainerRef.current.scrollTo({
          left: cardOffset - carouselWidth / 2 + cardWidth / 2,
          behavior: "smooth"
        });
      
        setPopupData(tabTextPopup[index]);
        
        console.log("Test data : "+popupData+". Autre test : {"+tabTextPopup[index].title+","+tabTextPopup[index].description+"}");
        showPopUp();
    };  
    
  function showPopUp(){
    if(popupRef.current==null) {console.log("Error! PopUpRef.current is null.");return};
    popupRef.current.style.display = "flex";
  }

  function hidePopUp(){
    if(popupRef.current==null) {console.log("Error! PopUpRef.current is null.");return};
    popupRef.current.style.display = "none";
  }


  return (
    <div className="container" id="competences">
      <h2>Compétences / Savoir-faire</h2>
      <ul>
        <li><strong>Langue :</strong> Anglais </li>
        <li><strong>Langages de programmation :</strong> Java, JavaScript, TypeScript, Python, C</li>
        <li><strong>Outils de développement (IDE) :</strong> Software AG Designer, Eclipse, IntelliJ, VSCode </li>
        <li><strong>Développement web :</strong> HTML, CSS, JavaEE, React, Angular, Spring-Boot </li>
        <li><strong>Gestion de bases de données SQL :</strong> PostgreSQL, DBeaver, H2</li>
        <li><strong>Gestion de bases de données NoSQL :</strong> MongoDB, Redis, Cassandra </li>
        <li><strong>Gestion d'API :</strong> Bruno, Postman</li>
        <li><strong>Outils collaboratifs :</strong> Git, GitLab, GitHub, Trello, Mantis</li>
        <li><strong>Scrum :</strong> Fut Scrum Master lors d'un projet agile.</li>
        <li><strong>CI/CD :</strong> Automatisation, intégration et déploiement continus</li>
        <li><strong>Qualité du code :</strong> Qualité de développement et algorithmique</li>
        <li><strong>Modélisation Mathématiques :</strong> Graphes, imagerie, IA, visualisation</li>
        <li><strong>Programmation multimédia :</strong> Manipulation d'images 2D, filtrage spatial</li>
      </ul>

      <div className="carousel" ref={carouselRef}>
        <div className="card-container" ref={cardContainerRef}>
          {tabTextPopup.map((item, index) => (
            <div key={index} className="card" onClick={() => handleCardClick(index)}>
              <img src={`/img/cursus/competences/${normalizeString(item.title)}.png`} alt={normalizeString(item.title)} className="cardPicture" />
            </div>
          ))}
        </div>
      </div>
      {popupData && (
        <div className="popup" ref={popupRef} onClick={() => (hidePopUp())}>
          <div className="popup-content">
            <h2>{popupData.title}</h2>
            <p>{popupData.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
