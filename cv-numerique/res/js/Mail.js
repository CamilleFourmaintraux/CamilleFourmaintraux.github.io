(function(){
    emailjs.init("Xmg7VBMr1uTpxpnUl"); // Remplacez YOUR_USER_ID par votre User ID d'EmailJS

    document.getElementById('contact-form').addEventListener('submit', function(event) {
      event.preventDefault();
      // Récupération des valeurs du formulaire
      const form = this;
      const formData = new FormData(form);
      const name = formData.get('name');
      const forename = formData.get('forename');
      const mail = formData.get('mail');
      const subject = formData.get('subject');
      const message = formData.get('message');

      if (validateEmail(mail)) {
        console.log('L\'adresse e-mail est valide.');
        // Envoi de l'e-mail via EmailJS
        emailjs.send("service_hacwrwf", "template_kxdf4ll", {
        from_name: (forename+" "+name),
        from_email: mail,
        subject: subject,
        message: message
        })
        .then(function(response) {
        console.log('E-mail envoyé !', response);
        displayMessage('Message envoyé avec succès.', 'success');
        }, function(error) {
        console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
        displayMessage('Erreur lors de l\'envoi du message. Veuillez réessayer.', 'error');
        });

      } else {
        console.log('Veuillez entrer une adresse e-mail valide.');
        displayMessage('Adresse E-Mail invalide.', 'error');
      }
    });
  })();

// Fonction pour valider une adresse e-mail avec une expression régulière
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

 // Fonction pour afficher les messages
 function displayMessage(message, type) {
  const messageStatus = document.getElementById('message-status');
  const section_form = document.getElementById('section_form');
  messageStatus.textContent = message;
  messageStatus.style.display = 'block';

  if (type === 'success') {
    section_form.style.display = 'none';
    messageStatus.style.color = 'green';
  } else if (type === 'error') {
    messageStatus.style.color = 'red';
  }

  // Optionnel : Masquer le message après quelques secondes
  setTimeout(function() {
    messageStatus.style.display = 'none';
    section_form.style.display = 'block';
  }, 5000); // Masque le message après 5 secondes (5000 millisecondes)
}