import { useTranslation } from "react-i18next";

export default function Sae402() {
  const { t } = useTranslation();

  const projectsWorkPath = "portfolio.work.saes";
  const translationsPath = `${projectsWorkPath}.sae402`;
  return (
    <>
      <ul>
        <li>
          <h4>{t(`${translationsPath}.presentation`)}</h4>
        </li>
        <p>{t(`${translationsPath}.presentationDescription`)}</p>
        <img src="/img/portfolio/versionBasique.gif" alt="TOTO" title="TODO" />
        <li>
          <h4>{t(`${translationsPath}.multiplayer`)}</h4>
        </li>
        <p>{t(`${translationsPath}.multiplayer_description`)}</p>
        <img src="/img/portfolio/versionFinale.gif" alt="TOTO" title="TODO" />
        <h4>{t(`${projectsWorkPath}.skills`)}</h4>
        <ul>
          <li>
            <b> {t(`${translationsPath}.skill1`)} </b>{" "}
            {t(`${translationsPath}.skill1_text`)}
          </li>
          <li>
            <b> {t(`${translationsPath}.skill2`)} </b>{" "}
            {t(`${translationsPath}.skill2_text`)}
          </li>
          <li>
            <b> {t(`${translationsPath}.skill3`)} </b>{" "}
            {t(`${translationsPath}.skill3_text`)}
          </li>
          <li>
            <b> {t(`${translationsPath}.skill4`)} </b>{" "}
            {t(`${translationsPath}.skill4_text`)}
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
          <li>
            <b> {t(`${translationsPath}.know_how3`)} </b>{" "}
            {t(`${translationsPath}.know_how3_text`)}
          </li>
        </ul>
      </ul>
    </>
  );
}
