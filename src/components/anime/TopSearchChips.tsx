import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { topSearchQuery } from "@/lib/queries";

/** Kata kunci yang sedang ramai dicari (fitur Top Search dari hianime-api). */
export function TopSearchChips() {
  const { data } = useQuery(topSearchQuery());
  if (!data || data.length === 0) return null;
  return (
    <div className="mx-auto max-w-xl space-y-2 pt-4">
      <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        Sedang banyak dicari
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {data.map((term) => (
          <Link
            key={term}
            to="/cari"
            search={{ q: term, page: 1, genre: "", status: "all" }}
            className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {term}
          </Link>
        ))}
      </div>
    </div>
  );
}
