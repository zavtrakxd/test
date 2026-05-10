import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

interface Props {
  size?: number;
  className?: string;
  animated?: boolean;
}

const PX = 12;
const COLS = 28;
const ROWS = 22;

/**
 * ENVION mascot — Lucy-style Minecraft axolotl, drawn as side-view pixel art.
 * Independent groups can be animated (head bob, tail wag, gill sway, blink,
 * bubble breath).
 */
const COLORS: Record<string, string> = {
  "#": "#F2A4B4", // body base
  "*": "#FFC9D5", // body highlight
  s: "#D6818F", // body shade / outline
  o: "#9E5061", // dark outline
  b: "#FCEAEF", // belly
  B: "#F8D8DF", // belly shade
  f: "#F4ABBE", // frill base
  F: "#FFD2DD", // frill highlight
  S: "#D87B95", // frill shade
  e: "#241019", // eye
  E: "#FFFFFF", // eye highlight
  m: "#6B2A40", // mouth
  t: "#FFC0CD", // tail fin light
  T: "#E696AA", // tail fin mid
  ".": "transparent",
};

function gridRects(
  grid: readonly string[],
  ox: number,
  oy: number,
  keyPrefix: string,
) {
  const out: JSX.Element[] = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === "." || c === " ") continue;
      const fill = COLORS[c];
      if (!fill) continue;
      out.push(
        <rect
          key={`${keyPrefix}-${x}-${y}`}
          x={(ox + x) * PX}
          y={(oy + y) * PX}
          width={PX + 0.6}
          height={PX + 0.6}
          fill={fill}
        />,
      );
    }
  }
  return out;
}

/* ---------- pixel-art definitions ---------- */
/* Axolotl faces LEFT — head on the left, tail on the right.            */

// Head (9 wide × 7 tall) — chibi Minecraft proportions; eye + mouth on the
// left (front) edge. The bottom row tucks under the body with shading.
const HEAD = [
  ".*#######",
  "*########",
  "##########",
  "##########",
  "##########",
  "*########",
  ".ssbbbbbb",
] as const;

// Body (8 wide × 4 tall) — sits behind the head, slightly shorter so the head
// reads as the dominant feature.
const BODY = [
  "*########",
  "#########",
  "#########",
  "sbbbbbbbB",
] as const;

// Tail group: paddle-shaped fin on the right, body stub on the left. The
// rotation pivot is configured to the LEFT edge so the fin sweeps.
const TAIL = [
  ".....tT.",
  "....TtT.",
  "...TttT.",
  "*##TttT.",
  "*##TttT.",
  "...TttT.",
  "....TtT.",
  ".....tT.",
] as const;

// Three frilly gills sticking up from the head, each in its own group so
// they can sway with offset delays. Each grid is positioned so its base
// (last row) sits on top of the head.
const FRILL_FRONT = [
  ".F.",
  "FF.",
  "fFF",
  ".f.",
  ".f.",
] as const;

const FRILL_TOP = [
  "F.F.",
  "FFFF",
  ".FFF",
  ".fff",
  "..f.",
  "..f.",
] as const;

const FRILL_BACK = [
  ".F.",
  "FFF",
  "fFf",
  ".f.",
  ".S.",
] as const;

// Two visible legs (front and back) — small pink feet.
const LEG = ["##", "##", "ss"] as const;

