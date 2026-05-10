import { motion } from "framer-motion";
import { Activity, Users, Cpu, Globe } from "lucide-react";
import { SERVER } from "../lib/server";
import { useServerStatus } from "../lib/useServerStatus";

export default function LiveStats() {
  const status = useServerStatus(SERVER.ip);

  const items = [
    {
      icon: Activity,
      label: "Статус",
      value: status.loading
        ? "…"
        : status.online
          ? "Online"
          : "Offline",
      accent: status.online ? "text-emerald-300" : "text-rose-300",
    },
    {
      icon: Users,
      label: "Игроки",
      value: status.players
        ? `${status.players.online} / ${status.players.max}`
        : "—",
      accent: "text-pink-200",
    },
    {
      icon: Cpu,
      label: "Версия",
      value: status.version ?? SERVER.version,
      accent: "text-cyan-200",
    },
    {
      icon: Globe,
      label: "Адрес",
      value: SERVER.ip,
      accent: "text-violet-200",
    },
  ];

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="card card-hover relative overflow-hidden p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                <it.icon className={`h-4 w-4 ${it.accent}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  {it.label}
                </div>
                <div
                  className={`truncate font-mono text-base font-semibold sm:text-lg ${it.accent}`}
                >
                  {it.value}
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -inset-x-6 -bottom-12 h-24 bg-gradient-to-t from-pink-500/10 to-transparent blur-2xl" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
