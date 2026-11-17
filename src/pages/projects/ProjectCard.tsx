import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { faChevronDown, faCubes } from "@fortawesome/free-solid-svg-icons";
import ExternalLink from "@/ui/ExternalLink";
import Icon from "@/ui/Icon";
import Figure, { Picture } from "@/ui/Media";
import type { Block, Bullet, Project, Tag } from "./types";

const dateLocale = (language: string) =>
  language.startsWith("fr") ? "fr-FR" : "en-GB";

/** "sae401" -> "SAÉ 401", nothing for the other projects. */
function saeLabel(id: string): string | null {
  const match = /^sae(\d{3})$/.exec(id);
  return match ? `SAÉ ${match[1]}` : null;
}

function Bullets({ bullets, plain }: { bullets: Bullet[]; plain?: boolean }) {
  const { t } = useTranslation();
  const items: (string | [string, string])[] = plain
    ? (t(bullets[0] as string, { returnObjects: true }) as string[])
    : bullets;
  return (
    <ul className={plain ? "project-bullets is-inline" : "project-bullets"}>
      {items.map((item) =>
        typeof item === "string" ? (
          <li key={item}>{plain ? item : t(item)}</li>
        ) : (
          <li key={item[0]}>
            <strong>{t(item[0])}</strong>
            {t(item[1])}
          </li>
        ),
      )}
    </ul>
  );
}

function ProjectBlock({ block }: { block: Block }) {
  const { t } = useTranslation();
  switch (block.kind) {
    case "section":
      return (
        <div
          className={
            block.image ? "project-section has-figure" : "project-section"
          }
        >
          <div className="project-section-text">
            {block.title && <h4>{t(block.title)}</h4>}
            {block.text && <p>{t(block.text)}</p>}
            {block.bullets && <Bullets bullets={block.bullets} />}
          </div>
          {block.image && (
            <Figure
              src={block.image.src}
              alt={t(block.image.alt)}
              sizes="(min-width: 64rem) 30rem, 90vw"
            />
          )}
        </div>
      );
    case "text":
      return <p className="project-text">{t(block.text)}</p>;
    case "list":
      return (
        <div className="project-list">
          {block.title && <h4>{t(block.title)}</h4>}
          <Bullets bullets={block.bullets} plain={block.plain} />
        </div>
      );
    case "link":
      return (
        <p className="project-link">
          {block.prefix && <>{t(block.prefix)} </>}
          {block.href.startsWith("/") ? (
            <Link to={block.href}>{t(block.label)}</Link>
          ) : (
            <ExternalLink href={block.href}>{t(block.label)}</ExternalLink>
          )}
        </p>
      );
  }
}

type Props = {
  project: Project;
  activeTag: Tag | "";
  defaultOpen?: boolean;
};

export default function ProjectCard({
  project,
  activeTag,
  defaultOpen = false,
}: Props) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  // Details (and their pictures) are only created once they are asked for.
  const [rendered, setRendered] = useState(defaultOpen);
  const panelId = useId();
  const title = t(project.title);
  const kicker = saeLabel(project.id);
  const cover = project.blocks.find(
    (block) => block.kind === "section" && block.image,
  ) as Extract<Block, { kind: "section" }> | undefined;
  const format = (date: Date) =>
    date.toLocaleDateString(dateLocale(i18n.language));
  const inProgress = project.end > new Date();

  const toggle = () => {
    setRendered(true);
    setOpen((value) => !value);
  };

  return (
    <article className={open ? "project is-open" : "project"} id={project.id}>
      <div className="project-head">
        <div className="project-cover" aria-hidden="true">
          {cover?.image ? (
            <Picture src={cover.image.src} alt="" sizes="9rem" />
          ) : (
            <Icon icon={faCubes} />
          )}
        </div>
        <div className="project-summary">
          {kicker && <p className="project-kicker">{kicker}</p>}
          <h3>
            <button
              type="button"
              className="project-toggle"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={toggle}
            >
              {title}
            </button>
          </h3>
          <p className="project-period">
            <span className="sr-only">{t("portfolio.period")}</span>
            <time dateTime={isoDate(project.start)}>
              {format(project.start)}
            </time>
            {" - "}
            <time dateTime={isoDate(project.end)}>{format(project.end)}</time>
            {inProgress && (
              <span className="badge">{t("portfolio.in_progress")}</span>
            )}
          </p>
          {project.tags.length > 0 && (
            <ul className="tag-list">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className={tag === activeTag ? "tag is-active" : "tag"}
                >
                  {t(`portfolio.tags.${tag}`)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <span className="project-chevron" aria-hidden="true">
          <Icon icon={faChevronDown} />
        </span>
      </div>

      <div
        className="project-panel"
        id={panelId}
        hidden={!open && !rendered}
        inert={!open}
      >
        <div className="project-panel-inner">
          {rendered && (
            <div className="project-details">
              {project.blocks.map((block, index) => (
                <ProjectBlock key={index} block={block} />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
