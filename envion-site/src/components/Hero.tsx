import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Heart } from "lucide-react";
import CopyIp from "./CopyIp";
import Axolotl from "./Axolotl";
import { SERVER } from "../lib/server";
import { useServerStatus } from "../lib/useServerStatus";

const STARS = [
  { top: "12%", left: "8%", delay: 0 },
  { top: "22%", left: "78%", delay: 0.4 },
  { top: "35%", left: "22%", delay: 0.8 },
  { top: "58%", left: "70%", delay: 0.2 },
  { top: "8%", left: "55%", delay: 1.4 },
  { top: "65%", left: "12%", delay: 1.8 },
  { top: "44%", left: "92%", delay: 0.6 },
  { top: "78%", left: "44%", delay: 1.0 },
  { top: "18%", left: "38%", delay: 2.2 },
  { top: "50%", left: "50%", delay: 1.2 },
  { top: "72%", left: "85%", delay: 0.5 },
  { top: "30%", left: "62%", delay: 2.6 },
  { top: "85%", left: "28%", delay: 1.6 },
  { top: "5%", left: "30%", delay: 0.3 },
];

const BUBBLES = [
  { left: "10%", size: 18, delay: 0, duration: 12 },
  { left: "22%", size: 10, delay: 2, duration: 9 },
  { left: "34%", size: 22, delay: 4, duration: 14 },
  { left: "70%", size: 14, delay: 1, duration: 10 },
  { left: "82%", size: 26, delay: 3, duration: 16 },
  { left: "92%", size: 8, delay: 5, duration: 8 },
  { left: "55%", size: 16, delay: 6, duration: 12 },
];

export default function Hero() {
  const status = useServerStatus(SERVER.ip);
  const isOnline = status.online;
  const playersText = status.players
    ? `${status.players.online} / ${status.players.max}`
    : "—";

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden pb-24 pt-32 sm:pt-40"
    >
      <div className="aurora" />
      <div className="absolute inset-0 -z-10 bg-grid animate-gridmove opacity-50" />

      {/* Stars */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="star"
            style={{
              top: s.top,
              left: s.left,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Bubbles */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[500px] overflow-hidden">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="bubble animate-bubbleUp"
            style={{
              left: b.left,
              bottom: "-30px",
              width: `${b.size}px`,
              height: `${b.size}px`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:px-8">
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-slate-300"
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
            <span className="font-mono text-pink-200">{playersText}</span>
            <span className="text-slate-500">игроков</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-hand text-2xl text-pink-200/80 lg:text-3xl"
          >
            ванильный сервер
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-6xl font-bold leading-[0.92] tracking-tight sm:text-7xl md:text-8xl"
          >
            <span className="text-gradient">ENVION</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="mx-auto mt-6 max-w-xl text-balance text-base text-slate-300 sm:text-lg lg:mx-0"
          >
            Чистое выживание, без модов и читерских преимуществ. Просто ты,
            твои друзья и бесконечный мир — как Minecraft и задумывался.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <CopyIp size="lg" />
            <a
              href="#join"
              className="group inline-flex items-center gap-2 rounded-full border border-pink-300/30 bg-pink-300/10 px-5 py-3 text-sm font-medium text-pink-100 transition hover:border-pink-300/60 hover:bg-pink-300/15"
            >
              Как зайти на сервер
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.38 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 lg:justify-start"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-pink-300" />
              Версия {SERVER.version} (Java)
            </span>
            <span className="hidden h-3 w-px bg-white/10 sm:inline-block" />
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-300" />
              Без P2W
            </span>
            <span className="hidden h-3 w-px bg-white/10 sm:inline-block" />
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              100% ваниль
            </span>
          </motion.div>
        </div>

        {/* Mascot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
          className="relative mx-auto flex items-center justify-center"
        >
          <div className="absolute inset-0 -z-10 mx-auto h-[260px] w-[260px] translate-y-4 rounded-full bg-pink-400/20 blur-3xl sm:h-[340px] sm:w-[340px]" />
          <div className="absolute inset-0 -z-10 mx-auto h-[200px] w-[200px] -translate-y-4 translate-x-10 rounded-full bg-cyan-300/15 blur-3xl" />
          <Axolotl size={360} className="drop-shadow-[0_30px_60px_rgba(238,125,160,0.25)]" />

          {/* Floating badges around the mascot */}
          <FloatingBadge
            className="left-0 top-2"
            label="vanilla"
            sub="без модов"
            tone="pink"
            delay={0.6}
          />
          <FloatingBadge
            className="right-0 top-10"
            label="no P2W"
            sub="всё честно"
            tone="cyan"
            delay={0.8}
          />
          <FloatingBadge
            className="right-2 bottom-6"
            label={SERVER.version}
            sub="Java edition"
            tone="purple"
            delay={1.0}
          />
        </motion.div>
      </div>
    </section>
  );
}

interface BadgeProps {
  className?: string;
  label: string;
  sub: string;
  tone: "pink" | "cyan" | "purple";
  delay?: number;
}

function FloatingBadge({
  className = "",
  label,
  sub,
  tone,
  delay = 0,
}: BadgeProps) {
  const tones = {
    pink: "border-pink-300/30 bg-pink-300/10 text-pink-100",
    cyan: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
    purple: "border-violet-300/30 bg-violet-300/10 text-violet-100",
  } as const;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={`absolute hidden rounded-2xl border px-3 py-2 shadow-lg backdrop-blur-md sm:block ${tones[tone]} ${className}`}
    >
      <div className="font-display text-sm font-semibold">{label}</div>
      <div className="text-[10px] uppercase tracking-wider opacity-70">
        {sub}
      </div>
    </motion.div>
  );
}
