import { useEffect, useState } from "react";
import { getRandomInt } from "../Utils";
import { useTranslation } from "react-i18next";

export default function Header() {
  const { t } = useTranslation();
  const [backgroundImage, setBackgroundImage] = useState("");

  useEffect(() => {
    setBackgroundImage(`/img/header/matrix${getRandomInt(4) + 1}.gif`);
  }, []);

  const expAudio = new Audio("/sfx/experience.mp3");
  const hurtAudio = new Audio("/sfx/oof.mp3");
  const [imageSrc, setImageSrc] = useState("/img/header/me_blue.png"); // Image par défaut
  const [hp, setHp] = useState(5); // Compteur de clics

  const handleClick = () => {
    console.log("CLICK : " + hp);
    if (hp <= 0) {
      return;
    } else {
      setHp(hp - 1);
      console.log(hp);
      hurtAudio.currentTime = 0;
      hurtAudio.play();
      setImageSrc("/img/header/me_red.jpg"); // Change l'image après le clic
      setTimeout(() => {
        if (hp == 1) {
          setImageSrc("/img/header/but_nobody_came.jpg"); // Change l'image après le clic
          expAudio.currentTime = 0; // Remet à zéro si le son est déjà en train de jouer
          expAudio.play();
        } else {
          setImageSrc("/img/header/me_blue.png"); // Remet l'image originale après 1s
        }
      }, 300);
    }
  };
  return (
    <header
      id="header"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <h1>Camille FOURMAINTRAUX</h1>
      <p>{t("header.subtitleSentence")}</p>

      <img
        src={imageSrc}
        alt={t("header.me_img_alt")}
        id="photoPresentation"
        onClick={handleClick}
      ></img>
    </header>
  );
}
