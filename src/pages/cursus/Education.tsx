export default function Education() {
  return (
    <>
      <div className="container" id="formation">
        <h2>Formation</h2>
        <ul>
          <li>
            <strong>2025</strong>
            <ul>
              <li>
                <a href="/img/placeholder.png" target="_blank">
                  Avis de poursuite d'étude très favorable
                </a>
              </li>
              <li>
                Obtention de ma certification du{" "}
                <a href="/img/placeholder.png" target="_blank">
                  TOEIC Niveau C1
                </a>{" "}
                - IUT de Lille Villeneuve d'Ascq
              </li>
            </ul>
          </li>
          <li>
            <strong>2024</strong>
            <ul>
              <li>
                <a href="/files/kaplanCertificate.pdf" target="_blank">
                  Séjour d'un mois en Angleterre dans une école spécialisée
                </a>{" "}
                pour renforcer mes compétences en anglais.
              </li>
              <li>
                <a href="/files/DutCertificate.pdf" target="_blank">
                  Obtention de mon DUT
                </a>{" "}
                - IUT de Lille Villeneuve d'Ascq
              </li>
              <img src="/img/cursus/iut.jpg" alt="photo IUT" />
            </ul>
          </li>
          <li>
            <strong>2022</strong>
            <ul>
              <li>
                Baccalauréat général Mention Bien - Lycée Pierre D'Ailly
                Compiègne
              </li>
              <img src="/img/cursus/lycee.png" alt="photo lycée" />
              <li>
                <a href="/files/pixCertificate.pdf" target="_blank">
                  Certification PIX 635pix
                </a>{" "}
                - Lycée Pierre D'Ailly Compiègne
              </li>
              <li>Permis B</li>
            </ul>
          </li>
        </ul>
      </div>
    </>
  );
}
