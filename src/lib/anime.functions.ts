import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getByGenre,
  getDetail,
  getDirectory,
  getGenres,
  getHome,
  getLatest,
  getPopular,
  getSchedule,
  getStream,
  getBatch,
  resolveServer,
  search,
} from "./animein.server";

export const fetchHome = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ day: z.string().optional() }).parse(data ?? {}))
  .handler(({ data }) => getHome(data.day ?? null));

export const fetchLatest = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ page: z.number().int().min(1) }).parse(data))
  .handler(({ data }) => getLatest(data.page));

export const fetchPopular = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ page: z.number().int().min(1) }).parse(data))
  .handler(({ data }) => getPopular(data.page));

export const fetchSearch = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ keyword: z.string().max(100), page: z.number().int().min(1) }).parse(data),
  )
  .handler(({ data }) => search(data.keyword, data.page));

export const fetchGenres = createServerFn({ method: "GET" }).handler(() => getGenres());

export const fetchByGenre = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        genreId: z.string().min(1),
        page: z.number().int().min(1),
        sort: z.string().optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => getByGenre(data.genreId, data.page, data.sort ?? "views"));

export const fetchSchedule = createServerFn({ method: "GET" }).handler(() => getSchedule());

export const fetchDirectory = createServerFn({ method: "GET" }).handler(() => getDirectory());

export const fetchDetail = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1).max(150) }).parse(data))
  .handler(({ data }) => getDetail(data.id));

export const fetchStream = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ episodeId: z.string().min(1).max(150) }).parse(data),
  )
  .handler(({ data }) => getStream(data.episodeId));

export const fetchResolveServer = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ serverId: z.string().min(1) }).parse(data))
  .handler(({ data }) => resolveServer(data.serverId));

export const fetchBatch = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ batchId: z.string().min(1) }).parse(data))
  .handler(({ data }) => getBatch(data.batchId));
