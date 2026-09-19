export interface AnimeSummary {
  id: string;
  title: string;
  synonyms: string | null;
  type: string | null;
  status: string | null;
  day: string | null;
  year: string | number | null;
  views: number | null;
  favorites: number | null;
  genres: string[];
  poster: string | null;
  cover: string | null;
  airedStart: string | null;
  synopsis: string | null;
}

export interface EpisodeSummary {
  id: string;
  number: number;
  title: string;
  views: number;
  releaseDate: string | null;
  image: string | null;
  isNew: boolean;
}

export interface AnimeDetail extends AnimeSummary {
  studio: string;
  airedEnd: string | null;
  totalEpisodes: number;
  episodes: EpisodeSummary[];
}

export interface HomeSections {
  today: AnimeSummary[];
  popular: AnimeSummary[];
  new: AnimeSummary[];
  hot: AnimeSummary[];
  slider: AnimeSummary[];
  waiting: AnimeSummary[];
}

export interface GenreItem {
  id: string;
  name: string;
  group: string | null;
  image: string | null;
}

export interface ListResult {
  items: AnimeSummary[];
  page: number;
  hasNext: boolean;
}

export type ScheduleMap = Record<string, AnimeSummary[]>;

export interface StreamServer {
  id: string;
  name: string;
  quality: string;
  type: string | null;
  fileSizeMb: number | null;
  url: string;
  serverId: string;
}

export interface StreamResult {
  episode: {
    id: string;
    title: string;
    number: number;
    views: number;
    releaseDate: string | null;
    nextEpisodeId: string | null;
  };
  servers: StreamServer[];
}

export const SCHEDULE_DAYS = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"] as const;

export type ScheduleDay = (typeof SCHEDULE_DAYS)[number];
