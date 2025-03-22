import { useTranslation } from "react-i18next";

const tagsPassion = [
  "WEB",
  "SOFTWARE",
  "C",
  "PYTHON",
  "JAVA",
  "JSTS",
  "VIDEOGAME",
  "MULTIPLAYER",
  "THREEDIMENSIONAL",
  "TWODIMENSIONAL",
  "RPG",
  "SHOOTER",
  "ARCADE",
  "PLATFORMER",
  "MAZES",
];

export const TagListPassion: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      {tagsPassion.map((tag) => (
        <span key={tag}>{t(`portfolio.work.tags.${tag}`)}</span>
      ))}
    </div>
  );
};

export const Tags = Object.freeze({
  WEB: "WEB",
  SOFTWARE: "SOFTWARE",
  C: "C",
  PYTHON: "PYTHON",
  JAVA: "JAVA",
  JSTS: "JSTS",
  VIDEOGAME: "VIDEOGAME",
  MULTIPLAYER: "MULTIPLAYER",
  THREEDIMENSIONAL: "THREEDIMENSIONAL",
  TWODIMENSIONAL: "TWODIMENSIONAL",
  RPG: "RPG",
  SHOOTER: "SHOOTER",
  ARCADE: "ARCADE",
  PLATFORMER: "PLATFORMER",
  MAZES: "MAZES",
} as const);
