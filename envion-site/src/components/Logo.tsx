interface Props {
  size?: number;
  className?: string;
}

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
        <linearGradient id="lg1" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="64">
          <stop offset="0" stopColor="#a3e635" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 L58 18 V46 L32 60 L6 46 V18 Z"
        fill="url(#lg1)"
        opacity="0.18"
        stroke="url(#lg1)"
        strokeWidth="2"
      />
      <path
        d="M32 14 L48 23 V41 L32 50 L16 41 V23 Z"
        fill="url(#lg2)"
        opacity="0.95"
      />
      <path
        d="M32 14 L48 23 L32 32 L16 23 Z"
        fill="#06090c"
        opacity="0.25"
      />
    </svg>
  );
}
