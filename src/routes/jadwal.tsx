import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, LoadingState, SectionTitle } from "@/components/anime/StateViews";
import { SCHEDULE_DAYS } from "@/lib/anime-types";
import { scheduleQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jadwal")({
  head: () => ({
    meta: [
      { title: "Jadwal Rilis Anime Mingguan — Nontonime" },
      { name: "description", content: "Jadwal rilis anime setiap hari dalam seminggu, lengkap dengan poster." },
      { property: "og:title", content: "Jadwal Rilis Anime Mingguan — Nontonime" },
      { property: "og:description", content: "Jadwal rilis anime setiap hari dalam seminggu." },
    ],
  }),
  component: SchedulePage,
});

function titleCase(day: string) {
  return day.charAt(0) + day.slice(1).toLowerCase();
}

const TODAY = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(new Date()).toUpperCase();

function SchedulePage() {
  const { data, isPending, error, refetch } = useQuery(scheduleQuery());

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <SectionTitle title="Jadwal Rilis Mingguan" icon="fa-solid fa-calendar-days" />
      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {data
        ? SCHEDULE_DAYS.map((day) => {
            const items = data[day] ?? [];
            const isToday = day === TODAY;
            return (
              <section key={day} className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-display text-base font-bold tracking-tight text-foreground">
                    {titleCase(day)}
                    {isToday ? <span className="ml-1.5 text-primary">(Hari Ini)</span> : null}
                  </h3>
                  <span className="text-xs text-muted-foreground">{items.length} Anime</span>
                </div>
                <div
                  className={cn(
                    "divide-y divide-border overflow-hidden rounded-2xl border bg-card shadow-sm",
                    isToday ? "border-primary/40" : "border-border",
                  )}
                >
                  {items.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">Belum ada jadwal untuk hari ini.</p>
                  ) : (
                    items.map((anime) => (
                      <Link
                        key={anime.id}
                        to="/anime/$animeId"
                        params={{ animeId: anime.id }}
                        className="flex items-center gap-3 p-3 transition-colors hover:bg-accent"
                      >
                        <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {anime.poster ? (
                            <img src={anime.poster} alt={anime.title} loading="lazy" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <span className="line-clamp-2 text-sm font-medium text-card-foreground">{anime.title}</span>
                        <i className="fa-solid fa-chevron-right ml-auto shrink-0 text-xs text-muted-foreground" />
                      </Link>
                    ))
                  )}
                </div>
              </section>
            );
          })
        : null}
    </div>
  );
}
