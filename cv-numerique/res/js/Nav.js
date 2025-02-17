window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    const threshold = 220; // Point où le menu devient fixe (en pixels)
    //const offset = navbar.offsetHeight; // Hauteur de la barre de navigation

    if (window.scrollY > threshold) {
      navbar.classList.add('fixed');
    } else {
      navbar.classList.remove('fixed');
    }

    const button = document.getElementById("back-to-top");
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
      button.style.display = "block";
    } else {
      button.style.display = "none";
    }
  });

  function smoothScrollTo(newPosition){
    window.scrollTo({
      top: newPosition,
      behavior: 'smooth'
    });
  }

  // Fonction pour faire défiler vers le haut de la page
  function scrollToTop() {
    smoothScrollTo(0);
  }

  // Fonction pour ajuster la position lors du clic sur un lien du menu
  const links = document.querySelectorAll('#navbar a[href^="#"]');
  links.forEach(function(link) {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      const targetId = this.getAttribute('href').substring(1); // Récupère l'ID de la cible
      const targetElement = document.getElementById(targetId); // Élément cible
      const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY; // Position de l'élément par rapport au haut de la page
      const offset = 160; // Ajustement de l'offset
      const newPosition = targetPosition - offset; // Nouvelle position ajustée
      smoothScrollTo(newPosition);
    });
  });