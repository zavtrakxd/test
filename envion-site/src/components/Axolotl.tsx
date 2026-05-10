interface Props {
  size?: number;
  className?: string;
  /** Whether the axolotl should slowly wiggle its tail and bob. */
  animated?: boolean;
}

/**
 * Stylized vector axolotl — server mascot for ENVION.
 * Pink body, frilly external gills, gentle smile.
 */
export default function Axolotl({
  size = 220,
  className = "",
  animated = true,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Аксолотль ENVION"
      role="img"
    >
      <defs>
        <radialGradient id="axoBody" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#ffd9e3" />
          <stop offset="55%" stopColor="#ffb1c8" />
          <stop offset="100%" stopColor="#ee7da0" />
        </radialGradient>
        <radialGradient id="axoBelly" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fff1f5" />
          <stop offset="100%" stopColor="#ffd0dd" />
        </radialGradient>
        <linearGradient id="axoGill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff96b4" />
          <stop offset="100%" stopColor="#ffd1de" />
        </linearGradient>
        <radialGradient id="axoCheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff7ea2" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#ff7ea2" stopOpacity="0" />
        </radialGradient>
        <filter
          id="axoShadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="10"
            floodColor="#ff66a0"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      <g
        filter="url(#axoShadow)"
        className={animated ? "origin-[120px_120px] animate-float" : ""}
      >
        {/* Tail */}
        <g
          className={animated ? "origin-[80px_140px] animate-wag" : ""}
          style={{ transformOrigin: "80px 140px" }}
        >
          <path
            d="M70 130 C 40 130, 20 160, 28 188 C 50 178, 80 170, 96 152 Z"
            fill="url(#axoBody)"
          />
          {/* Tail fin highlight */}
          <path
            d="M40 168 C 50 162, 70 158, 88 152 L 80 178 C 60 178, 48 176, 38 184 Z"
            fill="#ffe4ec"
            opacity="0.55"
          />
        </g>

        {/* Gill fronds — left (3) */}
        <g>
          <FrondLeft cx={64} cy={70} scale={1.05} rotate={-32} />
          <FrondLeft cx={56} cy={94} scale={1.0} rotate={-14} />
          <FrondLeft cx={62} cy={120} scale={0.85} rotate={8} />
        </g>
        {/* Gill fronds — right (3) */}
        <g>
          <FrondRight cx={196} cy={70} scale={1.05} rotate={32} />
          <FrondRight cx={204} cy={94} scale={1.0} rotate={14} />
          <FrondRight cx={198} cy={120} scale={0.85} rotate={-8} />
        </g>

        {/* Body */}
        <ellipse cx="130" cy="138" rx="74" ry="58" fill="url(#axoBody)" />

        {/* Belly */}
        <ellipse cx="138" cy="158" rx="48" ry="28" fill="url(#axoBelly)" />

        {/* Head (slightly more rounded forward) */}
        <ellipse cx="118" cy="108" rx="62" ry="50" fill="url(#axoBody)" />

        {/* Cheeks */}
        <circle cx="86" cy="118" r="14" fill="url(#axoCheek)" />
        <circle cx="150" cy="118" r="14" fill="url(#axoCheek)" />

        {/* Eyes — closed happy arcs */}
        <path
          d="M86 102 q6 -8 12 0"
          stroke="#3b1438"
          strokeWidth="3.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M138 102 q6 -8 12 0"
          stroke="#3b1438"
          strokeWidth="3.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Smile */}
        <path
          d="M110 124 q8 8 16 0"
          stroke="#3b1438"
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Tiny highlight on forehead */}
        <ellipse
          cx="98"
          cy="84"
          rx="14"
          ry="5"
          fill="#ffffff"
          opacity="0.45"
        />

        {/* Front legs hint */}
        <ellipse cx="102" cy="186" rx="14" ry="9" fill="#ee7da0" opacity="0.6" />
        <ellipse cx="160" cy="188" rx="14" ry="9" fill="#ee7da0" opacity="0.6" />
      </g>
    </svg>
  );
}

interface FrondProps {
  cx: number;
  cy: number;
  scale?: number;
  rotate?: number;
}

function FrondLeft({ cx, cy, scale = 1, rotate = 0 }: FrondProps) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`}>
      <path
        d="M0 0 C -20 -8, -38 -2, -50 14 C -34 18, -22 18, -10 12 C -16 22, -22 28, -32 36 C -16 38, -2 32, 6 18 Z"
        fill="url(#axoGill)"
      />
      <path
        d="M-6 -2 C -22 -2, -34 6, -42 18"
        stroke="#ff7ea2"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
    </g>
  );
}

function FrondRight({ cx, cy, scale = 1, rotate = 0 }: FrondProps) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`}>
      <path
        d="M0 0 C 20 -8, 38 -2, 50 14 C 34 18, 22 18, 10 12 C 16 22, 22 28, 32 36 C 16 38, 2 32, -6 18 Z"
        fill="url(#axoGill)"
      />
      <path
        d="M6 -2 C 22 -2, 34 6, 42 18"
        stroke="#ff7ea2"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
    </g>
  );
}
