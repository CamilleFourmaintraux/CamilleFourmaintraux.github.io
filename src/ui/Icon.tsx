import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

type Props = {
  icon: IconDefinition;
  className?: string;
  /** Only for icons that carry meaning on their own. */
  label?: string;
};

// Inline SVG drawn from the Font Awesome path data: no icon font to download.
export default function Icon({ icon, className, label }: Props) {
  const [width, height, , , path] = icon.icon;
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      viewBox={`0 0 ${width} ${height}`}
      focusable="false"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={Array.isArray(path) ? path.join(" ") : path} />
    </svg>
  );
}
