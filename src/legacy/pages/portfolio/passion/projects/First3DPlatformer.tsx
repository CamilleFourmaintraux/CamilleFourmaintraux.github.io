import { useTranslation } from "react-i18next";

export default function First3DPlatformer() {
  const { t } = useTranslation();
  const projectsPassionPath = `portfolio.passion.projects`;
  const translationsPath = `${projectsPassionPath}.first3dplatformer`;
  return (
    <ul>
      <li>
        <h4>{t(`${translationsPath}.learn_godot_title`)}</h4>
      </li>
      <p>{t(`${translationsPath}.learn_godot_text`)}</p>
      <img
        src="/img/passions/platformer.png"
        alt={t(`${translationsPath}.img_alt`)}
        title={t(`${translationsPath}.img_alt`)}
      />
      <li>
        <h4>{t(`${translationsPath}.gameplay_elements_title`)}</h4>
      </li>
      <p>{t(`${translationsPath}.gameplay_elements_text`)}</p>
      <li>
        <h4>{t(`${translationsPath}.skills_title`)}</h4>
      </li>
      <ul>
        <li>{t(`${translationsPath}.skills_list.godot`)}</li>
        <li>{t(`${translationsPath}.skills_list.physics`)}</li>
        <li>{t(`${translationsPath}.skills_list.game_design`)}</li>
        <li>{t(`${translationsPath}.skills_list.mesh_creation`)}</li>
      </ul>
    </ul>
  );
}
