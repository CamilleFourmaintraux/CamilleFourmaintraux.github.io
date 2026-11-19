import {
  forwardRef,
  Fragment,
  type CSSProperties,
  type ReactNode,
} from "react";
import Icon from "@/ui/Icon";
import { sidebarTextColor } from "./colors";
import { ICONS } from "./icons";
import { parseInline, plainText } from "./inline";
import { displayUrl, qrLinkOf } from "./links";
import type { Column, CvDocument, Section } from "./model";
import QrCode from "./QrCode";

function Rich({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map(({ text: part, style }, index) => {
        if (style === "bold") return <strong key={index}>{part}</strong>;
        if (style === "italic") return <em key={index}>{part}</em>;
        if (style === "sup") return <sup key={index}>{part}</sup>;
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

function Lines({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={index}>
          {index > 0 && <br />}
          <Rich text={line} />
        </Fragment>
      ))}
    </>
  );
}

const hasText = (text: string) => plainText(text).trim().length > 0;

/** Content of a section, or null when it has nothing to show (as in LaTeX). */
function sectionBody(section: Section, language: string): ReactNode {
  switch (section.kind) {
    case "text": {
      const paragraphs = section.body
        .split(/\n\s*\n/)
        .map((part) => part.trim())
        .filter(hasText);
      if (!paragraphs.length) return null;
      return paragraphs.map((part, index) => (
        <p key={index} className="cv-paragraph">
          <Rich text={part.replace(/\n/g, " ")} />
        </p>
      ));
    }
    case "entries": {
      const entries = section.entries.filter(
        (entry) =>
          hasText(entry.title) ||
          hasText(entry.text) ||
          hasText(entry.tools) ||
          hasText(entry.subtitle) ||
          entry.details.some((detail) => hasText(detail.text)),
      );
      if (!entries.length) return null;
      const List = section.numbered ? "ol" : "ul";
      return (
        <List className="cv-entries">
          {entries.map((entry) => {
            const details = entry.details.filter((detail) =>
              hasText(detail.text),
            );
            const head =
              hasText(entry.title) ||
              hasText(entry.text) ||
              hasText(entry.tools);
            return (
              <li key={entry.id}>
                {hasText(entry.title) && (
                  <strong>
                    <Rich text={entry.title} />
                  </strong>
                )}
                {hasText(entry.text) && (
                  <>
                    {" "}
                    <Rich text={entry.text} />
                  </>
                )}
                {hasText(entry.tools) && (
                  <>
                    {" "}
                    <em>
                      (<Rich text={entry.tools} />)
                    </em>
                  </>
                )}
                {hasText(entry.subtitle) && (
                  <>
                    {head && <br />}
                    <em>
                      <Rich text={entry.subtitle} />
                    </em>
                  </>
                )}
                {details.length > 0 && (
                  <ul className="cv-details">
                    {details.map((detail) => (
                      <li key={detail.id}>
                        <Rich text={detail.text} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </List>
      );
    }
    case "skills": {
      const groups = section.groups.filter((group) => hasText(group.items));
      if (!groups.length) return null;
      return groups.map((group) => (
        <div key={group.id} className="cv-skill">
          {hasText(group.name) && (
            <p className="cv-skill-name">
              <Rich text={group.name} />
            </p>
          )}
          <p className="cv-indent">
            <Lines text={group.items} />
          </p>
        </div>
      ));
    }
    case "list": {
      const items = section.items
        .map((item) => item.text.trim())
        .filter(hasText);
      if (!items.length) return null;
      return (
        <p className="cv-indent">
          {items.map((text, index) => (
            <Fragment key={index}>
              {index > 0 && ", "}
              <Rich text={text} />
            </Fragment>
          ))}
        </p>
      );
    }
    case "contact": {
      const lines = section.lines.filter((line) => line.value.trim());
      if (!lines.length) return null;
      const separator = language === "fr" ? " : " : ": ";
      return lines.map((line) => {
        const linked = Boolean(line.href.trim()) || line.icon === "email";
        return (
          <div key={line.id} className="cv-contact">
            <span className="cv-contact-icon">
              <Icon icon={ICONS[line.icon]} />
              <span className="sr-only">
                {(line.label.trim() || line.icon) + separator}
              </span>
            </span>
            <span className={linked ? "cv-link" : undefined}>
              <Lines text={line.value} />
            </span>
          </div>
        );
      });
    }
    case "portfolio": {
      const url = section.url.trim();
      const description = hasText(section.description);
      if (!description && !url) return null;
      return (
        <div className="cv-portfolio">
          {(description || (url && !section.qr)) && (
            <p className="cv-indent">
              {description && <Rich text={section.description} />}
              {url && !section.qr && (
                <>
                  {description && <br />}
                  <span className="cv-link">{displayUrl(url)}</span>
                </>
              )}
            </p>
          )}
          {url && section.qr && (
            <QrCode value={qrLinkOf(url)} className="cv-qr" />
          )}
        </div>
      );
    }
  }
}

function ColumnContent({ cv, column }: { cv: CvDocument; column: Column }) {
  return (
    <>
      {cv.sections
        .filter((section) => section.visible && section.column === column)
        .map((section) => {
          const content = sectionBody(section, cv.language);
          if (content === null) return null;
          return (
            <div key={section.id} className="cv-section">
              {section.title.trim() && (
                <p className="cv-section-title">{section.title}</p>
              )}
              {content}
            </div>
          );
        })}
    </>
  );
}

type Props = { cv: CvDocument; photo: string | null };

/** HTML version of the CV, laid out like the A4 page produced by LaTeX. */
const Preview = forwardRef<HTMLDivElement, Props>(function Preview(
  { cv, photo },
  ref,
) {
  const style = {
    "--cv-side-bg": cv.layout.sidebarColor,
    "--cv-side-text": sidebarTextColor(cv.layout.sidebarColor),
    "--cv-accent": cv.layout.accentColor,
    "--cv-side-ratio": cv.layout.sidebarWidth / 100,
  } as CSSProperties;

  const main = (
    <div className="cv-main">
      {cv.name.trim() && <p className="cv-name">{cv.name}</p>}
      {cv.name.trim() && <span className="cv-name-rule" />}
      {cv.headline.trim() && <p className="cv-headline">{cv.headline}</p>}
      <ColumnContent cv={cv} column="main" />
    </div>
  );
  const side = (
    <div className="cv-side">
      {cv.photo && photo && (
        <img
          className={`cv-photo is-${cv.photo.shape}`}
          src={photo}
          alt=""
          width={600}
          height={600}
        />
      )}
      <ColumnContent cv={cv} column="side" />
    </div>
  );

  return (
    <div
      ref={ref}
      className="cv-paper"
      data-sidebar={cv.layout.sidebar}
      data-dark-side={sidebarTextColor(cv.layout.sidebarColor) === "#ffffff"}
      lang={cv.language}
      style={style}
    >
      <div className="cv-columns">
        {cv.layout.sidebar === "left" ? side : main}
        {cv.layout.sidebar === "left" ? main : side}
      </div>
    </div>
  );
});

export default Preview;
