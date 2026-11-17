import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Course = {
  key: string;
  // Logo in /img/cursus/competences/<picture>.png. Without one, the card shows
  // the icon and the title instead.
  picture?: string;
  icon?: string;
};

const COURSES: Course[] = [
  { key: "ocaml", icon: "fa-solid fa-code" },
  { key: "rocq", icon: "fa-solid fa-square-check" },
  { key: "gameengine", icon: "fa-solid fa-gamepad" },
  { key: "springboot", picture: "spring-boot" },
  { key: "math", picture: "modelisation-mathematique" },
  { key: "nosql", picture: "mongodb" },
  { key: "react", picture: "react" },
  { key: "quality", picture: "qualite-de-code" },
  { key: "ci", picture: "cicd" },
  { key: "postman", picture: "postman" },
  { key: "multimedia", picture: "programmation-multimedia" },
  { key: "tools", picture: "git" },
  { key: "softwareag", picture: "software-ag-designer" },
  { key: "toeic", picture: "certification-toeic" },
];

const SKILLS = [
  "language",
  "programming",
  "frontend",
  "backend",
  "sql",
  "nosql",
  "api",
  "formal",
  "games",
  "tools",
  "collab",
  "ci",
  "scrum",
  "quality",
  "math",
  "media",
];

export default function Skills() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const cardContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  const openCard = (index: number) => {
    const container = cardContainerRef.current;
    const card = container?.children[index] as HTMLElement | undefined;
    if (container && card) {
      container.scrollTo({
        left:
          card.offsetLeft - container.offsetWidth / 2 + card.offsetWidth / 2,
        behavior: "smooth",
      });
    }
    setSelected(index);
  };

  const course = selected !== null ? COURSES[selected] : null;

  return (
    <div className="container" id="competences">
      <h2>{t("skills.title")}</h2>
      <ul>
        {SKILLS.map((skill) => (
          <li key={skill}>
            <strong>{t(`skills.${skill}`)}</strong> {t(`skills.${skill}_value`)}
          </li>
        ))}
      </ul>

      <div className="carousel">
        <div className="card-container" ref={cardContainerRef}>
          {COURSES.map((item, index) => {
            const title = t(`courses.${item.key}_title`);
            return (
              <div
                key={item.key}
                className={item.picture ? "card" : "card card-text"}
                role="button"
                tabIndex={0}
                aria-label={title}
                onClick={() => openCard(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openCard(index);
                  }
                }}
              >
                {item.picture ? (
                  <img
                    src={`/img/cursus/competences/${item.picture}.png`}
                    alt={title}
                    className="cardPicture"
                  />
                ) : (
                  <>
                    <i className={item.icon} aria-hidden="true"></i>
                    <span>{title}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {course && (
        <div className="popup open" onClick={() => setSelected(null)}>
          <div
            className="popup-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="skill-popup-title"
          >
            <h2 id="skill-popup-title">{t(`courses.${course.key}_title`)}</h2>
            <p>{t(`courses.${course.key}_desc`)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
