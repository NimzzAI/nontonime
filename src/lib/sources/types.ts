import type { DownloadQualityGroup } from "../anime-types";

export type SourceId =
  | "animein"
  | "nontonanimeid"
  | "gomunime"
  | "aniwatch"
  | "stucknime"
  | "samehadaku";

export interface SourceItem {
  id: string;
  source: SourceId;
  title: string;
  poster: string | null;
  cover: string | null;
  type: string | null;
  status: string | null;
  score: string | null;
  year: string | null;
  genres: string[];
  synopsis: string | null;
  episodeLabel: string | null;
  day: string | null;
  views: number | null;
}

export interface SourcePage {
  items: SourceItem[];
  hasNext: boolean;
}

export interface SourceGenre {
  id: string;
  name: string;
  image: string | null;
}

export interface SourceEpisode {
  id: string;
  number: number;
  title: string;
  date: string | null;
}

export interface SourceDetail {
  id: string;
  source: SourceId;
  title: string;
  japanese: string | null;
  poster: string | null;
  cover: string | null;
  synopsis: string | null;
  status: string | null;
  type: string | null;
  score: string | null;
  genres: string[];
  studio: string | null;
  producers: string | null;
  duration: string | null;
  aired: string | null;
  year: string | null;
  episodes: SourceEpisode[];
  recommended: SourceItem[];
}

export type ServerRef =
  | { kind: "url"; url: string }
  | {
      kind: "nontonanimeid";
      post: string;
      nume: string;
      name: string;
      nonce: string;
      ajax: string;
      ref: string;
    }
  | {
      kind: "samehadaku";
      post: string;
      nume: string;
      type: string;
      ref: string;
    };

export interface SourceServer {
  name: string;
  quality: string;
  ref: ServerRef;
}

export interface SourceStream {
  id: string;
  animeId: string;
  title: string;
  releaseTime: string | null;
  servers: SourceServer[];
  downloads: DownloadQualityGroup[];
  prevEpisodeId: string | null;
  nextEpisodeId: string | null;
}

export interface HomeFeed {
  slider?: SourceItem[];
  today?: SourceItem[];
  hot?: SourceItem[];
  popular?: SourceItem[];
  latest?: SourceItem[];
  waiting?: SourceItem[];
  movies?: SourceItem[];
}

export interface AnimeSource {
  readonly id: SourceId;
  readonly label: string;
  readonly homeUsesDay?: boolean;
  getHome?(day: string | null): Promise<HomeFeed>;
  getLatest?(page: number): Promise<SourcePage>;
  getPopular?(page: number): Promise<SourcePage>;
  search(keyword: string, page: number): Promise<SourcePage>;
  getGenres?(): Promise<SourceGenre[]>;
  getByGenre?(genre: string, page: number): Promise<SourcePage>;
  getSchedule?(): Promise<Record<string, SourceItem[]>>;
  getDetail(slug: string): Promise<SourceDetail>;
  getStream(slug: string): Promise<SourceStream>;
}
