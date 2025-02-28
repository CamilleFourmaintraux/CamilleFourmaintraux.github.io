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
  {title:"Spring-Boot",description:"Une pop up à propos de Sping-Boot."},
  {title:"React",description:"Pop-up à propos de React."},
  {title:"MongoDB, Redis, Cassandra",description:"Une pop up."},
  {title:"CI/DC",description:"Une pop up."},
  {title:"Postman, Bruno",description:"Une pop up."},
  {title:"Outils Collaboratifs",description:"Une pop up."},
  {title:"Software AG Designer",description:"Une pop up."},
  {title:"Certification Toeic",description:"La der pop up."},
]