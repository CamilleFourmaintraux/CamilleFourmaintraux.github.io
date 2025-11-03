import EMothep from "../../parts/E-Mothep";
import { useTranslation } from "react-i18next";
export default function Experiences() {
  const { t } = useTranslation();
  return (
    <>
      <div className="container" id="experiences">
        <h2>{t("experience.title")}</h2>
        <div className="subcontainer" id="stage2025container">
          <div>
            <h3 id="stage2025" style={{ float: "left" }}>
              {t("experience.stage2025.title")} <EMothep /> [Lille]
            </h3>
          </div>
          <br />
          <p id="stage2025">{t("experience.stage2025.description")}</p>
          <a
            href="/files/InternshipReportEmothep2025.pdf"
            target="_blank"
            id="stage2025rapport"
          >
            {t("experience.stage2025.full_report")}
          </a>
        </div>

        <div className="subcontainer" id="tutorat">
          <h3>{t("experience.tutor.title")}</h3>
          <ul>
            <li>{t("experience.tutor.support")}</li>
            <li>{t("experience.tutor.group")}</li>
            <li>{t("experience.tutor.responsibilities")}</li>
          </ul>
        </div>

        <div className="subcontainer" id="stage2024container">
          <div>
            <h3 id="stage2024" style={{ float: "left" }}>
              {t("experience.stage2024.title")} <EMothep /> [Lille]
            </h3>
            <img
              src="/img/cursus/emothep_logo.png"
              alt={t("experience.stage2024.logo_alt")}
              title={t("experience.stage2024.logo_alt")}
              style={{ float: "right" }}
              id="emothepLogo"
            />
          </div>
          <br />
          <p>
            <EMothep /> {t("experience.stage2024.company_desc")}
          </p>
          <ul>
            <li>
              <strong>{t("experience.stage2024.main_project.title")}</strong>
              <p>{t("experience.stage2024.main_project.desc")}</p>
            </li>
            <li>
              <strong>{t("experience.stage2024.api.title")}</strong>
              <p>{t("experience.stage2024.api.desc")}</p>
            </li>
            <li>
              <strong>{t("experience.stage2024.documentation.title")}</strong>
              <p>{t("experience.stage2024.documentation.desc")}</p>
            </li>
            <li>
              <strong>
                {t("experience.stage2024.internal_project.title")}
              </strong>
              <p>{t("experience.stage2024.internal_project.desc")}</p>
            </li>
            <li>
              <strong>{t("experience.stage2024.pm.title")}</strong>
              <p>{t("experience.stage2024.pm.desc")}</p>
            </li>
            <li>
              <strong>{t("experience.stage2024.skills.title")}</strong>
              <p>{t("experience.stage2024.skills.desc")}</p>
            </li>
            <li>
              <strong>{t("experience.stage2024.tools.title")}</strong>
              <p>{t("experience.stage2024.tools.desc")}</p>
            </li>
          </ul>
          <a
            href="/files/InternshipReportEmothep2024.pdf"
            target="_blank"
            id="stage2024rapport"
          >
            {t("experience.stage2024.full_report")}
          </a>
        </div>

        <div className="subcontainer" id="carrefour">
          <h3>{t("experience.carrefour.title")}</h3>
          <ul>
            <li>{t("experience.carrefour.team")}</li>
            <li>{t("experience.carrefour.autonomy")}</li>
            <li>{t("experience.carrefour.initiative")}</li>
          </ul>
        </div>
      </div>
    </>
  );
}
