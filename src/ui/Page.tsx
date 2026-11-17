import type { ReactNode } from "react";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";
import MazeCanvas from "./MazeCanvas";
import Reveal from "./Reveal";
import { usePageTitle } from "./usePageTitle";

type PageProps = {
  title: string;
  icon?: IconDefinition;
  lead?: ReactNode;
  children: ReactNode;
};

export default function Page({ title, icon, lead, children }: PageProps) {
  const headingRef = usePageTitle(title);
  return (
    <>
      <header className="page-head">
        <MazeCanvas className="page-head-maze" cell={20} />
        <div className="page-head-inner">
          <h1 ref={headingRef} tabIndex={-1}>
            {icon && <Icon icon={icon} className="page-head-icon" />}
            {title}
          </h1>
          {lead && <div className="page-lead">{lead}</div>}
        </div>
      </header>
      <div className="page-body">{children}</div>
    </>
  );
}

type SectionProps = {
  id?: string;
  title?: ReactNode;
  icon?: IconDefinition;
  /** Title above the content instead of beside it. */
  stacked?: boolean;
  className?: string;
  children: ReactNode;
};

export function Section({
  id,
  title,
  icon,
  stacked,
  className,
  children,
}: SectionProps) {
  const classes = [
    "section",
    (stacked || !title) && "section-stacked",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Reveal as="section" className={classes} id={id}>
      {title && (
        <h2 className="section-title">
          {icon && <Icon icon={icon} className="section-icon" />}
          <span>{title}</span>
        </h2>
      )}
      <div className="section-body">{children}</div>
    </Reveal>
  );
}
