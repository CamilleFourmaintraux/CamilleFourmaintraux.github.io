 /*// Fonction pour charger un fichier HTML dans un élément donné
 function loadHTML(elementId, filename) {
    fetch(filename)
        .then(response => response.text())
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
            console.log("Chargement réussie de "+filename);
        })
        .catch(error => console.error("Erreur de chargement : ", error));
}

// Charger le header et le footer
loadHTML("", "../parts/header.html");
loadHTML("navigation", "../parts/navbar.html");
loadHTML("footer", "../parts/footer.html");


console.log("TEST HTMLLoader ");*/