import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ title, text }: { title: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      return;
    }
  }

  return (
    <button
      onClick={handleShare}
      className="press-soft inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground shadow-sm transition-colors hover:bg-accent"
    >
      {copied ? <Check className="h-4 w-4 text-primary" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Tersalin" : "Bagikan"}
    </button>
  );
}
