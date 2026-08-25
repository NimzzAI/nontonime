import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, LoadingState, SectionTitle } from "@/components/anime/StateViews";
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

const TODAY = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(new Date());

function SchedulePage() {
  const { data, isPending, error, refetch } = useQuery(scheduleQuery());

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <SectionTitle title="Jadwal Rilis Mingguan" icon="fa-solid fa-calendar-days" />
      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {data
        ? data.data.map((day) => {
            const isToday = day.day.toLowerCase() === TODAY.toLowerCase();
            return (
              <section key={day.day} className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-display text-base font-bold tracking-tight text-foreground">
                    {day.day}
                    {isToday ? <span className="ml-1.5 text-primary">(Hari Ini)</span> : null}
                  </h3>
                  <span className="text-xs text-muted-foreground">{day.anime_list.length} Anime</span>
                </div>
                <div
                  className={cn(
                    "divide-y divide-border overflow-hidden rounded-xl border bg-card shadow-sm",
                    isToday ? "border-primary/40" : "border-border",
                  )}
                >
                  {day.anime_list.map((anime) => (
                    <Link
                      key={anime.slug}
                      to="/anime/$animeId"
                      params={{ animeId: anime.slug }}
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-accent"
                    >
                      <img
                        src={anime.poster}
                        alt={anime.title}
                        loading="lazy"
                        className="h-16 w-12 shrink-0 rounded-lg object-cover"
                      />
                      <span className="line-clamp-2 text-sm font-medium text-card-foreground">{anime.title}</span>
                      <i className="fa-solid fa-chevron-right ml-auto shrink-0 text-xs text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </section>
            );
          })
        : null}
    </div>
  );
}
