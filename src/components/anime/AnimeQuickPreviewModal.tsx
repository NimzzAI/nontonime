import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { animeDetailQuery } from "@/lib/queries";
import { WatchlistButton } from "./WatchlistButton";
import { ShareButton } from "./ShareButton";
import {
  CheckCircle2,
  Film,
  Layers,
  Play,
  Star,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import type { AnimeSummary } from "@/lib/anime-types";

interface QuickPreviewModalProps {
  anime: AnimeSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnimeQuickPreviewModal({ anime, open, onOpenChange }: QuickPreviewModalProps) {
  const animeId = anime?.id ?? "";
  const { data: detail, isPending } = useQuery({
    ...animeDetailQuery(animeId),
    enabled: open && Boolean(animeId),
  });

  if (!anime) return null;

  const title = detail?.title || anime.title;
  const poster = detail?.poster || anime.poster;
  const score = detail?.score || anime.score;
  const isOngoing = /ongoing|tayang/i.test(detail?.status ?? anime.status ?? "");
  const isCompleted = /tamat|complete/i.test(detail?.status ?? anime.status ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden border border-border/80 bg-background/95 p-0 backdrop-blur-2xl sm:rounded-2xl shadow-2xl">
        {/* Banner with blurred background poster */}
        <div className="relative h-44 w-full overflow-hidden bg-muted">
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="h-full w-full object-cover object-center blur-md scale-110 opacity-40"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

          {/* Floating Poster thumbnail & Titles */}
          <div className="absolute inset-x-4 bottom-3 flex items-end gap-3.5">
            <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-lg border-2 border-border/80 bg-card shadow-lg sm:w-24">
              {poster ? (
                <img src={poster} alt={title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <Film className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-0.5">
              <div className="flex items-center gap-2 mb-1">
                {isOngoing ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    ONGOING
                  </span>
                ) : isCompleted ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    TAMAT
                  </span>
                ) : null}

                {score ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold">
                    <Star className="h-2.5 w-2.5 fill-amber-400" />
                    {score}
                  </span>
                ) : null}
              </div>

              <DialogTitle className="line-clamp-2 font-display text-base font-bold sm:text-lg text-foreground">
                {title}
              </DialogTitle>
              {detail?.japanese ? (
                <p className="line-clamp-1 text-xs text-muted-foreground">{detail.japanese}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4 p-4 sm:p-5 max-h-[60vh] overflow-y-auto no-scrollbar">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {detail?.type ? (
              <span className="rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 font-medium">
                {detail.type}
              </span>
            ) : null}
            {detail?.duration ? (
              <span className="flex items-center gap-1 rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 font-medium">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {detail.duration}
              </span>
            ) : null}
            {detail?.releaseDay ? (
              <span className="flex items-center gap-1 rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 font-medium">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {detail.releaseDay}
              </span>
            ) : null}
            {detail?.episodes?.length ? (
              <span className="flex items-center gap-1 rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 font-medium">
                <Layers className="h-3 w-3 text-primary" />
                {detail.episodes.length} Episode
              </span>
            ) : null}
          </div>

          {/* Genres */}
          {detail?.genres && detail.genres.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {detail.genres.map((g) => (
                <span
                  key={g.id || g.title}
                  className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold"
                >
                  {g.title}
                </span>
              ))}
            </div>
          ) : null}

          {/* Synopsis */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Sinopsis
            </h4>
            <DialogDescription className="text-xs sm:text-sm text-foreground/90 leading-relaxed max-h-36 overflow-y-auto no-scrollbar pr-1">
              {isPending
                ? "Memuat informasi sinopsis anime..."
                : detail?.synopsis ||
                  "Sinopsis lengkap anime ini belum tersedia. Klik tombol di bawah untuk melihat detail selengkapnya."}
            </DialogDescription>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
            <Link
              to="/anime/$animeId"
              params={{ animeId }}
              onClick={() => onOpenChange(false)}
              className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-md shadow-primary/30 transition-transform active:scale-95 hover:bg-primary/90"
            >
              <Play className="h-4 w-4 fill-current" />
              Buka Halaman Anime
            </Link>

            <WatchlistButton
              animeId={animeId}
              title={title}
              poster={poster}
              variant="default"
              size="md"
            />

            <ShareButton title={title} url={`/anime/${animeId}`} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
