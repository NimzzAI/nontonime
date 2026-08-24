<div align="center">

<img src="public/og-image.jpg" alt="Nontonime" width="100%" />

# Nontonime

Website streaming anime subtitle Indonesia — tanpa akun, tanpa ribet.

[![Demo](https://img.shields.io/badge/demo-nontonime.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://nontonime.vercel.app/)
[![Deploy](https://img.shields.io/github/deployments/Nimzz-pemboy/nontonime/production?style=for-the-badge&label=vercel&logo=vercel)](https://nontonime.vercel.app/)

[![Last Commit](https://img.shields.io/github/last-commit/Nimzz-pemboy/nontonime?style=flat-square)](https://github.com/Nimzz-pemboy/nontonime/commits/main)
[![Repo Size](https://img.shields.io/github/repo-size/Nimzz-pemboy/nontonime?style=flat-square)](https://github.com/Nimzz-pemboy/nontonime)
[![Top Language](https://img.shields.io/github/languages/top/Nimzz-pemboy/nontonime?style=flat-square)](https://github.com/Nimzz-pemboy/nontonime)
[![Stars](https://img.shields.io/github/stars/Nimzz-pemboy/nontonime?style=flat-square)](https://github.com/Nimzz-pemboy/nontonime/stargazers)
[![Forks](https://img.shields.io/github/forks/Nimzz-pemboy/nontonime?style=flat-square)](https://github.com/Nimzz-pemboy/nontonime/network/members)
[![Issues](https://img.shields.io/github/issues/Nimzz-pemboy/nontonime?style=flat-square)](https://github.com/Nimzz-pemboy/nontonime/issues)
[![License](https://img.shields.io/github/license/Nimzz-pemboy/nontonime?style=flat-square)](./LICENSE)

</div>

---

## Tentang

Nontonime adalah platform streaming anime dengan subtitle Indonesia, dibangun full-stack di atas **TanStack Start**. Semua data anime (katalog, jadwal, detail episode, link download) diambil dari API eksternal dan dirender secara server-side, sehingga halaman tetap cepat diakses meski tanpa JavaScript penuh di sisi klien. Tidak ada sistem akun — riwayat tontonan disimpan langsung di penyimpanan lokal perangkat pengguna.

## Fitur

| Fitur | Deskripsi |
|---|---|
| **Beranda** | Menampilkan anime yang sedang tayang (ongoing) dan yang baru tamat |
| **Ongoing & Tamat** | Daftar lengkap anime berdasarkan status, dengan paginasi |
| **Jadwal Rilis** | Jadwal tayang anime per hari dalam seminggu, lengkap dengan poster |
| **Pencarian** | Cari judul anime dari seluruh katalog |
| **Genre** | Jelajahi anime berdasarkan kategori genre |
| **Detail Anime** | Hero backdrop, info ringkas, sinopsis collapsible, tombol lanjut nonton & subscribe |
| **Nonton Episode** | Video player dengan pilihan kualitas/server, plus daftar episode di panel samping |
| **Download Batch & Per-Episode** | Tautan unduhan per batch maupun per episode (pilihan resolusi) |
| **Riwayat Tontonan** | Tersimpan otomatis di perangkat, tanpa perlu login |
| **Watchlist** | Simpan anime buat ditonton nanti, tersimpan di perangkat |
| **Notifikasi** | Subscribe per anime, notifikasi lokal via Web Push API (lihat bagian [Notifikasi](#notifikasi)) |
| **Navigasi Mobile** | Bottom tab bar (Home/Jadwal/History/Download/Profil) khusus layar kecil |
| **PWA** | Bisa di-install ke homescreen HP (manifest + service worker) |

## Tampilan

UI memakai gaya minimalis-lembut: sudut membulat, border tipis, bayangan halus, dan efek blur kaca (`glass`) di header serta bottom nav. Semua token warna/radius diatur terpusat di `src/styles.css`.

## Tumpukan Teknologi

- **[TanStack Start](https://tanstack.com/start)** — framework full-stack berbasis React dengan SSR dan server functions
- **[TanStack Router](https://tanstack.com/router)** — routing berbasis file dengan type-safety penuh
- **[TanStack Query](https://tanstack.com/query)** — pengambilan dan caching data dari API
- **TypeScript** — penulisan kode yang lebih aman dan terstruktur
- **[Tailwind CSS v4](https://tailwindcss.com/)** — styling utility-first
- **[Video.js](https://videojs.com/)** — pemutar video untuk streaming episode
- **Web Push API** — notifikasi native browser/HP lewat Service Worker + VAPID (bukan Firebase Cloud Messaging)
- **[Nitro](https://nitro.build/)** (preset Vercel) — server runtime untuk deployment

## Pengembangan Lokal

Butuh Node.js terpasang di komputer.

```sh
git clone https://github.com/Nimzz-pemboy/nontonime.git
cd nontonime
npm install
cp .env.example .env
npm run dev
```

Aplikasi akan berjalan di `http://localhost:8080`.

`.env.example` sudah berisi VAPID key siap pakai untuk fitur notifikasi (lihat bagian [Notifikasi](#notifikasi)) — tinggal disalin ke `.env`.

### Skrip yang tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan server pengembangan |
| `npm run build` | Build untuk produksi |
| `npm run preview` | Menjalankan hasil build secara lokal |
| `npm run lint` | Memeriksa kualitas kode dengan ESLint |
| `npm run format` | Merapikan format kode dengan Prettier |

## Build untuk Produksi

```sh
npm run build
npm run preview
```

## Deployment

Proyek ini di-deploy di **Vercel** menggunakan preset Nitro `vercel`, sehingga server function dan SSR berjalan sebagai serverless function tanpa konfigurasi tambahan.

**Live:** [nontonime.vercel.app](https://nontonime.vercel.app/)

## Notifikasi

Fitur subscribe/notifikasi di halaman detail anime memakai **Web Push API bawaan browser** (Service Worker + `PushManager` + VAPID) — bukan Firebase Cloud Messaging maupun SDK pihak ketiga lain.

Yang sudah aktif:
- Minta izin notifikasi & bikin Push Subscription asli lewat tombol **Subscribe**
- Notifikasi lokal langsung muncul di bar notifikasi HP (konfirmasi subscribe, tombol tes di halaman **Profil**)
- Anime yang di-subscribe tersimpan di perangkat (`src/lib/subscriptions.ts`), bisa dilihat/dihapus dari halaman Profil
- Service worker (`public/sw.js`) sudah siap menerima & menampilkan push message beneran, termasuk buka halaman anime terkait saat notifikasi diklik

Yang **belum** ada (perlu dikerjakan terpisah kalau mau notifikasi otomatis saat episode baru rilis):
- Backend untuk menyimpan Push Subscription per pengguna (database)
- Cron/scheduler untuk mengecek episode baru dan memicu pengiriman push (pakai kunci privat VAPID + library `web-push` di server)

Variabel environment terkait (lihat `.env.example`):

| Variabel | Dipakai di | Keterangan |
|---|---|---|
| `VITE_VAPID_PUBLIC_KEY` | Client | Aman diekspos, dipakai saat `pushManager.subscribe()` |
| `VAPID_PRIVATE_KEY` | Server (belum dipakai) | **Jangan** taruh di kode client; simpan sebagai secret di hosting saat backend pengirim push dibuat |

Generate ulang key sendiri kapan saja lewat `npx web-push generate-vapid-keys`.

## Struktur Proyek

```
src/
├── components/
│   ├── anime/       # Komponen khusus fitur anime (grid, player, nav, episode list, state view)
│   └── ui/          # Komponen UI dasar
├── lib/             # Query, tipe data, konfigurasi situs, riwayat, watchlist, subscribe, push, utilitas
├── routes/          # Routing berbasis file (TanStack Router)
│   ├── anime/       # Detail anime
│   ├── watch/       # Halaman nonton episode
│   ├── download/    # Halaman batch download & daftar download
│   ├── genre/       # Daftar & filter genre
│   ├── watchlist.tsx
│   └── profil.tsx   # Pengaturan tema & notifikasi
├── router.tsx
├── server.ts
└── start.ts         # Konfigurasi middleware global (termasuk proteksi CSRF)

public/
├── logo.svg               # Logo situs (ganti dengan logo asli kapan pun)
├── manifest.webmanifest   # Manifest PWA (installable ke homescreen)
├── sw.js                  # Service worker untuk notifikasi push
└── hero-bg.mp4            # (opsional) video background hero Beranda — tambahkan sendiri
```

## Lisensi

Proyek ini dibuat untuk kebutuhan pribadi/edukasi. Silakan hubungi pemilik repo untuk pertanyaan terkait penggunaan lebih lanjut.

---

<div align="center">
Dibuat oleh <a href="https://github.com/Nimzz-pemboy">Nimzz</a>
</div>
