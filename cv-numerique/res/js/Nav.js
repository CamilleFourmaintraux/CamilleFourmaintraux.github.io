window.addEventListener('scroll', function() {
    var navbar = document.getElementById('navbar');
    var threshold = 100; // Point où le menu devient fixe (en pixels)
    var offset = navbar.offsetHeight; // Hauteur de la barre de navigation

    if (window.pageYOffset > threshold) {
      navbar.classList.add('fixed');
    } else {
      navbar.classList.remove('fixed');
    }

    var button = document.getElementById("back-to-top");
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
      button.style.display = "block";
    } else {
      button.style.display = "none";
    }
  });

  // Fonction pour faire défiler vers le haut de la page
  function topFunction() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Ajoute un défilement fluide
    });
  }

  // Fonction pour ajuster la position lors du clic sur un lien du menu
  var links = document.querySelectorAll('#navbar a[href^="#"]');
  links.forEach(function(link) {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      var targetId = this.getAttribute('href').substring(1); // Récupère l'ID de la cible
      var targetElement = document.getElementById(targetId); // Élément cible
      var targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset; // Position de l'élément par rapport au haut de la page
      var offset = 80; // Ajustement de l'offset
      var newPosition = targetPosition - offset; // Nouvelle position ajustée

      window.scrollTo({
        top: newPosition,
        behavior: 'smooth'
      });
    });
  });