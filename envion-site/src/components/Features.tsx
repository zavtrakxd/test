import { motion } from "framer-motion";
import {
  Shield,
  Sparkles,
  Lock,
  Users2,
  Zap,
  Database,
  Pickaxe,
  Trees,
} from "lucide-react";

const features = [
  {
    icon: Pickaxe,
    title: "Чистая ваниль",
    text: "Никаких модов и плагинов меняющих геймплей. Только Minecraft, как его задумали.",
    color: "from-pink-400/25 to-pink-500/0",
    accent: "text-pink-200",
  },
  {
    icon: Shield,
    title: "Античит без боли",
    text: "Защита от полётов и спид-хака. Без ложных срабатываний — играй спокойно.",
    color: "from-cyan-400/25 to-cyan-500/0",
    accent: "text-cyan-200",
  },
  {
    icon: Lock,
    title: "Защита приватов",
    text: "Гриф запрещён технически. /claim — и твои постройки в безопасности.",
    color: "from-violet-400/25 to-violet-500/0",
    accent: "text-violet-200",
  },
  {
    icon: Users2,
    title: "Дружное комьюнити",
    text: "Адекватные игроки, активный Discord, никакого токсика.",
    color: "from-sky-400/25 to-sky-500/0",
    accent: "text-sky-200",
  },
  {
    icon: Zap,
    title: "Стабильные 20 TPS",
    text: "Оптимизированное ядро (Paper) + железо. Никаких лагов даже на пиках.",
    color: "from-amber-400/25 to-amber-500/0",
    accent: "text-amber-200",
  },
  {
    icon: Database,
    title: "Бэкапы каждые 30 минут",
    text: "Если что-то случилось — мы откатим. Твой прогресс не потеряется.",
    color: "from-fuchsia-400/25 to-fuchsia-500/0",
    accent: "text-fuchsia-200",
  },
  {
    icon: Trees,
    title: "Бесконечный мир",
    text: "Без вайпов и сезонов. Стройся всерьёз — мир будет жить с тобой.",
    color: "from-lime-400/25 to-lime-500/0",
    accent: "text-lime-200",
  },
  {
    icon: Sparkles,
    title: "Ивенты по выходным",
    text: "Стройки на скорость, прятки в шахтах, сезонные конкурсы. Без обязаловки.",
    color: "from-rose-400/25 to-rose-500/0",
    accent: "text-rose-200",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Почему ENVION"
          handAccent="любим вместе"
          title="Сервер, который чувствуется как дом"
          description="Мы не пытаемся переизобрести Minecraft. Мы просто делаем его комфортным."
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

interface HeaderProps {
  eyebrow: string;
  handAccent?: string;
  title: string;
  description?: string;
}

export function SectionHeader({
  eyebrow,
  handAccent,
  title,
  description,
}: HeaderProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-pink-200">
        {eyebrow}
      </div>
      {handAccent && (
        <div className="mt-3 font-hand text-2xl text-pink-200/80">
          {handAccent}
        </div>
      )}
      <h2 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base text-slate-400">{description}</p>
      )}
    </div>
  );
}
