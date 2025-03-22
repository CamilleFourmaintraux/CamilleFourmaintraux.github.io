import { useTranslation } from "react-i18next";

const tagsWork = [
  "SCRUM",
  "WEB",
  "REACT",
  "FRONTEND",
  "BACKEND",
  "DB",
  "SPRING",
  "APIREST",
  "INTERNSHIP",
  "INTEGRATION",
  "JSP",
  "SYSTEMS",
  "C",
  "RUST",
  "PYTHON",
  "JAVA",
  "JSTS",
  "VIDEOGAME",
];

export const TagListWork: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      {tagsWork.map((tag) => (
        <span key={tag}>{t(`portfolio.work.tags.${tag}`)}</span>
      ))}
    </div>
  );
};

export const Tags = Object.freeze({
  SCRUM: "SCRUM",
  WEB: "WEB",
  REACT: "REACT",
  FRONTEND: "FRONTEND",
  BACKEND: "BACKEND",
  DB: "DB",
  SPRING: "SPRING",
  APIREST: "APIREST",
  INTERNSHIP: "INTERNSHIP",
  INTEGRATION: "INTEGRATION",
  JSP: "JSP",
  SYSTEMS: "SYSTEMS",
  C: "C",
  RUST: "RUST",
  PYTHON: "PYTHON",
  JAVA: "JAVA",
  JSTS: "JSTS",
  VIDEOGAME: "VIDEOGAME",
} as const);
