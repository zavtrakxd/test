import { motion } from "framer-motion";
import { Pickaxe, Cloud, Swords, Crown } from "lucide-react";

const modes = [
  {
    icon: Pickaxe,
    name: "Survival",
    badge: "Классика",
    text: "Огромный мир, защищённые приваты, аукцион, рейды и магия. Всё что любишь.",
    gradient: "from-emerald-500/30 via-emerald-500/10 to-transparent",
    accent: "text-emerald-300",
    border: "hover:border-emerald-400/40",
  },
  {
    icon: Cloud,
    name: "SkyBlock",
    badge: "Прокачка",
    text: "Развивай свой остров с нуля, открывай новые биомы и собирай редчайшие ресурсы.",
    gradient: "from-cyan-500/30 via-cyan-500/10 to-transparent",
    accent: "text-cyan-300",
    border: "hover:border-cyan-400/40",
  },
  {
    icon: Swords,
    name: "BedWars",
    badge: "PvP",
    text: "Защити свою кровать, разрушь чужие. Стиль, скорость, командный экшн.",
    gradient: "from-rose-500/30 via-rose-500/10 to-transparent",
    accent: "text-rose-300",
    border: "hover:border-rose-400/40",
  },
  {
    icon: Crown,
    name: "Ивенты",
    badge: "Каждую неделю",
    text: "Турниры, конкурсы строек, сезонные ивенты с уникальной экипировкой.",
    gradient: "from-amber-500/30 via-amber-500/10 to-transparent",
    accent: "text-amber-300",
    border: "hover:border-amber-400/40",
  },
];

export default function Gamemodes() {
  return (
    <section id="gamemodes" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-lime-300">
            Режимы
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Найди свой стиль игры
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Несколько режимов — один аккаунт. Переключайся между ними когда
            захочешь.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {modes.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className={`card relative overflow-hidden p-7 transition ${m.border}`}
            >
              <div
                className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${m.gradient} blur-3xl`}
              />
              <div className="relative flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <m.icon className={`h-7 w-7 ${m.accent}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-2xl font-bold text-white">
                      {m.name}
                    </h3>
                    <span
                      className={`rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${m.accent}`}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {m.text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
