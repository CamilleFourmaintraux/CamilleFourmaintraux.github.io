import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  download?: boolean;
};

/** Link to a PDF of /files, opened in a new tab and announced as such. */
export default function PdfLink({
  href,
  children,
  className,
  download,
}: Props) {
  const { t } = useTranslation();
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener"
      download={download}
    >
      {children}
      {" "}
      <Icon icon={faFilePdf} className="icon-external" />
      <span className="sr-only"> (PDF, {t("ui.newTab")})</span>
    </a>
  );
}
