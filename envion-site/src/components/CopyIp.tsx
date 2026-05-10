import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { SERVER } from "../lib/server";

interface Props {
  size?: "sm" | "md" | "lg";
}

export default function CopyIp({ size = "md" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SERVER.ip);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = SERVER.ip;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        /* ignore */
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-base",
  } as const;

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Скопировать IP ${SERVER.ip}`}
      className={`group relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] font-mono font-medium text-slate-100 transition hover:border-emerald-400/40 hover:bg-white/[0.07] ${sizeClasses[size]}`}
    >
      <span className="text-emerald-300/90">{SERVER.ip}</span>
      <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 transition group-hover:bg-emerald-400/25">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Check className="h-3.5 w-3.5" />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Copy className="h-3.5 w-3.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <AnimatePresence>
        {copied && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200"
          >
            Скопировано!
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
