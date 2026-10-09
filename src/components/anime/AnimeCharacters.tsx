import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic2 } from "lucide-react";
import { charactersQuery } from "@/lib/queries";

/** Karakter dan pengisi suara (fitur dari hianime-api). Section disembunyikan bila datanya kosong. */
export function AnimeCharacters({ title }: { title: string }) {
  const { data } = useQuery(charactersQuery(title));
  const [showAll, setShowAll] = useState(false);

  if (!data || data.length === 0) return null;
  const visible = showAll ? data : data.slice(0, 8);

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-foreground sm:text-lg">
          <Mic2 className="h-4 w-4 text-primary" />
          Karakter & Pengisi Suara
        </h2>
        {data.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            {showAll ? "Tampilkan sedikit" : `Lihat semua (${data.length})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {visible.map((c) => {
          const va = c.voiceActors[0];
          return (
            <div
              key={`${c.name}-${c.role}`}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-2.5"
            >
              {c.image ? (
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-14 w-11 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold">
                  {c.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">{c.name}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{c.role}</p>
              </div>
              {va && (
                <div className="flex min-w-0 max-w-[45%] items-center gap-2 text-right">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-foreground">{va.name}</p>
                    <p className="text-[10px] text-muted-foreground">{va.language}</p>
                  </div>
                  {va.image && (
                    <img
                      src={va.image}
                      alt={va.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
