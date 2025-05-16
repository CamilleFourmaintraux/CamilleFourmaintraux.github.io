import { useTranslation } from "react-i18next";

export default function MiniGames() {
  const { t } = useTranslation();
  const projectsPassionPath = `portfolio.passion.projects`;
  const translationsPath = `${projectsPassionPath}.minigames`;
  return (
    <ul>
      <li>
        <h4>{t(`${translationsPath}.title1`)}</h4>
      </li>
      <p>{t(`${translationsPath}.text1`)}</p>
      <img src="/img/passions/pong.png" alt={t(`${translationsPath}.alt1`)} title={t(`${translationsPath}.alt1`)} />
      <li>
        <h4>{t(`${translationsPath}.title2`)}</h4>
      </li>
      <p>{t(`${translationsPath}.text1`)}</p>
      <img
        src="/img/passions/casseBrique.png"
        alt={t(`${translationsPath}.alt2`)}
        title={t(`${translationsPath}.alt2`)}
      />
      <li>
        <h4>{t(`${translationsPath}.skills_title`)}</h4>
      </li>
      <ul>
        <li>{t(`${translationsPath}.skills_list.timer`)}</li>
        <li>{t(`${translationsPath}.skills_list.gameloop`)}</li>
      </ul>
    </ul>
  );
}
