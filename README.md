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

Nontonime adalah platform streaming anime dengan subtitle Indonesia, dibangun full-stack di atas **TanStack Start**. Seluruh data anime (katalog, jadwal, detail, episode, tautan streaming/unduhan) diambil server-side dari sumber pihak ketiga lewat lapisan proxy internal, lalu dirender lewat server functions supaya halaman tetap cepat diakses. Tidak ada sistem akun — riwayat tontonan, watchlist, dan subscribe notifikasi disimpan langsung di penyimpanan lokal perangkat pengguna.

## Sumber Data

Data anime discrape dari **animeinweb.com** lewat `src/lib/animein.server.ts`, sebuah client server-only (native `fetch`, tanpa dependency tambahan) yang meniru proxy internal situs tersebut, lengkap dengan header, secret proxy, timeout 15 detik, dan rate limit 60 request/menit per IP. Semua pemanggilan lewat `createServerFn` (`src/lib/anime.functions.ts`) sehingga secret proxy tidak pernah terekspos ke browser.

Beberapa catatan penting soal sumber data ini:

- **Sekali panggil, langsung dapat semua server & kualitas** — endpoint stream episode mengembalikan seluruh server + resolusi sekaligus, jadi ganti kualitas/server di halaman nonton tidak perlu fetch ulang.
- **Episode tidak tahu induk animenya sendiri** — API stream cuma balikin info episode, bukan anime induknya. Karena itu halaman `/watch/$episodeId` membawa context lewat query param `?a=<animeId>` (otomatis terpasang di semua tautan internal). Kalau halaman nonton dibuka langsung tanpa context ini (mis. link lama tanpa `?a=`), player tetap jalan tapi daftar episode, judul anime, dan riwayat tontonan tidak bisa ditampilkan.
- **"Ongoing" & "Tamat" hasil filter, bukan endpoint khusus** — API sumber tidak punya endpoint terpisah untuk status ongoing/tamat, jadi kedua halaman ini mengambil daftar anime terbaru lalu memfilter berdasarkan teks status yang dikembalikan. Kalau suatu saat teks status di sumbernya berubah format, filter di `src/lib/queries.ts` (`ongoingQuery` / `completedQuery`) mungkin perlu disesuaikan.
- **Unduh per-episode & per-anime** — tombol unduh di setiap episode maupun halaman "Unduh Semua Episode" langsung memakai tautan server yang dikembalikan API (file `.mp4` tampil sebagai tombol Unduh, sumber `.m3u8`/embed hanya bisa diputar).

## Fitur

