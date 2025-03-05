const listOfCardElements = document.querySelectorAll('.card');
const cardContainer = document.querySelector('.card-container');

const carousel = document.querySelector('.carousel');

//var currentCard;

const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popupTitle');
const popupDescription = document.getElementById('popupDescription');

listOfCardElements.forEach((cardElement, index) => {
  cardElement.addEventListener('click', () => {
    //console.log(`Card ${index} selected.`);
    //if (currentCard!=null) currentCard.classList.remove("selected");
    //cardElement.classList.add("selected");
    //currentCard=cardElement;
    //const scrollLeft = index * listOfCardElements[0].offsetWidth +100; //Déplace la carte selectionné à gauche de l'écran
    cardContainer.scrollTo({ left: calculateCenterPosition(cardElement), behavior: 'smooth' }); //Déplace la carte sélectionné au centre de l'écran.
    popup.style.display = 'flex'; 
    popupTitle.innerHTML=tabTextPopup[index].title;
    popupDescription.innerHTML=tabTextPopup[index].description;
  });
});

// Fermer le pop-up en cliquant à l'extérieur
window.onclick = function(event) {
  if (event.target === popup) {
      popup.style.display = 'none';
  }
}

function calculateCenterPosition(card) {
  const cardWidth = card.offsetWidth; // Get the width of the selected card
  const carouselWidth = carousel.offsetWidth; // Get the width of the carousel container
  const cardOffset = card.offsetLeft; // Get the position of the card within the carousel

  return cardOffset - (carouselWidth/2) + (cardWidth / 2);
}

const tabTextPopup = [
  {title:"Spring-Boot",description:"Formation et projet sur Spring-Boot et Spring security pour la conception du back-end d'un site de prise de rendez-vous."},
  {title:"Modélisation Mathématique",description:"L’objectif de cette ressource était d’approfondir plusieurs domaines d’applications en donnant des éléments de formalisation, de connaissances et d’usages spécifiques à ces domaines, en particulier dans le domaine des mathématiques et de l’algorithmique sous-jacentes."},
  {title:"MongoDB, Redis, Cassandra",description:"Formation sur les Base de Données NoSQl. Introduction à MongoDb, Redis et à Cassandra pour la distribution de données : scalabilité horizontale."},
  {title:"React",description:"Formation et projet pour développer un front-end en React. Utilisation d'API, appels AJAX, Formulaires, Components, Refs, Redux."},
  {title:"Qualité de code",description:"Formation sur la qualité de développement, qualité algorithmique et aide à la décision. Algorithmes glouton, Apprentissage supervisé/K-NN, Classification Bayesienne et arbre de décisions."},
  {title:"CI/CD",description:"L’objectif de cette ressource est de concrétiser la chaîne de production d’une application afin de développer les aptitudes nécessaires pour travailler efficacement dans une équipe informatique."},
  {title:"Postman, Bruno",description:"Utilisation de Postman et de Bruno pour émettre des requêtes afin de tester des APIS."},
  {title:"Programmationn multimédia",description:"Sensibilisation à la programmation multimédia. Manipulation d'images 2D, Historigrammes, Convolution et filtrage spatiale et Détections de contours. L'objectif de cette formation était de nous familiariser avec des méthodes classiques d’analyse et de traitement d’images."},
  {title:"Outils Collaboratifs",description:"Utilisation régulière d'outils de collaborations tels que Gitlab, GitHub, Trello, Mantis, Microsoft Teams."},
  {title:"Software AG Designer",description:"WebMethods était une société de logiciels d’entreprise qui se concentrait sur l’intégration d’applications, l’intégration de processus commerciaux et également l’intégration de partenaires B2B. En 2007, WebMethods a été rachetée par Software AG est devenue une filiale de cette entreprise. Software AG a conservé le nom WebMethods. Elle l’utilise pour identifier une suite logicielle englobant l’amélioration des processus, la mise en place d’une SOA, la modernisation informatique ainsi que l’intégration des entreprises."},
  {title:"Certification Toeic",description:"Certification au Toeic de niveau C1, correspondant à un utilisateur expérimenté, c'est-à-dire : Capable de comprendre des textes longs, de saisir des significations implicite, ainsi que de s'exprimer spontanément et couramment sans trop devoir chercher ses mots."}
]