import type { AnchorHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  /** Hides the arrow when the link already shows a brand icon. */
  plain?: boolean;
};

// Opens in a new tab and says so, to sighted and screen reader users alike.
export default function ExternalLink({ children, plain, ...props }: Props) {
  const { t } = useTranslation();
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
      {!plain && (
        <>
          {" "}
          <Icon icon={faArrowUpRightFromSquare} className="icon-external" />
        </>
      )}
      <span className="sr-only"> ({t("ui.newTab")})</span>
    </a>
  );
}
