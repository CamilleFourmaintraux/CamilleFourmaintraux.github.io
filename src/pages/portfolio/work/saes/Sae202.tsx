import { useTranslation } from "react-i18next";

export default function Sae202() {
  const { t } = useTranslation();

  const projectsWorkPath = "portfolio.work.saes";
  const translationsPath = `${projectsWorkPath}.pagil2`;
  return (
    <>
      <ul>
        <li>
          <h4>{t(`${translationsPath}.presentation`)}</h4>
        </li>
        <p>{t(`${translationsPath}.presentationDescription`)}</p>
        <img src="/img/portfolio/sae_IHM_code.png" alt="photo du code" />
        <li>
          <h4>Utilisation de JavaFX pour l’Interface Homme-Machine</h4>
        </li>
        <p>
          Cette application était à réaliser, dans un premier temps, entièrement
          au format texte dans la console du terminal. Pour le rendu final par
          contre, nous devions créer une application en JavaFx afin de donner un
          interface graphique à notre programme, rendant notre application plus
          ergonomique et accessible d'utilisation.
        </p>
        <img src="/img/portfolio/saeIHM.png" alt="photo de l'IHM" />
        <li>
          <h4>{t(`${projectsWorkPath}.skills`)}</h4>
        </li>
        <ul>
          <li>{t(`${translationsPath}.skill1`)}</li>
          <li>{t(`${translationsPath}.skill2`)}</li>
          <li>{t(`${translationsPath}.skill3`)}</li>
        </ul>
        <p>
          {t(`${projectsWorkPath}.linkText`)}{" "}
          <a href="https://github.com/CamilleFourmaintraux/plateforme_covoiturage">
            {t(`${projectsWorkPath}.link`)}
          </a>
        </p>
      </ul>
    </>
  );
}
