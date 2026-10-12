import rawFirebaseConfig from "../../firebase-applet-config.json";

/**
 * Unggah avatar dan banner ke Supabase Storage.
 * Identitas dicek lewat ID token Firebase (Identity Toolkit), lalu file ditulis memakai
 * service role key yang hanya ada di server. Kunci itu tidak pernah dikirim ke browser.
 */

export type MediaKind = "avatar" | "banner";

const BUCKETS: Record<MediaKind, string> = { avatar: "avatars", banner: "banners" };
const MAX_BYTES: Record<MediaKind, number> = { avatar: 1_000_000, banner: 2_500_000 };
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function env(name: string): string {
  return (typeof process !== "undefined" ? process.env[name] : undefined) ?? "";
}

function supabaseConfig(): { url: string; key: string } {
  const url = env("SUPABASE_URL").replace(/\/+$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error(
      "Supabase belum dikonfigurasi di server (SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return { url, key };
}

interface VerifiedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedUser> {
  const apiKey = env("VITE_FIREBASE_API_KEY") || rawFirebaseConfig.apiKey;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );
  if (!res.ok) throw new Error("Sesi login tidak valid atau sudah kedaluwarsa. Coba masuk ulang.");
  const json = (await res.json()) as {
    users?: { localId?: string; email?: string; emailVerified?: boolean }[];
  };
  const u = json.users?.[0];
  if (!u?.localId) throw new Error("Akun tidak ditemukan.");
  return { uid: u.localId, email: u.email ?? null, emailVerified: u.emailVerified === true };
}

function detectMime(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

async function pruneOldFiles(
  cfg: { url: string; key: string },
  bucket: string,
  uid: string,
  keepName: string,
): Promise<void> {
  try {
    const list = await fetch(`${cfg.url}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.key}`,
        apikey: cfg.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefix: uid, limit: 50 }),
    });
    if (!list.ok) return;
    const files = (await list.json()) as { name?: string }[];
    const stale = files
      .map((f) => f.name)
      .filter((n): n is string => Boolean(n) && n !== keepName)
      .map((n) => `${uid}/${n}`);
    if (stale.length === 0) return;
    await fetch(`${cfg.url}/storage/v1/object/${bucket}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${cfg.key}`,
        apikey: cfg.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: stale }),
    });
  } catch {
    // pembersihan file lama hanya penghematan ruang, boleh gagal
  }
}

export async function uploadProfileMediaServer(input: {
  kind: MediaKind;
  idToken: string;
  data: string;
}): Promise<{ url: string }> {
  const cfg = supabaseConfig();
  const user = await verifyFirebaseIdToken(input.idToken);

  const bytes = Uint8Array.from(Buffer.from(input.data, "base64"));
  if (bytes.length === 0) throw new Error("File kosong.");
  if (bytes.length > MAX_BYTES[input.kind]) {
    throw new Error(
      `Ukuran ${input.kind === "avatar" ? "avatar" : "banner"} terlalu besar setelah dikompres.`,
    );
  }
  const mime = detectMime(bytes);
  if (!mime) throw new Error("Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.");

  const bucket = BUCKETS[input.kind];
  const fileName = `${Date.now()}.${EXT[mime]}`;
  const objectPath = `${user.uid}/${fileName}`;

  const res = await fetch(`${cfg.url}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.key}`,
      apikey: cfg.key,
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[supabase] upload gagal", res.status, detail.slice(0, 200));
    throw new Error(
      res.status === 404
        ? `Bucket "${bucket}" belum dibuat di Supabase. Jalankan supabase/setup.sql.`
        : "Gagal mengunggah ke Supabase Storage.",
    );
  }

  void pruneOldFiles(cfg, bucket, user.uid, fileName);
  return { url: `${cfg.url}/storage/v1/object/public/${bucket}/${objectPath}` };
}
