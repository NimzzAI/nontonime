export interface AnimeSummary {
  id: string;
  title: string;
  poster: string | null;
  score?: string | number | null;
  episodeCount?: number | null;
  status?: string | null;
  type?: string | null;
  releaseDay?: string | null;
  latestReleaseDate?: string | null;
  genres?: string[];
  synopsis?: string | null;
  year?: string | number | null;
  views?: number | null;
  day?: string | null;
  cover?: string | null;
  studios?: string | null;
}

export interface EpisodeSummary {
  id: string;
  number: number;
  title: string;
  releaseDate?: string | null;
}

export interface BatchInfo {
  title: string;
  batchId: string;
  href?: string;
  otakudesuUrl?: string;
}

export interface AnimeDetail extends AnimeSummary {
  japanese?: string | null;
  producers?: string | null;
  duration?: string | null;
  aired?: string | null;
  studio?: string | null;
  batch?: BatchInfo | null;
  episodes: EpisodeSummary[];
  recommended?: AnimeSummary[];
}

export interface ServerQualityOption {
  title: string;
  serverId: string;
  href?: string;
}

export interface QualityServerGroup {
  quality: string;
  serverList: ServerQualityOption[];
}

export interface DownloadUrlItem {
  title: string;
  url: string;
}

export interface DownloadQualityGroup {
  quality: string;
  size: string | null;
  urls: DownloadUrlItem[];
}

export interface StreamResult {
  title: string;
  animeId: string;
  episodeId: string;
  releaseTime?: string | null;
  defaultStreamingUrl: string | null;
  hasPrevEpisode: boolean;
  prevEpisodeId?: string | null;
  hasNextEpisode: boolean;
  nextEpisodeId?: string | null;
  servers: {
    qualities: QualityServerGroup[];
  };
  downloads: DownloadQualityGroup[];
  info?: {
    credit?: string;
    encoder?: string;
    duration?: string;
    type?: string;
    genreList?: { title: string; genreId: string }[];
    episodeList?: { title: string; eps: number; episodeId: string }[];
  };
}

export interface HomeSections {
  slider: AnimeSummary[];
  today: AnimeSummary[];
  hot: AnimeSummary[];
  popular: AnimeSummary[];
  new: AnimeSummary[];
  waiting: AnimeSummary[];
}

export interface GenreItem {
  id: string;
  name: string;
  group?: string | null;
  image?: string | null;
}

export interface ListPagination {
  currentPage: number;
  hasPrevPage: boolean;
  prevPage: number | null;
  hasNextPage: boolean;
  nextPage: number | null;
  totalPages: number;
}

export interface ListResult {
  items: AnimeSummary[];
  page: number;
  hasNext: boolean;
  totalPages?: number;
  pagination?: ListPagination | null;
}

export type ScheduleMap = Record<string, AnimeSummary[]>;

export interface BatchDetail {
  title: string;
  animeId: string;
  poster: string | null;
  downloadUrl: {
    formats: {
      title: string;
      qualities: {
        title: string;
        size: string;
        urls: { title: string; url: string }[];
      }[];
    }[];
  };
}

export interface DirectoryGroup {
  startWith: string;
  animeList: {
    title: string;
    animeId: string;
    href?: string;
  }[];
}

export const SCHEDULE_DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

export type ScheduleDay = (typeof SCHEDULE_DAYS)[number];