export default function Axolotl({
  size = 240,
  className = "",
  animated = true,
}: Props) {
  // Periodic blink — eye becomes a thin slit briefly every ~5 s.
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!animated) return;
    let timeout: number | null = null;
    const tick = () => {
      setBlink(true);
      timeout = window.setTimeout(() => setBlink(false), 150);
    };
    const interval = window.setInterval(tick, 4800);
    return () => {
      window.clearInterval(interval);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [animated]);

  // Bubbles released from the mouth at intervals.
  const [bubbles, setBubbles] = useState<{ id: number; drift: number; r: number }[]>(
    [],
  );
  useEffect(() => {
    if (!animated) return;
    let id = 0;
    const interval = window.setInterval(() => {
      id += 1;
      const newId = id;
      setBubbles((prev) =>
        [
          ...prev,
          { id: newId, drift: (Math.random() - 0.5) * 28, r: 2.5 + Math.random() * 3 },
        ].slice(-6),
      );
      window.setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== newId));
      }, 3800);
    }, 1500);
    return () => window.clearInterval(interval);
  }, [animated]);

  // Head is at offset (3, 7).
  // The eye and mouth are drawn as separate overlay rects so we can animate
  // them (blink, smile) and avoid the alignment getting locked in the grid.
  const eyeX = (3 + 1) * PX;
  const eyeY = (7 + 3) * PX;
  const mouthBaseX = (3 + 0.7) * PX;
  const mouthBaseY = (7 + 5.2) * PX;

  // Track hover state to play a quick "excited" animation.
  const controls = useAnimation();
  const hoverRef = useRef(false);
  const onHoverStart = () => {
    hoverRef.current = true;
    controls.start({
      scale: [1, 1.06, 1],
      transition: { duration: 0.45, ease: "easeOut" },
    });
  };
  const onHoverEnd = () => {
    hoverRef.current = false;
  };

  return (
    <motion.svg
      width={size}
      height={(size * ROWS) / COLS}
      viewBox={`0 0 ${COLS * PX} ${ROWS * PX}`}
      xmlns="http://www.w3.org/2000/svg"
      className={`pixel-edge cursor-pointer ${className}`}
      shapeRendering="crispEdges"
      aria-label="Аксолотль ENVION"
      role="img"
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      animate={controls}
      style={{ transformOrigin: `${(COLS * PX) / 2}px ${(ROWS * PX) / 2}px` }}
    >
      <defs>
        <filter id="axoSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="10"
            floodColor="#ff66a0"
            floodOpacity="0.4"
          />
        </filter>
      </defs>

      {/* Soft pink halo behind */}
      <ellipse
        cx={COLS * PX * 0.5}
        cy={ROWS * PX * 0.62}
        rx={COLS * PX * 0.42}
        ry={ROWS * PX * 0.3}
        fill="#ff8fb1"
        opacity="0.18"
      />

      {/* Whole axolotl bobs gently (idle "swimming" motion) */}
      <motion.g
        filter="url(#axoSoftShadow)"
        animate={
          animated
            ? { y: [0, -6, 0, 4, 0], rotate: [0, -1.4, 0, 1.4, 0] }
            : undefined
        }
        transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: `${15 * PX}px ${12 * PX}px` }}
      >
        {/* Tail — wags around its base. Pivot is the LEFT edge of the tail. */}
        <motion.g
          animate={animated ? { rotate: [-9, 9, -9] } : undefined}
          transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${18 * PX}px ${12 * PX}px` }}
        >
          {gridRects(TAIL, 18, 8, "tail")}
        </motion.g>

        {/* Body */}
        {gridRects(BODY, 12, 10, "body")}

        {/* Front leg (gentle kick, faster cycle) */}
        <motion.g
          animate={animated ? { rotate: [-7, 7, -7] } : undefined}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${13 * PX}px ${14 * PX}px` }}
        >
          {gridRects(LEG, 13, 14, "leg-f")}
        </motion.g>

        {/* Back leg (offset kick) */}
        <motion.g
          animate={animated ? { rotate: [7, -7, 7] } : undefined}
          transition={{
            duration: 1.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
          style={{ transformOrigin: `${17 * PX}px ${14 * PX}px` }}
        >
          {gridRects(LEG, 17, 14, "leg-b")}
        </motion.g>

        {/* Head */}
        {gridRects(HEAD, 3, 7, "head")}

        {/* Cheek blush */}
        <rect
          x={(3 + 2.4) * PX}
          y={(7 + 4.4) * PX}
          width={PX * 1.6}
          height={PX * 0.55}
          fill="#FF7FA1"
          opacity="0.45"
          rx={1.5}
        />

        {/* Eye — animated blink. Big chibi-style eye on the front of head. */}
        <rect
          x={eyeX}
          y={eyeY + (blink ? PX * 0.45 : 0)}
          width={PX + 0.6}
          height={blink ? PX * 0.15 : PX + 0.6}
          fill={COLORS.e}
          rx={1}
        />
        {!blink && (
          <rect
            x={eyeX + PX * 0.18}
            y={eyeY + PX * 0.15}
            width={PX * 0.32}
            height={PX * 0.32}
            fill={COLORS.E}
            rx={0.6}
          />
        )}

        {/* Smile mouth — small upward arc (`)` shape rotated). */}
        <path
          d={`M ${mouthBaseX} ${mouthBaseY} q ${PX * 0.7} ${PX * 0.55} ${PX * 1.4} 0`}
          stroke={COLORS.m}
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
        />

        {/* Frills — three gill fronds, each sways with its own delay */}
        <motion.g
          animate={animated ? { rotate: [-6, 6, -6] } : undefined}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${5 * PX}px ${7 * PX}px` }}
        >
          {gridRects(FRILL_FRONT, 4, 2, "frill-front")}
        </motion.g>
        <motion.g
          animate={animated ? { rotate: [5, -7, 5] } : undefined}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
          style={{ transformOrigin: `${8 * PX}px ${7 * PX}px` }}
        >
          {gridRects(FRILL_TOP, 7, 1, "frill-top")}
        </motion.g>
        <motion.g
          animate={animated ? { rotate: [-5, 8, -5] } : undefined}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6,
          }}
          style={{ transformOrigin: `${11 * PX}px ${7 * PX}px` }}
        >
          {gridRects(FRILL_BACK, 10, 2, "frill-back")}
        </motion.g>
      </motion.g>

      {/* Bubbles drift up from the mouth */}
      {animated &&
        bubbles.map((b) => (
          <motion.circle
            key={b.id}
            cx={mouthBaseX - PX * 0.6}
            cy={mouthBaseY + PX * 0.4}
            r={b.r}
            fill="rgba(255,255,255,0.85)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.8"
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.6 }}
            animate={{
              opacity: [0, 0.95, 0.95, 0],
              y: [-2, -100],
              x: [0, b.drift],
              scale: [0.6, 1, 1.15, 0.5],
            }}
            transition={{ duration: 3.6, ease: "easeOut" }}
          />
        ))}
    </motion.svg>
  );
}
