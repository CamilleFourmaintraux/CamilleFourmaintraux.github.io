import { useEffect, useState } from "react";
import { getRandomInt } from "../Utils";

export default function Header() {
  const [backgroundImage, setBackgroundImage] = useState("");

  useEffect(() => {
    setBackgroundImage(`/img/matrix${getRandomInt(4) + 1}.gif`);
  }, []);
  return (
    <header
      id="header"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <h1>Camille FOURMAINTRAUX</h1>
      <p>Étudiant en BUT Informatique</p>
      <img src="/img/me_blue.png" alt="Ma Photo" id="photoPresentation"></img>
    </header>
  );
}
