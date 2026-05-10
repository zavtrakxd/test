import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Zap } from "lucide-react";
import CopyIp from "./CopyIp";
import { SERVER } from "../lib/server";
import { useServerStatus } from "../lib/useServerStatus";

export default function Hero() {
  const status = useServerStatus(SERVER.ip);
  const isOnline = status.online;
  const playersText = status.players
    ? `${status.players.online} / ${status.players.max}`
    : "—";

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden pb-24 pt-36 sm:pt-44"
    >
      <div className="absolute inset-0 -z-10 bg-grid animate-gridmove opacity-60" />

      {/* floating cubes */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <FloatingCube
          className="left-[8%] top-[18%]"
          delay={0}
          rot={[20, -28]}
          scale={0.55}
        />
        <FloatingCube
          className="right-[10%] top-[26%]"
          delay={0.6}
          rot={[-15, 30]}
          scale={0.45}
        />
        <FloatingCube
          className="left-[14%] bottom-[10%]"
          delay={1.1}
          rot={[10, 18]}
          scale={0.4}
        />
        <FloatingCube
          className="right-[18%] bottom-[14%]"
          delay={1.6}
          rot={[-25, -10]}
          scale={0.5}
        />
      </div>

      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-slate-300"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full ${
                isOnline ? "bg-emerald-400" : "bg-rose-400"
              } opacity-60`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isOnline ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
          </span>
          <span className="font-medium text-slate-200">
            {status.loading
              ? "Проверяем статус…"
              : isOnline
                ? "Сервер онлайн"
                : "Сервер оффлайн"}
          </span>
          <span className="text-slate-500">·</span>
          <span className="font-mono text-emerald-300">{playersText}</span>
          <span className="text-slate-500">игроков</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl md:text-8xl"
        >
          <span className="text-gradient">ENVION</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-base text-slate-300 sm:text-lg"
        >
          {SERVER.description} Заходи и почувствуй Minecraft по-новому —
          быстрый, стабильный и красивый.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <CopyIp size="lg" />
          <a
            href="#join"
            className="group inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-medium text-emerald-200 transition hover:border-emerald-400/60 hover:bg-emerald-400/15"
          >
            Как зайти на сервер
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400"
        >
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            Версия {SERVER.version}
          </span>
          <span className="hidden h-3 w-px bg-white/10 sm:inline-block" />
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-lime-400" />
            Java Edition
          </span>
          <span className="hidden h-3 w-px bg-white/10 sm:inline-block" />
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Без P2W
          </span>
        </motion.div>
      </div>
    </section>
  );
}

interface CubeProps {
  className?: string;
  delay?: number;
  rot?: [number, number];
  scale?: number;
}

function FloatingCube({
  className = "",
  delay = 0,
  rot = [20, 30],
  scale = 0.5,
}: CubeProps) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{ perspective: 800 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay }}
    >
      <motion.div
        className="cube animate-float"
        style={{
          transform: `scale(${scale}) rotateX(${rot[0]}deg) rotateY(${rot[1]}deg)`,
          animationDelay: `${delay}s`,
        }}
        animate={{
          rotateY: [rot[1], rot[1] + 360],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
          delay,
        }}
      >
        <div className="cube-face front" />
        <div className="cube-face back" />
        <div className="cube-face right" />
        <div className="cube-face left" />
        <div className="cube-face top" />
        <div className="cube-face bottom" />
      </motion.div>
    </motion.div>
  );
}
