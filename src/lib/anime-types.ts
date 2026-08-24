export interface ApiEnvelope<T> {
  ok?: boolean;
  status?: string;
  statusCode?: number;
  message?: string;
  data: T;
  pagination?: Pagination | null;
}

export interface Pagination {
  currentPage: number;
  hasPrevPage: boolean;
  prevPage: number | null;
  hasNextPage: boolean;
  nextPage: number | null;
  totalPages: number;
}

export interface Genre {
  title: string;
  genreId: string;
}

export interface AnimeCardData {
  title: string;
  poster: string;
  animeId: string;
  episodes?: number | null;
  releaseDay?: string;
  latestReleaseDate?: string;
  lastReleaseDate?: string;
  status?: string;
  score?: string;
  genreList?: Genre[];
}

export interface HomeData {
  ongoing: { animeList: AnimeCardData[] };
  completed: { animeList: AnimeCardData[] };
}

export interface AnimeListData {
  animeList: AnimeCardData[];
}

export interface EpisodeListItem {
  title: string;
  eps: number;
  date?: string;
  episodeId: string;
  views?: number | string | null;
}

export interface AnimeDetail {
  title: string;
  poster: string;
  japanese: string;
  score: string;
  producers: string;
  type: string;
  status: string;
  episodes: number | null;
  duration: string;
  aired: string;
  studios: string;
  views?: number | string | null;
  batch: { batchId: string; title?: string } | null;
  synopsis: { paragraphs: string[] };
  genreList: Genre[];
  episodeList: EpisodeListItem[];
  recommendedAnimeList?: AnimeCardData[];
}

export interface DownloadFormatGroup {
  formats: {
    title: string;
    qualities: { title: string; size: string; urls: { title: string; url: string }[] }[];
  }[];
}

export interface ServerItem {
  title: string;
  serverId: string;
}

export interface QualityGroup {
  title: string;
  serverList: ServerItem[];
}

export interface EpisodeDetail {
  title: string;
  animeId: string;
  releaseTime?: string;
  defaultStreamingUrl?: string;
  hasPrevEpisode: boolean;
  prevEpisode: { episodeId: string } | null;
  hasNextEpisode: boolean;
  nextEpisode: { episodeId: string } | null;
  server: { qualities: QualityGroup[] };
  downloadUrl?: DownloadFormatGroup | null;
  info?: Record<string, unknown>;
}

export interface ScheduleDay {
  day: string;
  anime_list: { title: string; slug: string; poster: string }[];
}

export interface BatchDetail {
  title: string;
  animeId: string;
  poster: string;
  japanese?: string;
  type?: string;
  score?: string;
  episodes?: number | null;
  duration?: string;
  studios?: string;
  producers?: string;
  aired?: string;
  genreList?: Genre[];
  downloadUrl: DownloadFormatGroup;
}
