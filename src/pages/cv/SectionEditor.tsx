import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  faArrowDown,
  faArrowUp,
  faChevronRight,
  faEye,
  faEyeSlash,
  faRightLeft,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "@/ui/Icon";
import { AddButton, Field, ItemList, ItemTools } from "./controls";
import { useListActions } from "./listActions";
import { qrLinkOf } from "./links";
import {
  ICON_KEYS,
  ICON_LABELS,
  contactLine,
  entry,
  skillGroup,
  type ContactSection,
  type CvLanguage,
  type EntriesSection,
  type Entry,
  type EntryVariant,
  type PortfolioSection,
  type Section,
  type SkillsSection,
} from "./model";

type EntryField = "title" | "text" | "tools" | "subtitle";

const VARIANT_FIELDS: Record<EntryVariant, EntryField[]> = {
  experience: ["title", "subtitle"],
  projects: ["title", "tools"],
  education: ["title", "text"],
  generic: ["title", "text", "tools", "subtitle"],
};

function EntryEditor({
  section,
  entry: current,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  section: EntriesSection;
  entry: Entry;
  index: number;
  count: number;
  onChange: (entry: Entry) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const variant = section.variant;
  const base = `cv-${section.id}-${current.id}`;
  const name = `${t(`cvgen.entries.name.${variant}`)} ${index + 1}`;
  // Fields of another variant stay visible as long as they hold text.
  const fields = (
    ["title", "text", "tools", "subtitle"] as EntryField[]
  ).filter(
    (field) => VARIANT_FIELDS[variant].includes(field) || current[field].trim(),
  );
  return (
    <li className="cvgen-card">
      <div className="cvgen-card-head">
        <h4>{name}</h4>
        <ItemTools
          idBase={base}
          name={name}
          index={index}
          count={count}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>
      {fields.map((field) => (
        <Field
          key={field}
          id={`${base}-${field}`}
          label={t(`cvgen.entries.fields.${variant}.${field}`)}
          value={current[field]}
          multiline={field === "text" || field === "subtitle"}
          rows={field === "text" || field === "subtitle" ? 2 : undefined}
          onChange={(value) => onChange({ ...current, [field]: value })}
        />
      ))}
      <div
        className="cvgen-sublist"
        role="group"
        aria-labelledby={`${base}-details-title`}
      >
        <p className="cvgen-sublist-title" id={`${base}-details-title`}>
          {t(`cvgen.entries.fields.${variant}.details`)}
        </p>
        <ItemList
          id={`${base}-details`}
          items={current.details}
          onChange={(details) => onChange({ ...current, details })}
          name={t(`cvgen.entries.detail.${variant}`)}
          addLabel={t(`cvgen.entries.addDetail.${variant}`)}
          multiline
        />
      </div>
    </li>
  );
}

function EntriesEditor({
  section,
  onChange,
}: {
  section: EntriesSection;
  onChange: (section: Section) => void;
}) {
  const { t } = useTranslation();
  const addButtonId = `cv-${section.id}-add`;
  const actions = useListActions(
    section.entries,
    (entries) => onChange({ ...section, entries }),
    {
      firstFieldId: (element) => `cv-${section.id}-${element.id}-title`,
      addButtonId,
    },
  );
  return (
    <>
      <label className="cvgen-check">
        <input
          type="checkbox"
          checked={section.numbered}
          onChange={(event) =>
            onChange({ ...section, numbered: event.target.checked })
          }
        />
        {t("cvgen.entries.numbered")}
      </label>
      {section.entries.length > 0 && (
        <ol className="cvgen-items">
          {section.entries.map((element, index) => (
            <EntryEditor
              key={element.id}
              section={section}
              entry={element}
              index={index}
              count={section.entries.length}
              onChange={(next) => actions.update(index, next)}
              onMove={(delta) =>
                actions.move(index, delta, `cv-${section.id}-${element.id}`)
              }
              onRemove={() => actions.remove(index)}
            />
          ))}
        </ol>
      )}
      <AddButton
        id={addButtonId}
        label={t(`cvgen.entries.add.${section.variant}`)}
        onClick={() => actions.add(entry())}
      />
    </>
  );
}

function SkillsEditor({
  section,
  onChange,
}: {
  section: SkillsSection;
  onChange: (section: Section) => void;
}) {
  const { t } = useTranslation();
  const addButtonId = `cv-${section.id}-add`;
  const actions = useListActions(
    section.groups,
    (groups) => onChange({ ...section, groups }),
    {
      firstFieldId: (group) => `cv-${section.id}-${group.id}-name`,
      addButtonId,
    },
  );
  return (
    <>
      {section.groups.length > 0 && (
        <ol className="cvgen-items">
          {section.groups.map((group, index) => {
            const base = `cv-${section.id}-${group.id}`;
            const name = t("cvgen.skills.group", { n: index + 1 });
            return (
              <li key={group.id} className="cvgen-card">
                <div className="cvgen-card-head">
                  <h4>{name}</h4>
                  <ItemTools
                    idBase={base}
                    name={name}
                    index={index}
                    count={section.groups.length}
                    onMove={(delta) => actions.move(index, delta, base)}
                    onRemove={() => actions.remove(index)}
                  />
                </div>
                <Field
                  id={`${base}-name`}
                  label={t("cvgen.skills.name")}
                  value={group.name}
                  onChange={(value) =>
                    actions.update(index, { ...group, name: value })
                  }
                />
                <Field
                  id={`${base}-items`}
                  label={t("cvgen.skills.items")}
                  hint={t("cvgen.skills.itemsHint")}
                  value={group.items}
                  multiline
                  onChange={(value) =>
                    actions.update(index, { ...group, items: value })
                  }
                />
              </li>
            );
          })}
        </ol>
      )}
      <AddButton
        id={addButtonId}
        label={t("cvgen.skills.add")}
        onClick={() => actions.add(skillGroup())}
      />
    </>
  );
}

function ContactEditor({
  section,
  language,
  onChange,
}: {
  section: ContactSection;
  language: CvLanguage;
  onChange: (section: Section) => void;
}) {
  const { t } = useTranslation();
  const addButtonId = `cv-${section.id}-add`;
  const actions = useListActions(
    section.lines,
    (lines) => onChange({ ...section, lines }),
    {
      firstFieldId: (line) => `cv-${section.id}-${line.id}-icon`,
      addButtonId,
    },
  );
  return (
    <>
      {section.lines.length > 0 && (
        <ol className="cvgen-items">
          {section.lines.map((line, index) => {
            const base = `cv-${section.id}-${line.id}`;
            const name = t("cvgen.contact.line", { n: index + 1 });
            return (
              <li key={line.id} className="cvgen-card">
                <div className="cvgen-card-head">
                  <h4>{line.label.trim() || name}</h4>
                  <ItemTools
                    idBase={base}
                    name={line.label.trim() || name}
                    index={index}
                    count={section.lines.length}
                    onMove={(delta) => actions.move(index, delta, base)}
                    onRemove={() => actions.remove(index)}
                  />
                </div>
                <div className="cvgen-row">
                  <div className="field">
                    <label htmlFor={`${base}-icon`}>
                      {t("cvgen.contact.icon")}
                    </label>
                    <select
                      id={`${base}-icon`}
                      value={line.icon}
                      onChange={(event) => {
                        const icon = event.target.value as typeof line.icon;
                        // The parser label follows the icon while it is still a default one.
                        const defaults = Object.values(ICON_LABELS).flatMap(
                          (labels) => Object.values(labels),
                        );
                        const label =
                          !line.label.trim() ||
                          defaults.includes(line.label.trim())
                            ? ICON_LABELS[icon][language]
                            : line.label;
                        actions.update(index, { ...line, icon, label });
                      }}
                    >
                      {ICON_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {t(`cvgen.contact.icons.${key}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Field
                    id={`${base}-label`}
                    label={t("cvgen.contact.label")}
                    hint={t("cvgen.contact.labelHint")}
                    value={line.label}
                    onChange={(value) =>
                      actions.update(index, { ...line, label: value })
                    }
                  />
                </div>
                <Field
                  id={`${base}-value`}
                  label={t("cvgen.contact.value")}
                  value={line.value}
                  multiline={
                    line.icon === "address" || line.value.includes("\n")
                  }
                  onChange={(value) =>
                    actions.update(index, { ...line, value })
                  }
                />
                <Field
                  id={`${base}-href`}
                  label={t("cvgen.contact.href")}
                  hint={
                    line.icon === "email"
                      ? t("cvgen.contact.emailHint")
                      : undefined
                  }
                  type="url"
                  value={line.href}
                  onChange={(value) =>
                    actions.update(index, { ...line, href: value })
                  }
                />
              </li>
            );
          })}
        </ol>
      )}
      <AddButton
        id={addButtonId}
        label={t("cvgen.contact.add")}
        onClick={() =>
          actions.add(contactLine("link", ICON_LABELS.link[language]))
        }
      />
    </>
  );
}

function PortfolioEditor({
  section,
  onChange,
}: {
  section: PortfolioSection;
  onChange: (section: Section) => void;
}) {
  const { t } = useTranslation();
  const base = `cv-${section.id}`;
  const qrLink = qrLinkOf(section.url.trim());
  return (
    <>
      <Field
        id={`${base}-description`}
        label={t("cvgen.portfolio.description")}
        value={section.description}
        multiline
        onChange={(description) => onChange({ ...section, description })}
      />
      <Field
        id={`${base}-url`}
        label={t("cvgen.portfolio.url")}
        type="url"
        value={section.url}
        onChange={(url) => onChange({ ...section, url })}
      />
      <label className="cvgen-check">
        <input
          type="checkbox"
          checked={section.qr}
          onChange={(event) =>
            onChange({ ...section, qr: event.target.checked })
          }
        />
        {t("cvgen.portfolio.qr")}
      </label>
      {section.qr && section.url.trim() && (
        <p className="cvgen-hint">
          {t("cvgen.portfolio.qrLink")}{" "}
          <span className="cvgen-url">{qrLink}</span>
          <br />
          {t("cvgen.portfolio.qrHint")}
        </p>
      )}
    </>
  );
}

/** Stable callbacks of the page, so that editing one section leaves the others alone. */
export type SectionActions = {
  update: (section: Section) => void;
  move: (id: string, delta: number) => void;
  switchColumn: (id: string) => void;
  remove: (id: string) => void;
};

type Props = {
  section: Section;
  index: number;
  count: number;
  language: CvLanguage;
  defaultOpen?: boolean;
  actions: SectionActions;
};

function SectionEditor({
  section,
  index,
  count,
  language,
  defaultOpen = false,
  actions,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const onChange = actions.update;
  const onMove = (delta: number) => actions.move(section.id, delta);
  const onSwitchColumn = () => actions.switchColumn(section.id);
  const onRemove = () => actions.remove(section.id);
  const base = `cv-${section.id}`;
  const title = section.title.trim() || t("cvgen.section.untitled");
  const toOther = section.column === "main" ? "toSide" : "toMain";

  return (
    <li
      className={section.visible ? "cvgen-section" : "cvgen-section is-hidden"}
    >
      <div className="cvgen-section-head">
        <button
          type="button"
          id={`${base}-toggle`}
          className="cvgen-section-toggle"
          aria-expanded={open}
          aria-controls={`${base}-body`}
          onClick={() => setOpen(!open)}
        >
          <Icon icon={faChevronRight} />
          <span className="cvgen-section-name">{title}</span>
          <span className="cvgen-section-kind">
            {t(`cvgen.sections.kinds.${section.kind}`)}
            {!section.visible && `, ${t("cvgen.section.hiddenBadge")}`}
          </span>
        </button>
        <div className="cvgen-tools">
          <button
            type="button"
            id={`${base}-up`}
            className="cvgen-tool"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={t("cvgen.section.moveUp", { title })}
            title={t("cvgen.section.moveUp", { title })}
          >
            <Icon icon={faArrowUp} />
          </button>
          <button
            type="button"
            id={`${base}-down`}
            className="cvgen-tool"
            onClick={() => onMove(1)}
            disabled={index === count - 1}
            aria-label={t("cvgen.section.moveDown", { title })}
            title={t("cvgen.section.moveDown", { title })}
          >
            <Icon icon={faArrowDown} />
          </button>
          <button
            type="button"
            id={`${base}-column`}
            className="cvgen-tool"
            onClick={onSwitchColumn}
            aria-label={t(`cvgen.section.${toOther}`, { title })}
            title={t(`cvgen.section.${toOther}`, { title })}
          >
            <Icon icon={faRightLeft} />
          </button>
          <button
            type="button"
            className="cvgen-tool"
            onClick={() => onChange({ ...section, visible: !section.visible })}
            aria-pressed={!section.visible}
            aria-label={t("cvgen.section.hide", { title })}
            title={t(
              section.visible ? "cvgen.section.hide" : "cvgen.section.show",
              { title },
            )}
          >
            <Icon icon={section.visible ? faEye : faEyeSlash} />
          </button>
          <button
            type="button"
            className="cvgen-tool is-danger"
            onClick={onRemove}
            aria-label={t("cvgen.section.remove", { title })}
            title={t("cvgen.section.remove", { title })}
          >
            <Icon icon={faTrashCan} />
          </button>
        </div>
      </div>

      <div className="cvgen-section-body" id={`${base}-body`} hidden={!open}>
        {open && (
          <>
            <Field
              id={`${base}-title`}
              label={t("cvgen.section.titleField")}
              value={section.title}
              onChange={(value) => onChange({ ...section, title: value })}
            />
            {section.kind === "text" && (
              <Field
                id={`${base}-body-text`}
                label={t("cvgen.text.body")}
                hint={t("cvgen.text.hint")}
                value={section.body}
                multiline
                rows={6}
                onChange={(body) => onChange({ ...section, body })}
              />
            )}
            {section.kind === "entries" && (
              <EntriesEditor section={section} onChange={onChange} />
            )}
            {section.kind === "skills" && (
              <SkillsEditor section={section} onChange={onChange} />
            )}
            {section.kind === "list" && (
              <>
                <p className="cvgen-hint">{t("cvgen.list.hint")}</p>
                <ItemList
                  id={`${base}-items`}
                  items={section.items}
                  onChange={(items) => onChange({ ...section, items })}
                  name={t("cvgen.list.item")}
                  addLabel={t("cvgen.list.add")}
                />
              </>
            )}
            {section.kind === "contact" && (
              <ContactEditor
                section={section}
                language={language}
                onChange={onChange}
              />
            )}
            {section.kind === "portfolio" && (
              <PortfolioEditor section={section} onChange={onChange} />
            )}
          </>
        )}
      </div>
    </li>
  );
}

// Only the edited section renders again while typing.
export default memo(SectionEditor);
