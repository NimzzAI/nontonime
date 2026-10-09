import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Timer } from "lucide-react";
import { nextEpisodeQuery } from "@/lib/queries";

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "sebentar lagi";
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (d > 0) return `${d} hari ${h} jam ${m} menit`;
  if (h > 0) return `${h} jam ${m} menit`;
  return `${m} menit ${totalSeconds % 60} detik`;
}

/** Hitung mundur episode berikutnya (fitur dari hianime-api). Tidak tampil bila datanya tidak ada. */
export function NextEpisodeCountdown({ title }: { title: string }) {
  const { data } = useQuery(nextEpisodeQuery(title));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!data) return null;

  const target = data.airingAt ? Date.parse(data.airingAt) : NaN;
  const remaining = Number.isFinite(target)
    ? Math.floor((target - now) / 1000)
    : data.secondsUntil !== null
      ? data.secondsUntil - Math.floor((now - data.fetchedAt) / 1000)
      : null;
  if (remaining === null || remaining < -3600) return null;

  const when = Number.isFinite(target)
    ? new Date(target).toLocaleString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
      <Timer className="h-4 w-4 text-primary" />
      <span className="font-bold text-foreground">
        Episode {data.episode} tayang {remaining > 0 ? "dalam" : ""} {formatCountdown(remaining)}
      </span>
      {when && <span className="text-muted-foreground">({when})</span>}
    </div>
  );
}
