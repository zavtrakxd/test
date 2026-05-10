import { motion } from "framer-motion";
import {
  Shield,
  Sparkles,
  Coins,
  Lock,
  CalendarDays,
  Users2,
  Zap,
  ServerCog,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Античит нового поколения",
    text: "Эффективная защита от читеров без ложных срабатываний.",
    color: "from-emerald-400/20 to-emerald-500/0",
    accent: "text-emerald-300",
  },
  {
    icon: Sparkles,
    title: "Регулярные обновления",
    text: "Новые фичи и контент каждые 2 недели — никогда не скучно.",
    color: "from-lime-400/20 to-lime-500/0",
    accent: "text-lime-300",
  },
  {
    icon: Coins,
    title: "Честная экономика",
    text: "Без P2W. Всё что важно — заработай в игре.",
    color: "from-amber-400/20 to-amber-500/0",
    accent: "text-amber-300",
  },
  {
    icon: Lock,
    title: "Защита приватов",
    text: "Гриф невозможен. Регионы, ключи, доверенные игроки.",
    color: "from-cyan-400/20 to-cyan-500/0",
    accent: "text-cyan-300",
  },
  {
    icon: CalendarDays,
    title: "Ивенты и турниры",
    text: "Еженедельные события с уникальными наградами.",
    color: "from-fuchsia-400/20 to-fuchsia-500/0",
    accent: "text-fuchsia-300",
  },
  {
    icon: Users2,
    title: "Активное комьюнити",
    text: "Дружелюбные игроки, разговорный Discord, live-стримы.",
    color: "from-sky-400/20 to-sky-500/0",
    accent: "text-sky-300",
  },
  {
    icon: Zap,
    title: "Низкий пинг",
    text: "Оптимизированное железо и сеть для плавной игры.",
    color: "from-yellow-400/20 to-yellow-500/0",
    accent: "text-yellow-300",
  },
  {
    icon: ServerCog,
    title: "Стабильный TPS",
    text: "20 TPS даже на пиковой нагрузке. Никаких лагов.",
    color: "from-emerald-400/20 to-emerald-500/0",
    accent: "text-emerald-300",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Почему ENVION"
          title="Сервер, который любишь"
          description="Мы собрали лучшее, что есть в Minecraft-серверах, и сделали ещё лучше."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}
              className="card card-hover relative overflow-hidden p-6"
            >
              <div
                className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${f.color} blur-2xl`}
              />
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <f.icon className={`h-5 w-5 ${f.accent}`} />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {f.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-300">
        {eyebrow}
      </div>
      <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base text-slate-400">{description}</p>
      )}
    </div>
  );
}
