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
  getCompleted,
  getSchedule,
  getStream,
  getBatch,
  resolveServer,
  search,
} from "./animein.server";

export const fetchHome = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        day: z.string().optional(),
        provider: z.string().optional(),
      })
      .parse(data ?? {}),
  )
  .handler(({ data }) => getHome(data.day ?? null, data.provider ?? "otakudesu"));

export const fetchLatest = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        page: z.number().int().min(1),
        provider: z.string().optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => getLatest(data.page, data.provider ?? "otakudesu"));

export const fetchPopular = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        page: z.number().int().min(1),
        provider: z.string().optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => getPopular(data.page, data.provider ?? "otakudesu"));

export const fetchCompleted = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        page: z.number().int().min(1),
        provider: z.string().optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => getCompleted(data.page, data.provider ?? "otakudesu"));

export const fetchSearch = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        keyword: z.string().max(100),
        page: z.number().int().min(1),
        provider: z.string().optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => search(data.keyword, data.page, data.provider ?? "otakudesu"));

export const fetchGenres = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        provider: z.string().optional(),
      })
      .parse(data ?? {}),
  )
  .handler(({ data }) => getGenres(data.provider ?? "otakudesu"));

export const fetchByGenre = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        genreId: z.string().min(1),
        page: z.number().int().min(1),
        sort: z.string().optional(),
        provider: z.string().optional(),
      })
      .parse(data),
  )
  .handler(({ data }) =>
    getByGenre(data.genreId, data.page, data.sort ?? "views", data.provider ?? "otakudesu"),
  );

export const fetchSchedule = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        provider: z.string().optional(),
      })
      .parse(data ?? {}),
  )
  .handler(({ data }) => getSchedule(data.provider ?? "otakudesu"));

export const fetchDirectory = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        provider: z.string().optional(),
      })
      .parse(data ?? {}),
  )
  .handler(({ data }) => getDirectory(data.provider ?? "otakudesu"));

export const fetchDetail = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().min(1).max(150),
        provider: z.string().optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => getDetail(data.id, data.provider ?? "otakudesu"));

export const fetchStream = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        episodeId: z.string().min(1).max(150),
        provider: z.string().optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => getStream(data.episodeId, data.provider ?? "otakudesu"));

export const fetchResolveServer = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        serverId: z.string().min(1),
        provider: z.string().optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => resolveServer(data.serverId, data.provider ?? "otakudesu"));

export const fetchBatch = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        batchId: z.string().min(1),
        provider: z.string().optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => getBatch(data.batchId, data.provider ?? "otakudesu"));
