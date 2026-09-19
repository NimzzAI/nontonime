import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Ganti tema"
      className="press-soft inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-card-foreground transition-colors hover:border-primary"
    >
      <i className={theme === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun"} />
    </button>
  );
}
