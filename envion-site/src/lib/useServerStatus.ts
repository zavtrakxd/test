import { useEffect, useState } from "react";

export interface ServerStatus {
  online: boolean;
  players: { online: number; max: number } | null;
  version: string | null;
  motd: string[] | null;
  loading: boolean;
  error: string | null;
}

const initial: ServerStatus = {
  online: false,
  players: null,
  version: null,
  motd: null,
  loading: true,
  error: null,
};

export function useServerStatus(host: string): ServerStatus {
  const [status, setStatus] = useState<ServerStatus>(initial);

  useEffect(() => {
    let cancelled = false;
    const url = `https://api.mcsrvstat.us/3/${encodeURIComponent(host)}`;

    async function fetchStatus() {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          online?: boolean;
          players?: { online?: number; max?: number };
          version?: string;
          motd?: { clean?: string[] };
        };
        if (cancelled) return;
        setStatus({
          online: Boolean(data.online),
          players:
            data.players && typeof data.players.online === "number"
              ? {
                  online: data.players.online,
                  max: data.players.max ?? 0,
                }
              : null,
          version: data.version ?? null,
          motd: data.motd?.clean ?? null,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setStatus({
          ...initial,
          loading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    void fetchStatus();
    const interval = window.setInterval(fetchStatus, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [host]);

  return status;
}
