import { useTranslation } from "react-i18next";

export default function Sae401() {
  const { t } = useTranslation();

  const projectsWorkPath = "portfolio.work.saes";
  const translationsPath = `${projectsWorkPath}.sae401`;
  return (
    <>
      <ul>
        <li>
          <h4>{t(`${translationsPath}.presentation`)}</h4>
        </li>
        <div>
          <p>{t(`${translationsPath}.presentationDescription`)}</p>
          <ul>
            <li>
              <b>{t(`${translationsPath}.ingredients_table`)}</b>
              {t(`${translationsPath}.ingredients_table_values`)}
            </li>
            <li>
              <b>{t(`${translationsPath}.pizza_table`)}</b>
              {t(`${translationsPath}.pizza_table_value`)}
            </li>
            <li>
              <b>{t(`${translationsPath}.orders_table`)}</b>
              {t(`${translationsPath}.orders_table_value`)}
            </li>
          </ul>
        </div>
        <img src="/img/portfolio/siteWebRestRequests.png" alt="TOTO" title="TODO" />

        <li>
          <h4>{t(`${translationsPath}.security`)}</h4>
        </li>
        <p>{t(`${translationsPath}.security_description`)}</p>
        <img
          src="/img/portfolio/jwt-primer-token.png"
          alt="TOTO"
          title="TODO"
        />

        <h4>{t(`${projectsWorkPath}.skills`)}</h4>
        <ul>
          <li>
            <b> {t(`${translationsPath}.skill1`)} </b>
            {t(`${translationsPath}.skill1_text`)}
          </li>
          <li>
            <b> {t(`${translationsPath}.skill2`)} </b>
            {t(`${translationsPath}.skill2_text`)}
          </li>
        </ul>
        <h4>{t(`${projectsWorkPath}.know_how`)}</h4>
        <ul>
          <li>
            <b> {t(`${translationsPath}.know_how1`)} </b>{" "}
            {t(`${translationsPath}.know_how1_text`)}
          </li>
          <li>
            <b> {t(`${translationsPath}.know_how2`)} </b>{" "}
            {t(`${translationsPath}.know_how2_text`)}
          </li>
        </ul>
      </ul>
    </>
  );
}
