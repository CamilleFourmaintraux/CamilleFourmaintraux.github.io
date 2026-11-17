import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { EMAIL } from "@/lib/links";
import ExternalLink from "@/ui/ExternalLink";
import Page, { Section } from "@/ui/Page";
import VisitStatsToggle from "@/ui/VisitStatsToggle";

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
  contactLink: <Link to="/contact" className="nowrap" />,
  cnilLink: <ExternalLink href="https://www.cnil.fr/fr/plaintes" />,
};

export default function Privacy() {
  const { t } = useTranslation();
  return (
    <Page
      title={t("privacy.title")}
      icon={faShieldHalved}
      lead={
        <>
          <p>{t("privacy.intro")}</p>
          <p className="note">{t("privacy.updated")}</p>
        </>
      }
    >
      {SECTIONS.map(({ key, items }) => (
        <Section key={key} title={t(`privacy.${key}.title`)}>
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
        </Section>
      ))}
    </Page>
  );
}
