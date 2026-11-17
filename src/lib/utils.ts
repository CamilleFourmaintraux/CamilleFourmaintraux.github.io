export const API_URL =
  import.meta.env.VITE_BACKEND_URL ??
  "https://backendportfolio-ujn6.onrender.com";

// Fonction pour valider une adresse e-mail avec une expression régulière
export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatDate(date: Date) {
  // Extraire le jour, le mois et l'année
  const day = date.getDate();
  const month = date.getMonth() + 1; // Les mois commencent à 0
  const year = date.getFullYear();

  // Formater avec deux chiffres pour jour et mois, et quatre chiffres pour l'année
  const formattedDay = day.toString().padStart(2, "0");
  const formattedMonth = month.toString().padStart(2, "0");
  const formattedYear = year.toString().padStart(4, "0");

  // Retourner la date sous le format dd/mm/yyyy
  return `${formattedDay}/${formattedMonth}/${formattedYear}`;
}

export function transformSaeID(saeID: string) {
  // Vérifie si la chaîne a exactement 6 caractères, commence par "sae" et finit par 3 chiffres
  if (
    saeID.length === 6 &&
    saeID.slice(0, 3) === "sae" &&
    /^\d{3}$/.test(saeID.slice(3))
  ) {
    // Remplace le "e" par "é", ajoute un espace entre "sae" et les chiffres, et ajoute un espace et un ":" à la fin
    return `${saeID.slice(0, 3).replace("e", "é").toUpperCase()} ${saeID.slice(
      3,
    )} :`;
  }
  // Si les conditions ne sont pas remplies, la fonction ne renvoie rien
  return "";
}

export function getRandomInt(max: number) {
  // si max=3, résultats possible : 0, 1, 2
  return Math.floor(Math.random() * max);
}
