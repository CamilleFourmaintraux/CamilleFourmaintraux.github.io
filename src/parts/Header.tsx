import { useEffect, useState } from "react";
import { getRandomInt } from "../Utils";
import { useTranslation } from "react-i18next";

export default function Header() {
  const { t } = useTranslation();
  const [backgroundImage, setBackgroundImage] = useState("");

  useEffect(() => {
    setBackgroundImage(`/img/header/matrix${getRandomInt(4) + 1}.gif`);
  }, []);
  return (
    <header
      id="header"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <h1>Camille FOURMAINTRAUX</h1>
      <p>{t("subtitleSentence")}</p>

      <img
        src="/img/header/me_blue.png"
        alt="Ma Photo"
        id="photoPresentation"
      ></img>
    </header>
  );
}
