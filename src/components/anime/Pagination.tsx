interface Props {
  page: number;
  totalPages?: number | undefined;
  hasNext?: boolean | undefined;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, hasNext, onChange }: Props) {
  const canPrev = page > 1;
  const canNext = hasNext ?? (totalPages ? page < totalPages : false);

  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <button
        disabled={!canPrev}
        onClick={() => onChange(page - 1)}
        className="press-soft inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <i className="fa-solid fa-chevron-left" />
        Sebelumnya
      </button>
      <span className="text-sm text-muted-foreground">
        Halaman {page}
        {totalPages ? ` dari ${totalPages}` : ""}
      </span>
      <button
        disabled={!canNext}
        onClick={() => onChange(page + 1)}
        className="press-soft inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        Berikutnya
        <i className="fa-solid fa-chevron-right" />
      </button>
    </div>
  );
}
