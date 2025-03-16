import { useTranslation } from "react-i18next";

export default function DocumentsPage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="container">
        <h2>
          <i className="fas fa-user-secret"></i> {t("secret.title")}
        </h2>
        <p>{t("secret.description")}</p>
      </div>

      <div className="container" id="documents">
        <h2>
          <i className="fas fa-download"></i> {t("documents.title")}
        </h2>
        <table>
          <tr>
            <td>
              <strong>{t("documents.cv")}</strong>
            </td>
            <td>
              <a href="/fich/cv.pdf" target="_blank" download>
                {t("documents.download")}
              </a>
            </td>
          </tr>
          <tr>
            <td>
              <strong>{t("documents.attestation_dut")}</strong>
            </td>
            <td>
              <a href="/fich/28_DUT_RACDV.pdf" target="_blank" download>
                {t("documents.download")}
              </a>
            </td>
          </tr>
          <tr>
            <td>
              <strong>{t("documents.rapport_stage")}</strong>
            </td>
            <td>
              <a href="/fich/RapportDeStage2024.pdf" target="_blank" download>
                {t("documents.download")}
              </a>
            </td>
          </tr>
          <tr>
            <td>
              <strong>{t("documents.kaplan")}</strong>
            </td>
            <td>
              <a href="/fich/kaplancertificate.pdf" target="_blank" download>
                {t("documents.download")}
              </a>
            </td>
          </tr>
          <tr>
            <td>
              <strong>{t("documents.pix")}</strong>
            </td>
            <td>
              <a href="/fich/pix.pdf" target="_blank" download>
                {t("documents.download")}
              </a>
            </td>
          </tr>
          <tr>
            <td>
              <strong>{t("documents.studies_notice")}</strong>
            </td>
            <td>
              <a href="/files/StudiesNotice.pdf" target="_blank" download>
                {t("documents.download")}
              </a>
            </td>
          </tr>
          <tr>
            <td>
              <strong>{t("documents.toeic")}</strong>
            </td>
            <td>
              <a href="/files/ToeicCertification.pdf" target="_blank" download>
                {t("documents.download")}
              </a>
            </td>
          </tr>
        </table>
      </div>

      <div className="container">
        <h2>
          <i className="fas fa-file-excel"></i> {t("pending.title")}
        </h2>
        <p>{t("pending.description")}</p>
      </div>
    </>
  );
}
