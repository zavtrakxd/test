import { motion } from "framer-motion";
import { Download, Settings2, Server, Play } from "lucide-react";
import { SERVER } from "../lib/server";
import CopyIp from "./CopyIp";

const steps = [
  {
    icon: Download,
    title: "Скачай Minecraft",
    text: `Установи Minecraft Java Edition версии ${SERVER.version} с официального сайта.`,
  },
  {
    icon: Settings2,
    title: "Запусти лаунчер",
    text: "Выбери профиль, дождись пока всё прогрузится. Готово.",
  },
  {
    icon: Server,
    title: "Добавь сервер",
    text: "Multiplayer → Add Server. Адрес — ниже, можно скопировать в один клик.",
  },
  {
    icon: Play,
    title: "Заходи и играй",
    text: "Двойной клик по серверу — и ты на ENVION. Лучшие приключения ждут.",
  },
];

export default function HowToJoin() {
  return (
    <section id="join" className="relative py-28">
      <div className="absolute inset-0 -z-10 bg-grid opacity-20" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-200">
            Как зайти
          </div>
          <div className="mt-3 font-hand text-2xl text-pink-200/80">
            всего четыре шага
          </div>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            До игры — пара минут
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Без регистрации, без воды. Просто скопируй IP и заходи.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="card card-hover relative overflow-hidden p-6"
            >
              <span className="absolute right-4 top-4 font-display text-5xl font-bold text-white/[0.05]">
                0{i + 1}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-300/30 bg-pink-300/10 text-pink-200">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="relative mt-5 font-display text-lg font-semibold">
                {s.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-400">
                {s.text}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-12 flex w-full max-w-2xl flex-col items-center gap-4 rounded-2xl border border-pink-300/20 bg-gradient-to-br from-pink-500/[0.08] via-pink-500/[0.02] to-transparent p-7 text-center"
        >
          <div className="text-xs uppercase tracking-[0.18em] text-pink-200">
            IP сервера · версия {SERVER.version}
          </div>
          <CopyIp size="lg" />
          <p className="text-sm text-slate-400">
            Совет: добавь сервер в избранное, чтобы заходить в один клик.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
