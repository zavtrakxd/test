import { motion } from "framer-motion";
import { Heart, ShieldCheck, X, Check, Gift } from "lucide-react";
import { SectionHeader } from "./Features";

const yes = [
  "Косметика: цветной ник, префикс в чате",
  "Кастомные питомцы (декоративные, без бонусов)",
  "Дополнительные слоты для /home и /claim",
  "Аватар-эмодзи в Discord-ролях",
];

const no = [
  "Любые предметы, ресурсы и опыт",
  "Бессмертие, креативный режим, /fly",
  "Преимущество в PvP или экономике",
  "Ускоренная прокачка или приоритетный респаун",
];

export default function Donate() {
  return (
    <section id="donate" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Донат"
          handAccent="спасибо, что поддерживаешь"
          title="Поддержка сервера, а не покупка побед"
          description="Донат помогает нам платить за хостинг и устраивать ивенты. И ничего больше — ни одно преимущество за деньги не продаётся."
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="mx-auto mt-12 grid max-w-4xl gap-5 lg:grid-cols-2"
        >
          <div className="card relative overflow-hidden p-7">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent blur-3xl" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-300/10">
                <Check className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">
                  Что входит
                </h3>
                <p className="text-xs uppercase tracking-wider text-emerald-300">
                  только косметика и удобства
                </p>
              </div>
            </div>
            <ul className="relative mt-5 space-y-3 text-sm text-slate-300">
              {yes.map((y) => (
                <li key={y} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/15">
                    <Check className="h-3 w-3 text-emerald-300" />
                  </span>
                  <span>{y}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card relative overflow-hidden p-7">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-rose-400/20 to-transparent blur-3xl" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-300/30 bg-rose-300/10">
                <X className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">
                  Чего никогда не будет
                </h3>
                <p className="text-xs uppercase tracking-wider text-rose-300">
                  никаких преимуществ
                </p>
              </div>
            </div>
            <ul className="relative mt-5 space-y-3 text-sm text-slate-300">
              {no.map((n) => (
                <li key={n} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-rose-400/40 bg-rose-400/15">
                    <X className="h-3 w-3 text-rose-300" />
                  </span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="mx-auto mt-10 max-w-3xl rounded-2xl border border-pink-300/20 bg-gradient-to-br from-pink-500/[0.08] via-pink-500/[0.02] to-transparent p-6 text-center"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-pink-200">
            <ShieldCheck className="h-4 w-4" />
            Гарантия честной игры
          </div>
          <p className="mt-3 font-display text-xl text-white sm:text-2xl">
            Если ты задонатил и не получил обещанного — мы вернём деньги.
            Преимуществ за деньги не продаём, точка.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://discord.gg/"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full bg-pink-300/20 px-5 py-2.5 text-sm font-medium text-pink-100 transition hover:bg-pink-300/30"
            >
              <Gift className="h-4 w-4" />
              Узнать подробнее в Discord
            </a>
            <span className="inline-flex items-center gap-2 text-xs text-slate-400">
              <Heart className="h-3.5 w-3.5 text-rose-300" />
              Спасибо, что держишь сервер живым
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
