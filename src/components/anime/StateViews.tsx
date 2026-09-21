import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Inbox, Loader2, type LucideIcon } from "lucide-react";

export function LoadingState({ label = "Memuat data" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
          <Skeleton className="h-3.5 w-full rounded-full" />
          <Skeleton className="h-3 w-2/3 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function RowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="w-32 shrink-0 space-y-2 sm:w-40">
          <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
          <Skeleton className="h-3.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Terjadi kesalahan saat mengambil data.";
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm">
      <AlertTriangle className="h-7 w-7 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="press-soft rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon: IconProp,
  message,
  action,
}: {
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | string;
  message: string;
  action?: { label: string; to: string };
}) {
  const renderIcon = () => {
    if (!IconProp) return <Inbox className="h-7 w-7 text-muted-foreground" />;
    if (typeof IconProp === "string") {
      if (IconProp.startsWith("fa-")) {
        return <i className={`${IconProp} text-2xl text-muted-foreground`} />;
      }
      return <Inbox className="h-7 w-7 text-muted-foreground" />;
    }
    const IconComp = IconProp as React.ElementType;
    return <IconComp className="h-7 w-7 text-muted-foreground" />;
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm">
      {renderIcon()}
      <p className="text-sm text-muted-foreground">{message}</p>
      {action ? (
        <a href={action.to} className="text-sm font-semibold text-primary hover:underline">
          {action.label}
        </a>
      ) : null}
    </div>
  );
}

export function SectionTitle({
  title,
  icon: IconProp,
}: {
  title: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | string;
}) {
  const renderIcon = () => {
    if (!IconProp) return null;
    if (typeof IconProp === "string") {
      if (IconProp.startsWith("fa-")) {
        return <i className={`${IconProp} text-primary`} />;
      }
      return null;
    }
    const IconComp = IconProp as React.ElementType;
    return <IconComp className="h-5 w-5 text-primary" />;
  };

  return (
    <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-foreground">
      {renderIcon()}
      <span>{title}</span>
    </h2>
  );
}
