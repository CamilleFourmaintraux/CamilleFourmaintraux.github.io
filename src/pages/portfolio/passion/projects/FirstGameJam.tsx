import { useTranslation } from "react-i18next";

export default function FirstGameJam() {
  const { t } = useTranslation();
  const projectsPassionPath = `portfolio.passion.projects`;
  const translationsPath = `${projectsPassionPath}.firstgamejam`;
  return (
    <ul>
      <li>
        <h4>{t(`${translationsPath}.title1`)}</h4>
      </li>
      <li>
        <p
          dangerouslySetInnerHTML={{ __html: t(`${translationsPath}.text1`) }}
        />
        <img
          src="/img/passions/firstgamejam.gif"
          alt={t(`${translationsPath}.alt1`)}
        />
      </li>
      <li>
        <h4>{t(`${translationsPath}.title2`)}</h4>
      </li>
      <p>
        {t(`${translationsPath}.text2`)}
        <br />
        <a href="https://grotacam.itch.io/thelegendofknardwizight">
          <i className="fas fa-game"></i> {t(`${translationsPath}.play_link`)}
        </a>
        <img
          src="/img/passions/firstgamejamresult.png"
          alt={t(`${translationsPath}.alt2`)}
        />
      </p>
      <li>
        <h4>{t(`${translationsPath}.skills_title`)}</h4>
      </li>
      <ul>
        <li>{t(`${translationsPath}.skills_list.godot`)}</li>
        <li>{t(`${translationsPath}.skills_list.physics`)}</li>
        <li>{t(`${translationsPath}.skills_list.sprites`)}</li>
        <li>{t(`${translationsPath}.skills_list.time`)}</li>
      </ul>
    </ul>
  );
}
