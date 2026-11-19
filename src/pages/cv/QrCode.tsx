import { useMemo } from "react";
import qrcode from "qrcode-generator";

type Props = { value: string; className?: string };

/** QR code drawn as a single SVG path. */
export default function QrCode({ value, className }: Props) {
  const { path, size } = useMemo(() => {
    const code = qrcode(0, "M");
    code.addData(value);
    code.make();
    const count = code.getModuleCount();
    let d = "";
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (code.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { path: d, size: count };
  }, [value]);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}
