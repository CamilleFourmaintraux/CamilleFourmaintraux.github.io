import { useTranslation } from "react-i18next";

export default function Miscellaneous() {
  const { t } = useTranslation();
  const projectsPassionPath = `portfolio.passion.projects`;
  const translationsPath = `${projectsPassionPath}.miscellaneous`;
  const items = t(`${translationsPath}.list`, {
    returnObjects: true,
  }) as string[];

  return (
    <>
      <ul>
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      <p>{t(`${translationsPath}.text`)}</p>
    </>
  );
}
