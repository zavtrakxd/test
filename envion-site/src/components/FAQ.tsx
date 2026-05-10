import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SERVER } from "../lib/server";

const items: { q: string; a: string }[] = [
  {
    q: "Какая версия Minecraft нужна?",
    a: `Заходи на любой версии ${SERVER.version} (Java Edition). Bedrock пока не поддерживается.`,
  },
  {
    q: "Сервер платный?",
    a: "Нет, играть можно бесплатно. Никаких преимуществ за деньги — только косметика и дополнительные слоты на приваты.",
  },
  {
    q: "Можно ли играть с пиратки?",
    a: "Да, поддерживается лицензия и оффлайн-аккаунты. При первом заходе создаётся аккаунт по нику.",
  },
  {
    q: "Как защитить свои постройки?",
    a: "Используй команду /region claim или /home set. Гриф запрещён правилами и технически невозможен на территории привата.",
  },
  {
    q: "Где сообщить о баге или нарушителе?",
    a: "В Discord-сервере есть тикет-система: открой тикет и опиши проблему — модерация ответит в течение пары часов.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="relative py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-fuchsia-300">
            FAQ
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Частые вопросы
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Не нашёл ответ? Спроси в Discord — мы быстро поможем.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {items.map((it, i) => (
            <FAQItem key={it.q} q={it.q} a={it.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`card overflow-hidden transition ${open ? "border-emerald-400/30" : ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-base font-medium text-white">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
            open
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 bg-white/[0.04] text-slate-300"
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 text-sm leading-relaxed text-slate-400">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
