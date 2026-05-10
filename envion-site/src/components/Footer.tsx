import { Github, MessageCircle, Send } from "lucide-react";
import Logo from "./Logo";
import { SERVER } from "../lib/server";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 sm:px-6 lg:flex-row lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <div>
            <div className="font-display text-base font-bold tracking-tight text-white">
              {SERVER.name}
            </div>
            <div className="text-xs text-slate-500">
              {SERVER.ip} · версия {SERVER.version}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SocialLink
            href="https://discord.gg/"
            label="Discord"
            icon={MessageCircle}
          />
          <SocialLink href="https://t.me/" label="Telegram" icon={Send} />
          <SocialLink href="https://github.com/" label="GitHub" icon={Github} />
        </div>

        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} {SERVER.name}. Не аффилирован с Mojang
          AB.
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer noopener"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-300"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
