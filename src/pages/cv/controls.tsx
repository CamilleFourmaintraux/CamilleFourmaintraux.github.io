// Small form pieces of the CV generator.
import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  faArrowDown,
  faArrowUp,
  faPlus,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "@/ui/Icon";
import { useListActions } from "./listActions";
import { isHexColor } from "./colors";
import { item, type Item } from "./model";

type FieldProps = {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  /** Extra attributes and handlers for a single-line field. */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

export function Field({
  id,
  label,
  value,
  onChange,
  hint,
  multiline,
  rows,
  type = "text",
  autoComplete = "off",
  placeholder,
  inputProps,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const common = {
    id,
    value,
    placeholder,
    "aria-describedby": hintId,
    spellCheck: true,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea
          rows={rows ?? Math.min(8, Math.max(2, value.split("\n").length + 1))}
          {...common}
        />
      ) : (
        <input
          type={type}
          autoComplete={autoComplete}
          {...inputProps}
          {...common}
        />
      )}
      {hint && (
        <p className="cvgen-hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}

type ToolsProps = {
  /** Base of the button ids, used to keep the focus on a moved element. */
  idBase: string;
  name: string;
  index: number;
  count: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
  children?: ReactNode;
};

/** Up, down and remove buttons of an element of a list. */
export function ItemTools({
  idBase,
  name,
  index,
  count,
  onMove,
  onRemove,
  children,
}: ToolsProps) {
  const { t } = useTranslation();
  return (
    <div className="cvgen-tools">
      {children}
      <button
        type="button"
        id={`${idBase}-up`}
        className="cvgen-tool"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label={t("cvgen.item.moveUp", { name })}
        title={t("cvgen.item.moveUp", { name })}
      >
        <Icon icon={faArrowUp} />
      </button>
      <button
        type="button"
        id={`${idBase}-down`}
        className="cvgen-tool"
        onClick={() => onMove(1)}
        disabled={index === count - 1}
        aria-label={t("cvgen.item.moveDown", { name })}
        title={t("cvgen.item.moveDown", { name })}
      >
        <Icon icon={faArrowDown} />
      </button>
      <button
        type="button"
        className="cvgen-tool is-danger"
        onClick={onRemove}
        aria-label={t("cvgen.item.remove", { name })}
        title={t("cvgen.item.remove", { name })}
      >
        <Icon icon={faTrashCan} />
      </button>
    </div>
  );
}

export function AddButton({
  id,
  label,
  onClick,
}: {
  id: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      id={id}
      className="button button-small cvgen-add"
      onClick={onClick}
    >
      <Icon icon={faPlus} />
      {label}
    </button>
  );
}

type ItemListProps = {
  /** Base of the element ids. */
  id: string;
  items: Item[];
  onChange: (items: Item[]) => void;
  /** Name of one element, numbered: "Mission" gives "Mission 1". */
  name: string;
  addLabel: string;
  multiline?: boolean;
};

/** Editable list of lines of text. */
export function ItemList({
  id,
  items,
  onChange,
  name,
  addLabel,
  multiline,
}: ItemListProps) {
  const addButtonId = `${id}-add`;
  const actions = useListActions(items, onChange, {
    firstFieldId: (element) => `${id}-${element.id}`,
    addButtonId,
  });
  return (
    <>
      {items.length > 0 && (
        <ul className="cvgen-items">
          {items.map((element, index) => {
            const label = `${name} ${index + 1}`;
            return (
              <li key={element.id} className="cvgen-item">
                <Field
                  id={`${id}-${element.id}`}
                  label={label}
                  value={element.text}
                  multiline={multiline}
                  rows={multiline ? 2 : undefined}
                  onChange={(text) =>
                    actions.update(index, { ...element, text })
                  }
                />
                <ItemTools
                  idBase={`${id}-${element.id}`}
                  name={label}
                  index={index}
                  count={items.length}
                  onMove={(delta) =>
                    actions.move(index, delta, `${id}-${element.id}`)
                  }
                  onRemove={() => actions.remove(index)}
                />
              </li>
            );
          })}
        </ul>
      )}
      <AddButton
        id={addButtonId}
        label={addLabel}
        onClick={() => actions.add(item())}
      />
    </>
  );
}

type ChoiceProps<T extends string> = {
  legend: string;
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export function Choice<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: ChoiceProps<T>) {
  const groupId = useId();
  return (
    <fieldset className="cvgen-choice">
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={`${name}-${groupId}`}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

type ColorFieldProps = {
  id: string;
  label: string;
  /** Accessible name of the hexadecimal text field. */
  hexLabel: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

/** Color picker with a hexadecimal field. A typed color applies on Enter or
 * when the field loses focus. */
export function ColorField({
  id,
  label,
  hexLabel,
  value,
  onChange,
  disabled,
}: ColorFieldProps) {
  const apply = (input: HTMLInputElement) => {
    const typed = input.value.trim();
    const hex = typed.startsWith("#") ? typed : `#${typed}`;
    if (isHexColor(hex)) onChange(hex.toLowerCase());
    else input.value = value;
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="cvgen-color">
        <input
          type="color"
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          type="text"
          aria-label={hexLabel}
          defaultValue={value}
          key={value}
          maxLength={7}
          spellCheck={false}
          disabled={disabled}
          onBlur={(event) => apply(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === "Enter") apply(event.currentTarget);
          }}
        />
      </div>
    </div>
  );
}
