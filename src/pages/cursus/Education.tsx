import { useTranslation } from "react-i18next";
export default function Education() {
  const { t } = useTranslation();
  return (
    <>
      <div className="container" id="formation">
        <h2>{t("formation.title")}</h2>
        <ul>
          <li>
            <strong>2025</strong>
            <ul>
              <li>
                <a href="/files/StudiesNotice.pdf" target="_blank">
                  {t("formation.2025.notice")}
                </a>
              </li>
              <li>
                {t("formation.2025.toeic")}{" "}
                <a href="/files/ToeicCertification.pdf" target="_blank">
                  TOEIC {t("formation.2025.toeic_level")}
                </a>{" "}
                - {t("formation.iut")}
              </li>
            </ul>
          </li>
          <li>
            <strong>2024</strong>
            <ul>
              <li>
                <a href="/files/kaplanCertificate.pdf" target="_blank">
                  {t("formation.2024.kaplan")}
                </a>{" "}
                {t("formation.2024.kaplan_desc")}
              </li>
              <li>
                <a href="/files/DutCertificate.pdf" target="_blank">
                  {t("formation.2024.dut")}
                </a>{" "}
                - {t("formation.iut")}
              </li>
              <img src="/img/cursus/iut.jpg" alt="photo IUT" />
            </ul>
          </li>
          <li>
            <strong>2022</strong>
            <ul>
              <li>{t("formation.2022.bac")}</li>
              <img src="/img/cursus/lycee.png" alt="photo lycée" />
              <li>
                <a href="/files/pixCertificate.pdf" target="_blank">
                  {t("formation.2022.pix")}
                </a>{" "}
                - {t("formation.lycee")}
              </li>
              <li>{t("formation.2022.driving")}</li>
            </ul>
          </li>
        </ul>
      </div>
    </>
  );
}
