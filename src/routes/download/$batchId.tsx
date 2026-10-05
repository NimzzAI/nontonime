import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Archive, ArrowLeft, Download } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/anime/StateViews";
import { animeDetailQuery, batchQuery } from "@/lib/queries";

export const Route = createFileRoute("/download/$batchId")({
  head: ({ params }) => {
    const name = params.batchId.replace(/-/g, " ");
    return {
      meta: [
        { title: `Unduh Batch ${name} : Nontonime` },
        {
          name: "description",
          content: `Tautan unduhan paket lengkap batch ${name} subtitle Indonesia.`,
        },
        { property: "og:title", content: `Unduh Batch ${name} : Nontonime` },
        {
          property: "og:description",
          content: `Tautan unduhan batch ${name} subtitle Indonesia.`,
        },
      ],
    };
  },
  component: BatchPage,
});

function BatchPage() {
  const { batchId } = Route.useParams();

  // Try batch query first
  const batchRes = useQuery(batchQuery(batchId));
  // If batchId is actually animeId, fallback to anime detail
  const animeRes = useQuery({
    ...animeDetailQuery(batchId),
    enabled: Boolean(batchRes.isError || (!batchRes.data && !batchRes.isPending)),
  });

  if (batchRes.isPending) return <LoadingState label="Memuat paket unduhan batch..." />;

  const batchData = batchRes.data;

  if (batchData && batchData.downloadUrl?.formats?.length > 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {batchData.poster ? (
            <img
              src={batchData.poster}
              alt={batchData.title}
              className="w-32 sm:w-40 rounded-2xl border border-border/80 object-cover shadow-lg shrink-0"
            />
          ) : null}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary px-3 py-0.5 text-xs font-bold">
              <Archive className="h-3.5 w-3.5" />
              PAKET BATCH LENGKAP
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
              {batchData.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Unduh seluruh episode dalam satu paket arsip subtitle Indonesia.
            </p>
            {batchData.animeId ? (
              <Link
                to="/anime/$animeId"
                params={{ animeId: batchData.animeId }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline pt-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke detail anime
              </Link>
            ) : null}
          </div>
        </div>

        {/* Formats and Qualities */}
        <div className="space-y-6">
          {batchData.downloadUrl.formats.map((fmt, idx) => (
            <div
              key={fmt.title || idx}
              className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-sm"
            >
              <h2 className="font-display text-base font-bold text-foreground border-b border-border/60 pb-2.5">
                {fmt.title}
              </h2>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {fmt.qualities.map((q) => (
                  <div
                    key={q.title}
                    className="rounded-xl border border-border/70 bg-background/70 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground bg-primary/15 text-primary px-2 py-0.5 rounded-md">
                        {q.title}
                      </span>
                      {q.size ? (
                        <span className="font-semibold text-muted-foreground">{q.size}</span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {q.urls.map((link) => (
                        <a
                          key={link.title + link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="press-soft inline-flex items-center gap-1 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent hover:border-primary/50"
                        >
                          <Download className="h-3 w-3 text-primary" />
                          {link.title}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback if detail is loaded
  if (animeRes.data) {
    const anime = animeRes.data;
    return (
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div className="flex items-start gap-4">
          {anime.poster ? (
            <img
              src={anime.poster}
              alt={anime.title}
              className="w-28 rounded-2xl border border-border object-cover"
            />
          ) : null}
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-foreground">{anime.title}</h1>
            <p className="text-sm text-muted-foreground">
              Tautan unduhan per episode tersedia di dalam halaman nonton episode terkait.
            </p>
            <Link
              to="/anime/$animeId"
              params={{ animeId: batchId }}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke detail anime
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <ErrorState
        error={batchRes.error || new Error("Paket unduhan batch tidak ditemukan")}
        onRetry={() => batchRes.refetch()}
      />
    </div>
  );
}
