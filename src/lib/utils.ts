import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isDirectVideoUrl(url: string) {
  return /\.(m3u8|mp4)(\?|$)/i.test(url);
}

export function isDownloadableUrl(url: string) {
  if (!url) return false;
  return !url.startsWith("#") && !url.startsWith("javascript:");
}

export function formatViews(views: number | string) {
  const n = typeof views === "string" ? parseFloat(views.replace(/[^\d.]/g, "")) : views;
  if (!Number.isFinite(n)) return String(views);
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}Jt`;
  return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}
