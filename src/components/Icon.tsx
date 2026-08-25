import type { CSSProperties } from "react";

// Remix Icon glyph. Pass the icon name without the ri- prefix, e.g. "database-2-fill".
export function Icon({
  name,
  size = 24,
  className = "",
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <i
      aria-hidden="true"
      className={`ri-${name} ${className}`}
      style={{ fontSize: size, lineHeight: 1, verticalAlign: "middle", ...style }}
    />
  );
}

export default Icon;
