export function formatDate(date: Date) {
  // Extraire le jour, le mois et l'année
  let day = date.getDate();
  let month = date.getMonth() + 1; // Les mois commencent à 0
  let year = date.getFullYear();

  // Formater avec deux chiffres pour jour et mois, et quatre chiffres pour l'année
  let formattedDay = day.toString().padStart(2, "0");
  let formattedMonth = month.toString().padStart(2, "0");
  let formattedYear = year.toString().padStart(4, "0");

  // Retourner la date sous le format dd/mm/yyyy
  return `${formattedDay}/${formattedMonth}/${formattedYear}`;
}

export function newDate(year: number, month: number, day: number) {
  return new Date(year, month + 1, day);
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
      3
    )} :`;
  }
  // Si les conditions ne sont pas remplies, la fonction ne renvoie rien
  return "";
}

//@ts-ignore
export const TagsList = ({ tags, current }) => {
  return (
    <div className="tags-container">
      {tags.map((tag: string, index: number) => (
        <span key={index} className={`tag ${current == tag ? "active" : ""}`}>
          {tag}
        </span>
      ))}
    </div>
  );
};

export function getRandomInt(max: number) {
  // si max=3, résultats possible : 0, 1, 2
  return Math.floor(Math.random() * max);
}
