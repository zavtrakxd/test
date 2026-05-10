interface Props {
  size?: number;
  className?: string;
}

/**
 * Compact ENVION mark — stylized axolotl head silhouette inside a hex.
 */
export default function Logo({ size = 32, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lgEdge" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0" stopColor="#ff8fb1" />
          <stop offset="0.5" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#7dd3fc" />
        </linearGradient>
        <radialGradient id="lgBody" cx="50%" cy="55%" r="60%">
          <stop offset="0" stopColor="#ffd9e3" />
          <stop offset="1" stopColor="#ee7da0" />
        </radialGradient>
      </defs>
      <path
        d="M32 4 L58 18 V46 L32 60 L6 46 V18 Z"
        fill="#0d0e22"
        stroke="url(#lgEdge)"
        strokeWidth="2.5"
      />
      {/* gills */}
      <path
        d="M14 26 c4 -2 8 -2 11 1 c-4 0 -7 1 -10 4 z"
        fill="url(#lgBody)"
      />
      <path
        d="M14 38 c4 2 8 2 11 -1 c-4 0 -7 -1 -10 -4 z"
        fill="url(#lgBody)"
      />
      <path
        d="M50 26 c-4 -2 -8 -2 -11 1 c4 0 7 1 10 4 z"
        fill="url(#lgBody)"
      />
      <path
        d="M50 38 c-4 2 -8 2 -11 -1 c4 0 7 -1 10 -4 z"
        fill="url(#lgBody)"
      />
      {/* head */}
      <ellipse cx="32" cy="32" rx="14" ry="11" fill="url(#lgBody)" />
      {/* eyes */}
      <path
        d="M27 30 q1.5 -2 3 0"
        stroke="#3b1438"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M34 30 q1.5 -2 3 0"
        stroke="#3b1438"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      {/* smile */}
      <path
        d="M30 35 q2 1.5 4 0"
        stroke="#3b1438"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
