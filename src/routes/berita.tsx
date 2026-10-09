import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Newspaper } from "lucide-react";
import { ErrorState, SectionTitle } from "@/components/anime/StateViews";
import { newsQuery } from "@/lib/queries";

export const Route = createFileRoute("/berita")({
  head: () => ({
    meta: [
      { title: "Berita Anime : Nontonime" },
      {
        name: "description",
        content: "Kabar terbaru dunia anime, dikumpulkan dari beberapa sumber.",
      },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { data, isPending, error, refetch } = useQuery(newsQuery(1));

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <SectionTitle title="Berita Anime" icon={Newspaper} />

      {isPending && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary/60" />
          ))}
        </div>
      )}

      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && data.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
          Berita belum bisa dimuat dari sumbernya. Coba lagi beberapa saat lagi.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-3 rounded-2xl border border-border/80 bg-card p-3 transition-colors hover:border-primary/40"
          >
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-24 w-24 shrink-0 rounded-xl object-cover"
              />
            ) : null}
            <div className="min-w-0 space-y-1">
              <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary">
                {item.title}
              </h3>
              {item.description && (
                <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              )}
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                {item.postedAt}
                <ExternalLink className="h-3 w-3" />
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
