import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { uploadProfileMediaServer } from "./media-upload.server";

export const uploadProfileMedia = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        kind: z.enum(["avatar", "banner"]),
        idToken: z.string().min(20).max(4000),
        // base64 dari gambar yang sudah dikompres di klien, batas ±2,6 MB
        data: z.string().min(100).max(3_500_000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => uploadProfileMediaServer(data));
