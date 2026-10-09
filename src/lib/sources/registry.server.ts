import { animein } from "./animein.server";
import { aniwatch } from "./aniwatch.server";
import { gomunime } from "./gomunime.server";
import { nontonanimeid } from "./nontonanimeid.server";
import { samehadaku } from "./samehadaku.server";
import { stucknime } from "./stucknime.server";
import type { AnimeSource, SourceId } from "./types";

// Urutan di sini menentukan prioritas saat judul yang sama muncul dari beberapa sumber
const ALL_SOURCES: Record<SourceId, AnimeSource> = {
  animein,
  nontonanimeid,
  gomunime,
  aniwatch,
  stucknime,
  samehadaku,
};

export const DEFAULT_SOURCE_IDS: SourceId[] = [
  "animein",
  "samehadaku",
  "aniwatch",
  "gomunime",
  "stucknime",
  "nontonanimeid",
];

export function enabledSourceIds(): SourceId[] {
  return DEFAULT_SOURCE_IDS;
}

export function enabledSources(): AnimeSource[] {
  return enabledSourceIds().map((id) => ALL_SOURCES[id]);
}

export function getSource(id: SourceId): AnimeSource {
  return ALL_SOURCES[id];
}
