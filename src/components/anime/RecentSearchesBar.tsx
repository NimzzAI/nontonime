import { Clock, X, Trash2, ArrowRight } from "lucide-react";
import { useRecentSearches } from "@/lib/recent-searches";
import { cn } from "@/lib/utils";

interface RecentSearchesBarProps {
  onSelectQuery: (query: string) => void;
  className?: string;
  variant?: "chips" | "list";
  maxItems?: number;
}

export function RecentSearchesBar({
  onSelectQuery,
  className,
  variant = "chips",
  maxItems = 8,
}: RecentSearchesBarProps) {
  const { searches, removeRecentSearch, clearRecentSearches } = useRecentSearches();

  if (!searches || searches.length === 0) return null;

  const displaySearches = searches.slice(0, maxItems);

  if (variant === "list") {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-primary" />
            Pencarian Terakhir
          </span>
          <button
            type="button"
            onClick={clearRecentSearches}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <Trash2 className="h-2.5 w-2.5" />
            Hapus Semua
          </button>
        </div>

        <div className="divide-y divide-border/40 rounded-xl border border-border/70 bg-card/60 p-1">
          {displaySearches.map((term) => (
            <div
              key={term}
              className="group flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors hover:bg-secondary/70"
            >
              <button
                type="button"
                onClick={() => onSelectQuery(term)}
                className="flex flex-1 items-center gap-2 text-left text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Clock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                <span className="truncate">{term}</span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelectQuery(term)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary transition-opacity cursor-pointer"
                  title="Cari kata kunci ini"
                >
                  <ArrowRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentSearch(term);
                  }}
                  className="p-1 text-muted-foreground/60 hover:text-destructive transition-colors cursor-pointer"
                  title="Hapus dari riwayat"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card/50 p-3 sm:p-4 space-y-2.5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>Pencarian Terakhir</span>
          <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 text-[10px]">
            {searches.length}
          </span>
        </div>
        <button
          type="button"
          onClick={clearRecentSearches}
          className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
          <span>Hapus Riwayat</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {displaySearches.map((term) => (
          <div
            key={term}
            className="group inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/50 dark:bg-white/5 pl-3 pr-1.5 py-1 text-xs font-semibold text-foreground hover:border-primary/50 hover:bg-secondary transition-all"
          >
            <button
              type="button"
              onClick={() => onSelectQuery(term)}
              className="cursor-pointer hover:text-primary transition-colors"
            >
              {term}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeRecentSearch(term);
              }}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors cursor-pointer"
              title={`Hapus "${term}"`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
