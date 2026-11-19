import { useTranslation } from "react-i18next";

/** Status message read by screen readers (see the live region of the page). */
export function announce(message: string) {
  window.dispatchEvent(new CustomEvent("cvgen:announce", { detail: message }));
}

/** Moves the focus once React has rendered the element. */
export function focusSoon(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

/** Keeps the focus on the arrow that moved the element, or the other one at an end. */
export function focusMoved(
  idBase: string,
  position: number,
  count: number,
  delta: number,
) {
  const up = position > 0;
  const down = position < count - 1;
  const direction = delta < 0 ? (up ? "up" : "down") : down ? "down" : "up";
  focusSoon(`${idBase}-${direction}`);
}

export function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Generic list helpers: the callbacks announce the change and move the
 * focus where a keyboard user expects it.
 */
export function useListActions<T extends { id: string }>(
  list: T[],
  onChange: (next: T[]) => void,
  options: { firstFieldId: (element: T) => string; addButtonId: string },
) {
  const { t } = useTranslation();
  return {
    add(element: T) {
      onChange([...list, element]);
      announce(t("cvgen.status.added"));
      focusSoon(options.firstFieldId(element));
    },
    remove(index: number) {
      onChange(list.filter((_, position) => position !== index));
      announce(t("cvgen.status.removed"));
      focusSoon(options.addButtonId);
    },
    move(index: number, delta: number, idBase: string) {
      const next = move(list, index, delta);
      if (next === list) return;
      onChange(next);
      announce(
        t("cvgen.status.moved", {
          position: index + delta + 1,
          count: list.length,
        }),
      );
      focusMoved(idBase, index + delta, list.length, delta);
    },
    update(index: number, element: T) {
      onChange(
        list.map((current, position) =>
          position === index ? element : current,
        ),
      );
    },
  };
}
