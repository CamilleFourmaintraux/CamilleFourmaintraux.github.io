 // Fonction pour charger un fichier HTML dans un élément donné
 function loadHTML(elementId, filename) {
    fetch(filename)
        .then(response => response.text())
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
        })
        .catch(error => console.error("Erreur de chargement : ", error));
}

// Charger le header et le footer
loadHTML("header", "../parts/header.html");
//loadHTML("footer", "footer.html");