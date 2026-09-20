import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorState, LoadingState, SectionTitle } from "@/components/anime/StateViews";
import { SCHEDULE_DAYS } from "@/lib/anime-types";
import { scheduleQuery, currentDayName } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jadwal")({
  head: () => ({
    meta: [
      { title: "Jadwal Rilis Anime Mingguan — Nontonime" },
      {
        name: "description",
        content:
          "Jadwal rilis anime episode baru subtitle Indonesia setiap hari dari Senin sampai Minggu.",
      },
      { property: "og:title", content: "Jadwal Rilis Anime Mingguan — Nontonime" },
      { property: "og:description", content: "Jadwal rilis anime mingguan subtitle Indonesia." },
    ],
  }),
  component: SchedulePage,
});

function titleCase(day: string) {
  return day.charAt(0) + day.slice(1).toLowerCase();
}

function SchedulePage() {
  const { data, isPending, error, refetch } = useQuery(scheduleQuery());
  const todayDay = currentDayName().toUpperCase();
  const [selectedDay, setSelectedDay] = useState<string>("ALL");

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionTitle title="Jadwal Rilis Mingguan" icon="fa-solid fa-calendar-days" />
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full self-start sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Hari ini: {titleCase(todayDay)}
        </span>
      </div>

      {/* Day Filter Pills */}
      <div className="edge-fade no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <button
          onClick={() => setSelectedDay("ALL")}
          className={cn(
            "press-soft rounded-full px-4 py-1.5 text-xs font-bold transition-all shrink-0",
            selectedDay === "ALL"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-card border border-border/80 text-foreground hover:bg-accent",
          )}
        >
          Semua Hari
        </button>
        {SCHEDULE_DAYS.map((day) => {
          const isToday = day === todayDay;
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "press-soft relative inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold transition-all shrink-0",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : isToday
                    ? "border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                    : "border border-border/80 bg-card text-foreground hover:bg-accent",
              )}
            >
              {titleCase(day)}
              {isToday ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
            </button>
          );
        })}
      </div>

      {isPending ? <LoadingState label="Memuat jadwal rilis mingguan..." /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}

      {data ? (
        <div className="space-y-8">
          {SCHEDULE_DAYS.filter((day) => selectedDay === "ALL" || selectedDay === day).map(
            (day) => {
              const items = data[day] ?? [];
              const isToday = day === todayDay;
              return (
                <section key={day} className="space-y-3">
                  <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                        {titleCase(day)}
                      </h3>
                      {isToday ? (
                        <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-extrabold text-primary-foreground">
                          HARI INI
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {items.length} Anime
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <div className="rounded-2xl border border-border/60 bg-card/40 p-6 text-center text-xs text-muted-foreground">
                      Belum ada jadwal anime untuk hari ini.
                    </div>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((anime) => (
                        <Link
                          key={anime.id}
                          to="/anime/$animeId"
                          params={{ animeId: anime.id }}
                          className="press-soft group flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-2.5 shadow-2xs transition hover:border-primary/50 hover:bg-accent"
                        >
                          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
                            {anime.poster ? (
                              <img
                                src={anime.poster}
                                alt={anime.title}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <i className="fa-solid fa-clapperboard text-xs text-primary/60" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="line-clamp-2 text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                              {anime.title}
                            </h4>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                              <i className="fa-solid fa-play text-[9px] text-primary" />
                              Lihat Episode
                            </span>
                          </div>

                          <i className="fa-solid fa-chevron-right text-xs text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 mr-1" />
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              );
            },
          )}
        </div>
      ) : null}
    </div>
  );
}
