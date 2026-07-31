import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

interface Props {
  size?: number;
  className?: string;
  /** Whether the axolotl should slowly bob and emit bubbles. */
  animated?: boolean;
}

interface Bubble {
  id: number;
  drift: number;
  size: number;
  duration: number;
}

/**
 * ENVION mascot — the official Minecraft "Lucy" axolotl.
 *
 * The render is a transparent PNG of the in-game model. We layer it over a
 * soft pink halo, an animated bubble field, and use Framer Motion to give it
 * a gentle floating/swimming idle and a friendly hover bounce.
 */
export default function Axolotl({
  size = 360,
  className = "",
  animated = true,
}: Props) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!animated) return;
    const interval = window.setInterval(() => {
      idRef.current += 1;
      const id = idRef.current;
      const bubble: Bubble = {
        id,
        drift: (Math.random() - 0.5) * 60,
        size: 6 + Math.random() * 12,
        duration: 3 + Math.random() * 1.6,
      };
      setBubbles((prev) => [...prev, bubble].slice(-8));
      window.setTimeout(
        () => setBubbles((prev) => prev.filter((b) => b.id !== id)),
        bubble.duration * 1000 + 100,
      );
    }, 1100);
    return () => window.clearInterval(interval);
  }, [animated]);

  const controls = useAnimation();
  const onHoverStart = () => {
    void controls.start({
      scale: [1, 1.06, 1],
      rotate: [0, -2, 1, 0],
      transition: { duration: 0.55, ease: "easeOut" },
    });
  };

  // Mouth position (relative percentage of the image bounding box).
  // The Lucy render has its mouth roughly at x≈10%, y≈55%.
  const mouthLeftPct = 11;
  const mouthTopPct = 60;

  return (
    <motion.div
      onHoverStart={onHoverStart}
      animate={controls}
      className={`relative inline-block ${className}`}
      style={{ width: size, lineHeight: 0 }}
    >
      {/* Soft pink halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 mx-auto rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,143,177,0.42) 0%, rgba(255,143,177,0.18) 45%, rgba(255,143,177,0) 70%)",
          filter: "blur(4px)",
        }}
      />

      {/* Secondary cyan glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 mx-auto translate-x-6 translate-y-3 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(125,211,252,0.28) 0%, rgba(125,211,252,0) 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* The image, gently bobbing and tilting */}
      <motion.img
        src="/axolotl-lucy.png"
        alt="Аксолотль ENVION (Lucy из Minecraft)"
        width={size}
        draggable={false}
        animate={
          animated
            ? {
                y: [0, -10, 0, 7, 0],
                rotate: [0, -2.5, 0, 2.5, 0],
              }
            : undefined
        }
        transition={{
          duration: 5.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width: size,
          height: "auto",
          display: "block",
          imageRendering: "pixelated",
          filter: "drop-shadow(0 24px 40px rgba(238, 125, 160, 0.35))",
        }}
      />

      {/* Bubbles drifting up from near the mouth */}
      {animated && (
        <div
          className="pointer-events-none absolute inset-0 overflow-visible"
          aria-hidden
        >
          {bubbles.map((b) => (
            <motion.span
              key={b.id}
              className="absolute rounded-full"
              style={{
                left: `${mouthLeftPct}%`,
                top: `${mouthTopPct}%`,
                width: b.size,
                height: b.size,
                background:
                  "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.55) 55%, rgba(255,255,255,0.15))",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)",
              }}
              initial={{ opacity: 0, y: 0, x: 0, scale: 0.4 }}
              animate={{
                opacity: [0, 0.95, 0.95, 0],
                y: [-4, -size * 0.55],
                x: [0, b.drift - 30],
                scale: [0.4, 1, 1.1, 0.5],
              }}
              transition={{ duration: b.duration, ease: "easeOut" }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
