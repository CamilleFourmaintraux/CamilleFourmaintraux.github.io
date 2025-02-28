const listOfCardElements = document.querySelectorAll('.card');
const cardContainer = document.querySelector('.card-container');

const carousel = document.querySelector('.carousel');

var currentCard;

const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popupTitle');
const popupDescription = document.getElementById('popupDescription');

listOfCardElements.forEach((cardElement, index) => {
  cardElement.addEventListener('click', () => {
    console.log(`Card ${index} selected.`);
    if (currentCard!=null) currentCard.classList.remove("selected");
    cardElement.classList.add("selected");
    currentCard=cardElement;
    //const scrollLeft = index * listOfCardElements[0].offsetWidth +100;
    cardContainer.scrollTo({ left: calculateCenterPosition(cardElement), behavior: 'smooth' });
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

//Ordre : Spring-Boot, React, MongoDB, CI-DC, ...
const tabTextPopup = [
  {title:"Spring-Boot",description:"Une pop up à propos de Sping-Boot."},
  {title:"React",description:"Pop-up à propos de React."},
  {title:"MongoDB",description:"Une pop up."},
  {title:"CI/DC",description:"Une pop up."},
  {title:"Pop-Up",description:"Une pop up."},
  {title:"Pop-Up",description:"Une pop up."},
  {title:"Pop-Up",description:"Une pop up."},
  {title:"Pop-Up",description:"Une pop up."},
  {title:"Pop-Up",description:"Une pop up."},
  {title:"Pop-Up",description:"La der pop up."},
]