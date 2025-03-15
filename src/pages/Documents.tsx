export default function DocumentsPage() {
  return (
    <>
      <div className="container">
        <h2>
          <i className="fas fa-user-secret"></i> Page secrète ?{" "}
        </h2>
        <p>
          Cette page regroupe tous les documents téléchargeables du site en un
          seul endroit.
          <br />
          Étant donné que les liens de téléchargement des fichiers sont
          dispersés à travers le site, chaque fichier étant associé à la section
          qui lui correspond, j'ai créé cette page pour faciliter l'accès à
          l'ensemble des documents.
        </p>
      </div>

      <div className="container" id="documents">
        <h2>
          <i className="fas fa-download"></i> Liste de tout les documents pdf
          téléchargeabe
        </h2>
        <table>
          <tbody>
            <tr>
              <td>
                <strong>CV</strong>
              </td>
              <td>
                <a href="/fich/cv.pdf" target="_blank" download>
                  Télécharger
                </a>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Attestation DUT</strong>
              </td>
              <td>
                <a href="/fich/28_DUT_RACDV.pdf" target="_blank" download>
                  Télécharger
                </a>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Rapport de stage 2024</strong>
              </td>
              <td>
                <a href="/fich/RapportDeStage2024.pdf" target="_blank" download>
                  Télécharger
                </a>
              </td>
            </tr>
            <tr>
              <td>
                <strong>
                  Attestation <i>Kaplan International London School</i>
                </strong>
              </td>
              <td>
                <a href="/fich/kaplancertificate.pdf" target="_blank" download>
                  Télécharger
                </a>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Attestation PIX</strong>
              </td>
              <td>
                <a href="/fich/pix.pdf" target="_blank" download>
                  Télécharger
                </a>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Avis de poursuite d'étude</strong>
              </td>
              <td>
                <a href="/files/StudiesNotice.pdf" target="_blank" download>
                  Télécharger
                </a>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Certification du Toeic</strong>
              </td>
              <td>
                <a
                  href="/files/ToeicCertification.pdf"
                  target="_blank"
                  download
                >
                  Télécharger
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="container">
        <h2>
          <i className="fas fa-file-excel"></i> Documents en attente{" "}
        </h2>
        <p>
          Il se peut que certains documents affichent la mention « Bientôt » au
          lieu de « Télécharger ».
          <br />
          J'attends encore la réception de certains documents et les mettrai à
          disposition sur le site dès que possible.
        </p>
      </div>
    </>
  );
}
