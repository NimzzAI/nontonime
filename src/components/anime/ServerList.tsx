import { Link } from "@tanstack/react-router";
import { isDownloadableUrl } from "@/lib/utils";
import type { StreamServer } from "@/lib/anime-types";

export function ServerList({
  servers,
  episodeId,
  animeId,
}: {
  servers: StreamServer[];
  episodeId: string;
  animeId: string;
}) {
  if (servers.length === 0) {
    return <p className="text-xs text-muted-foreground">Belum ada server tersedia untuk episode ini.</p>;
  }

  const groups = new Map<string, StreamServer[]>();
  for (const server of servers) {
    const list = groups.get(server.quality) ?? [];
    list.push(server);
    groups.set(server.quality, list);
  }

  return (
    <div className="space-y-3">
      {[...groups.entries()].map(([quality, list]) => (
        <div key={quality} className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {quality || "Default"}
          </p>
          <div className="space-y-1.5">
            {list.map((server) => (
              <div
                key={server.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-1.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-card-foreground">{server.name}</p>
                  {server.fileSizeMb ? (
                    <p className="text-[10px] text-muted-foreground">{server.fileSizeMb.toFixed(0)} MB</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    to="/watch/$episodeId"
                    params={{ episodeId }}
                    search={{ a: animeId }}
                    className="rounded-full border border-border px-2 py-1 text-[11px] font-semibold text-card-foreground transition-colors hover:bg-accent"
                  >
                    Putar
                  </Link>
                  {isDownloadableUrl(server.url) ? (
                    <a
                      href={server.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground"
                    >
                      Unduh
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