| Fitur | Deskripsi |
|---|---|
| **Beranda** | Hero slider otomatis dari data live, plus rak Tayang Hari Ini, Trending, Terpopuler, Baru Ditambahkan, Segera Tayang, dan Lanjutkan Nonton |
| **Ongoing & Tamat** | Daftar anime berdasarkan status (hasil filter, lihat [Sumber Data](#sumber-data)), dengan paginasi |
| **Jadwal Rilis** | Jadwal tayang anime per hari dalam seminggu, lengkap dengan poster, hari ini ditandai otomatis |
| **Pencarian** | Cari judul anime dengan hasil berpaginasi |
| **Genre** | Jelajahi anime berdasarkan kategori genre, dengan thumbnail genre |
| **Detail Anime** | Hero backdrop, info ringkas, sinopsis collapsible, tombol lanjut nonton, subscribe, watchlist, dan rekomendasi berbasis genre |
| **Nonton Episode** | Video player dengan pilihan kualitas & server instan (tanpa fetch ulang), episode list, tombol episode sebelumnya/selanjutnya |
| **Download Per-Episode & Per-Anime** | Tombol unduh di setiap episode (popover kualitas & server) plus halaman "Unduh Semua Episode" per anime |
| **Riwayat Tontonan** | Tersimpan otomatis di perangkat, dikelompokkan per hari |
| **Watchlist** | Simpan anime buat ditonton nanti, tersimpan di perangkat |
| **Notifikasi** | Subscribe per anime, notifikasi lokal via Web Push API (lihat bagian [Notifikasi](#notifikasi)) |
| **Navigasi Mobile** | Bottom tab bar (Home/Jadwal/Cari/Riwayat/Profil) khusus layar kecil |
| **PWA** | Bisa di-install ke homescreen HP (manifest + service worker) |

## Tampilan

Desain dirombak total dengan identitas baru bertema "malam maraton nonton anime": latar gelap indigo-plum yang hangat (bukan hitam pekat) dipadukan aksen ganda — kuning keemasan untuk aksi utama dan merah muda lembut untuk badge/notifikasi — dengan tema terang sebagai alternatif. Tipografi memakai **Bricolage Grotesque** untuk judul/heading dan **Plus Jakarta Sans** untuk teks isi. Semua token warna, radius, dan utilitas visual (`glass`, `press-soft`, `card-lift`, skeleton loading, dsb.) diatur terpusat di `src/styles.css`.

Perubahan tata letak yang cukup besar dibanding versi sebelumnya:
- Hero Beranda kini berupa slider berisi anime unggulan asli dari API (bukan video statis) — file `public/hero-bg.mp4` jadi tidak terpakai, boleh dihapus atau dipakai lagi manual kalau mau.
- Bottom tab bar mobile: **Download** diganti **Cari** supaya pencarian lebih mudah dijangkau jempol; akses ke unduhan tetap ada lewat halaman detail anime.
- Episode kini tampil dengan thumbnail asli (bukan cuma nomor), baik di daftar episode maupun grid navigasi.
- Loading state pakai skeleton (bukan cuma spinner) di halaman beranda, grid, dan rak anime.

## Tumpukan Teknologi

- **[TanStack Start](https://tanstack.com/start)** — framework full-stack berbasis React dengan SSR dan server functions
- **[TanStack Router](https://tanstack.com/router)** — routing berbasis file dengan type-safety penuh
- **[TanStack Query](https://tanstack.com/query)** — pengambilan dan caching data dari server functions
- **TypeScript** (strict mode) — penulisan kode yang lebih aman dan terstruktur
- **[Tailwind CSS v4](https://tailwindcss.com/)** — styling utility-first
- **[Embla Carousel](https://www.embla-carousel.com/)** — hero slider di Beranda
- **[Video.js](https://videojs.com/)** — pemutar video untuk sumber `.mp4`/`.m3u8` langsung
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

`.env.example` sudah berisi VAPID key siap pakai untuk fitur notifikasi (lihat bagian [Notifikasi](#notifikasi)) — tinggal disalin ke `.env`. Tidak ada environment variable tambahan yang dibutuhkan untuk sumber data anime (secret proxy sudah ditanam di `animein.server.ts`, hanya berjalan di server).

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
│   ├── anime/       # Komponen fitur anime: card, grid, hero slider, shelf, player,
│   │                #   episode list/grid, popover download, watchlist, nav, state view
│   └── ui/          # Komponen UI dasar (shadcn)
├── lib/
│   ├── animein.server.ts   # Client scraper server-only (fetch + rate limit) ke animeinweb.com
│   ├── anime.functions.ts  # Pembungkus createServerFn per endpoint
│   ├── anime-types.ts      # Tipe data anime/episode/stream/genre/jadwal
│   ├── queries.ts          # React Query options, termasuk filter ongoing/tamat
│   ├── history.ts / watchlist.ts / subscriptions.ts / push.ts  # Penyimpanan lokal + notifikasi
│   └── site-config.ts / utils.ts / theme.ts
├── routes/          # Routing berbasis file (TanStack Router)
│   ├── anime/       # Detail anime
│   ├── watch/       # Halaman nonton episode (butuh query param ?a=<animeId>)
│   ├── download/    # Halaman "Unduh Semua Episode" per anime & info download
│   ├── genre/       # Daftar & filter genre
│   ├── watchlist.tsx
│   └── profil.tsx   # Pengaturan tema & notifikasi
├── router.tsx
├── server.ts
└── start.ts         # Konfigurasi middleware global (termasuk proteksi CSRF)

public/
├── logo.svg               # Logo situs
├── manifest.webmanifest   # Manifest PWA (installable ke homescreen)
├── sw.js                  # Service worker untuk notifikasi push
└── hero-bg.mp4            # Sudah tidak dipakai sejak hero jadi slider data live — aman dihapus
```

## Lisensi

Proyek ini dibuat untuk kebutuhan pribadi/edukasi. Silakan hubungi pemilik repo untuk pertanyaan terkait penggunaan lebih lanjut.

---

<div align="center">
Dibuat oleh <a href="https://github.com/Nimzz-pemboy">Nimzz</a>
</div>
