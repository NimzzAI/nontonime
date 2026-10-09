import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getCharacters,
  getNews,
  getNextEpisode,
  getTopSearch,
} from "./sources/extras.server";

const titleInput = (data: unknown) => z.object({ title: z.string().min(1).max(200) }).parse(data);

export const fetchNextEpisode = createServerFn({ method: "GET" })
  .inputValidator(titleInput)
  .handler(({ data }) => getNextEpisode(data.title));

export const fetchCharacters = createServerFn({ method: "GET" })
  .inputValidator(titleInput)
  .handler(({ data }) => getCharacters(data.title));

export const fetchNews = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ page: z.number().int().min(1).max(20).default(1) }).parse(data ?? {}),
  )
  .handler(({ data }) => getNews(data.page));

export const fetchTopSearch = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({}).parse(data ?? {}))
  .handler(() => getTopSearch());
