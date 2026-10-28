// Paths from the brand logo.svg, with the viewBox cropped tight to the mark.
export function LogoMark({
  size = 28,
  inverted = false,
}: {
  size?: number;
  inverted?: boolean;
}) {
  return (
    <svg
      width={Math.round((size * 135) / 97)}
      height={size}
      viewBox="19.5 20 135 97"
      aria-hidden="true"
    >
      <path
        fill={inverted ? "#F5F2EB" : "#071C29"}
        d="M66.6 20.5 H151.6 Q153.6 20.5 152.4 22.1 L134.8 45.9 Q134.1 47 132.6 47 H54 Q52.9 47 53.5 45.8 L64.6 22 Q65.3 20.5 66.6 20.5 Z M48.1 60.7 H107.4 Q109.9 60.7 107.8 62.2 L23.2 114.3 Q19.9 116.3 21.4 112.8 L45.2 62.4 Q46 60.7 48.1 60.7 Z"
      />
      <path
        fill="#C16839"
        d="M107.6 75 C111.1 88.5 112.3 90.6 125 94.5 C112.6 97.8 111.4 100.3 107.6 114 C104.1 100.5 102.6 98 90 94.5 C102.5 90.7 104 88.5 107.6 75 Z"
      />
    </svg>
  );
}
