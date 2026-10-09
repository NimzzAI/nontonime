import { useState } from "react";
import { LogIn } from "lucide-react";
import { AuthModal } from "@/components/anime/AuthModal";

export function LoginPrompt({ message }: { message: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/80 bg-secondary/30 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <LogIn className="h-6 w-6" />
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 cursor-pointer"
      >
        Masuk / Daftar
      </button>
      <AuthModal open={open} onOpenChange={setOpen} initialTab="login" />
    </div>
  );
}
