import { Trans, useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import VisitStatsToggle from "../parts/visitor/VisitStatsToggle";

const EMAIL = "fourmaintrauxcamille2004@gmail.com";

const SECTIONS: { key: string; items?: string[] }[] = [
  { key: "who" },
  { key: "contact" },
  { key: "chatbot", items: ["providers", "email", "recontact"] },
  {
    key: "context",
    items: [
      "src",
      "referrer",
      "pages",
      "locale",
      "device",
      "time",
      "duration",
      "actions",
    ],
  },
  { key: "technical", items: ["ip", "hosting", "resources"] },
  { key: "storage", items: ["local", "session"] },
  { key: "retention" },
  { key: "rights" },
];

const links = {
  mailLink: <a href={`mailto:${EMAIL}`} />,
  contactLink: <NavLink to="/contact" />,
  cnilLink: (
    <a
      href="https://www.cnil.fr/fr/plaintes"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
};

export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <div className="container privacy">
      <h2>
        <i className="fas fa-shield-halved"></i> {t("privacy.title")}
      </h2>
      <p className="privacy-updated">{t("privacy.updated")}</p>
      <p>{t("privacy.intro")}</p>

      {SECTIONS.map(({ key, items }) => (
        <section key={key}>
          <h3>{t(`privacy.${key}.title`)}</h3>
          <p>
            <Trans
              i18nKey={`privacy.${key}.text`}
              values={{ email: EMAIL }}
              components={links}
            />
          </p>
          {items && (
            <ul>
              {items.map((item) => (
                <li key={item}>
                  <Trans
                    i18nKey={`privacy.${key}.items.${item}`}
                    components={links}
                  />
                </li>
              ))}
            </ul>
          )}
          {key === "context" && <VisitStatsToggle />}
        </section>
      ))}
    </div>
  );
}
