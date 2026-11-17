import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
};

// Native modal dialog: the browser traps the focus, closes on Escape and
// gives the focus back to the element that opened it.
export default function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={className ? `dialog ${className}` : "dialog"}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="dialog-panel">
          <header className="dialog-header">
            <h2 id={titleId}>{title}</h2>
            <button
              type="button"
              className="icon-button"
              onClick={onClose}
              aria-label={t("ui.close")}
              title={t("ui.close")}
            >
              <Icon icon={faXmark} />
            </button>
          </header>
          <div className="dialog-body">{children}</div>
        </div>
      )}
    </dialog>
  );
}
