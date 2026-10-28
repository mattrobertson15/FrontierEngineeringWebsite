export function LogoMark({
  size = 28,
  inverted = false,
}: {
  size?: number;
  inverted?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="26"
        height="26"
        fill="none"
        stroke={inverted ? "#F5F2EB" : "#071C29"}
        strokeWidth="2"
      />
      <rect x="12" y="12" width="10" height="10" fill="#C16839" />
    </svg>
  );
}
