import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  faChevronLeft,
  faChevronRight,
  faCode,
  faGamepad,
  faScrewdriverWrench,
  faSquareCheck,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import Dialog from "@/ui/Dialog";
import Icon from "@/ui/Icon";
import { Picture } from "@/ui/Media";
import { Section } from "@/ui/Page";

type Course = {
  key: string;
  // Logo in public/img/cursus/competences. Without one, the card shows the
  // icon and the title instead.
  picture?: string;
  icon?: IconDefinition;
};

const COURSES: Course[] = [
  { key: "ocaml", icon: faCode },
  { key: "rocq", icon: faSquareCheck },
  { key: "gameengine", icon: faGamepad },
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

// The labels end with a colon in the translations ("Langues :").
const withoutColon = (label: string) => label.replace(/\s*:\s*$/, "");

export default function Skills() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Course | null>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  const scroll = (direction: 1 | -1) => {
    const track = trackRef.current;
    track?.scrollBy({ left: direction * track.clientWidth * 0.8 });
  };

  return (
    <Section
      id="competences"
      title={t("skills.title")}
      icon={faScrewdriverWrench}
    >
      <dl className="skill-list">
        {SKILLS.map((skill) => (
          <div key={skill} className="skill">
            <dt>{withoutColon(t(`skills.${skill}`))}</dt>
            <dd>{t(`skills.${skill}_value`)}</dd>
          </div>
        ))}
      </dl>

      <div className="carousel">
        <ul className="carousel-track" ref={trackRef} tabIndex={-1}>
          {COURSES.map((course) => {
            const title = t(`courses.${course.key}_title`);
            return (
              <li key={course.key}>
                <button
                  type="button"
                  className="course-card"
                  onClick={() => setSelected(course)}
                  aria-haspopup="dialog"
                >
                  {course.picture ? (
                    <>
                      <Picture
                        src={`cursus/competences/${course.picture}.png`}
                        alt=""
                        sizes="12rem"
                      />
                      <span className="sr-only">{title}</span>
                    </>
                  ) : (
                    <>
                      {course.icon && <Icon icon={course.icon} />}
                      <span>{title}</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="carousel-controls">
          <button
            type="button"
            className="icon-button"
            onClick={() => scroll(-1)}
            aria-label={t("ui.scrollLeft")}
            title={t("ui.scrollLeft")}
          >
            <Icon icon={faChevronLeft} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => scroll(1)}
            aria-label={t("ui.scrollRight")}
            title={t("ui.scrollRight")}
          >
            <Icon icon={faChevronRight} />
          </button>
        </div>
      </div>

      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? t(`courses.${selected.key}_title`) : ""}
      >
        {selected && <p>{t(`courses.${selected.key}_desc`)}</p>}
      </Dialog>
    </Section>
  );
}
