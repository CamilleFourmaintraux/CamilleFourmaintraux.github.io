import { useTranslation } from "react-i18next";

export default function Sae501() {
  const { t } = useTranslation();

  const projectsWorkPath = "portfolio.work.saes";
  const translationsPath = `${projectsWorkPath}.sae501`;
  return (
    <>
      <ul>
        <li>
          <h4>{t(`${translationsPath}.presentation`)}</h4>
        </li>
        <p>{t(`${translationsPath}.presentationDescription`)}</p>
        <img
          src="/img/portfolio/riscV_encodage.png"
          alt={t(`${translationsPath}.alt1`)}
          title={t(`${translationsPath}.alt1`)}
        />
        <li>
          <h4>{t(`${translationsPath}.programming`)}</h4>
        </li>
        <p>{t(`${translationsPath}.programmingDescription`)}</p>
        <img
          src="/img/portfolio/riscV_codeExample.png"
          alt={t(`${translationsPath}.alt2`)}
          title={t(`${translationsPath}.alt2`)}
        />
        <li>
          <h4>{t(`${projectsWorkPath}.skills`)}</h4>
        </li>
        <ul>
          <li>{t(`${translationsPath}.skill1`)}</li>
          <li>{t(`${translationsPath}.skill2`)}</li>
          <li>{t(`${translationsPath}.skill3`)}</li>
        </ul>
      </ul>
    </>
  );
}
