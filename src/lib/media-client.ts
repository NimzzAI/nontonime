import { auth } from "./firebase";
import { uploadProfileMedia } from "./media.functions";

export type ProfileImageKind = "avatar" | "banner";

const LIMITS: Record<ProfileImageKind, { maxInput: number; w: number; h: number; quality: number }> = {
  avatar: { maxInput: 8 * 1024 * 1024, w: 512, h: 512, quality: 0.86 },
  banner: { maxInput: 12 * 1024 * 1024, w: 1600, h: 600, quality: 0.82 },
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gambar tidak bisa dibaca. Coba file lain."));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Gagal membaca gambar."));
    reader.readAsDataURL(blob);
  });
}

/** Memotong ke rasio target (cover) dan mengecilkan, supaya upload kecil dan seragam. */
async function compressImage(file: File, kind: ProfileImageKind): Promise<Blob> {
  const { w, h, quality } = LIMITS[kind];
  const img = await loadImage(file);
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung pemrosesan gambar.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH);
  const webp = await canvasToBlob(canvas, "image/webp", quality);
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await canvasToBlob(canvas, "image/jpeg", quality);
  if (!jpeg) throw new Error("Gagal memproses gambar.");
  return jpeg;
}

/** Kompres di browser, lalu kirim ke server yang menyimpannya di Supabase. Mengembalikan URL publik. */
export async function uploadProfileImage(kind: ProfileImageKind, file: File): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Masuk dengan akun Google atau email dulu untuk mengunggah gambar.");
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  if (file.size > LIMITS[kind].maxInput) {
    throw new Error(`Ukuran file terlalu besar (maks ${LIMITS[kind].maxInput / 1024 / 1024} MB).`);
  }
  const blob = await compressImage(file, kind);
  const data = await blobToBase64(blob);
  const idToken = await user.getIdToken();
  const { url } = await uploadProfileMedia({ data: { kind, idToken, data } });
  return url;
}
