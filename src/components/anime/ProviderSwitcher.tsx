import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Sparkles, Zap, Flame, Globe } from "lucide-react";
import { useAnimeProvider, PROVIDERS, type AnimeProvider } from "@/lib/provider";
import { cn } from "@/lib/utils";

export function ProviderSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { provider, setProvider, meta } = useAnimeProvider();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={dropdownRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/50 text-foreground transition-all duration-200 hover:bg-secondary cursor-pointer",
          compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs font-semibold shadow-xs",
          provider === "samehadaku"
            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
            : "hover:border-primary/40",
        )}
        title="Ganti Sumber / Provider Anime (Otakudesu / Samehadaku)"
        aria-label="Pilih Provider Anime"
      >
        {provider === "samehadaku" ? (
          <Zap className="h-3.5 w-3.5 text-emerald-400 shrink-0 fill-emerald-400/20" />
        ) : (
          <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
        )}

        <span className="font-bold truncate max-w-[100px] sm:max-w-none">
          {provider === "samehadaku" ? "Samehadaku" : "Otakudesu"}
        </span>

        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 z-50 w-72 origin-top-right rounded-2xl border border-border/80 bg-card p-2 text-foreground shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-border/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Pilih Sumber Konten (Provider)
            </span>
          </div>

          <div className="p-1 space-y-1">
            {PROVIDERS.map((p) => {
              const isSelected = p.id === provider;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProvider(p.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 rounded-xl p-2.5 text-left transition cursor-pointer",
                    isSelected
                      ? "bg-secondary border border-border/80 shadow-xs"
                      : "hover:bg-secondary/60 border border-transparent",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5",
                      p.id === "samehadaku"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-primary/15 text-primary border border-primary/30",
                    )}
                  >
                    {p.id === "samehadaku" ? (
                      <Zap className="h-4 w-4 fill-emerald-400/20" />
                    ) : (
                      <Flame className="h-4 w-4 fill-primary/20" />
                    )}
                  </div>

                  <div className="flex-1 space-y-0.5 truncate">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">{p.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t border-border/60 text-[10px] text-muted-foreground text-center">
            Tips: Beralih ke <strong>Samehadaku</strong> untuk resolusi 1080p, 4K, & x265.
          </div>
        </div>
      )}
    </div>
  );
}
