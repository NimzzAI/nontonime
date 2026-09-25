<div align="center">

<img src="public/og-image.jpg" alt="nontonime" width="100%" />

# nontonime

Platform streaming anime subtitle Indonesia modern — cepat, tanpa iklan mengganggu, tanpa registrasi, dan dioptimalkan untuk performa tinggi.

[![Demo](https://img.shields.io/badge/demo-nontonime.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://nontonime.vercel.app/)
[![Deploy](https://img.shields.io/github/deployments/NimzzAI/nontonime/production?style=for-the-badge&label=vercel&logo=vercel)](https://nontonime.vercel.app/)
[![Repo](https://img.shields.io/badge/github-NimzzAI%2Fnontonime-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/NimzzAI/nontonime)

[![Last Commit](https://img.shields.io/github/last-commit/NimzzAI/nontonime?style=flat-square)](https://github.com/NimzzAI/nontonime/commits/main)
[![Repo Size](https://img.shields.io/github/repo-size/NimzzAI/nontonime?style=flat-square)](https://github.com/NimzzAI/nontonime)
[![Top Language](https://img.shields.io/github/languages/top/NimzzAI/nontonime?style=flat-square)](https://github.com/NimzzAI/nontonime)
[![Stars](https://img.shields.io/github/stars/NimzzAI/nontonime?style=flat-square)](https://github.com/NimzzAI/nontonime/stargazers)
[![License](https://img.shields.io/github/license/NimzzAI/nontonime?style=flat-square)](./LICENSE)

</div>

---

## // Ringkasan Proyek

**nontonime** adalah aplikasi web generasi baru untuk menonton anime berbahasa Indonesia yang dirancang dengan arsitektur modern berbasis TanStack Start (React 19 SSR) dan Nitro Engine. Aplikasi ini memadukan desain visual sinematik dengan efisiensi eksekusi tinggi, privasi lokal penuh, dan tanpa beban pelacakan atau registrasi akun.

Seluruh data anime, jadwal rilis harian, direktori genre, hingga resolusi multi-server diintegrasikan secara _server-side_ melalui Sanka API Proxy dengan lapisan proteksi WAF, failover cadangan, dan konfigurasi IP kustom.

---

## // Penanganan Error 403 Forbidden di Vercel & Rotasi IP

### [+] Penyebab Utama Error 403

Saat melakukan deployment ke **Vercel**, serverless function Vercel menggunakan IP range datacenter (AWS/GCP edge) yang sering kali teridentifikasi sebagai bot dan otomatis diblokir oleh Cloudflare WAF pada host upstream (`sankavollerei.web.id`).

### [+] Solusi: Konfigurasi Environment Variable `SANKA_API_BASE`

Lapisan server `src/lib/animein.server.ts` telah dilengkapi mekanisme **Dynamic Base URL** dan **Automatic Fallback**. Anda dapat mengganti IP atau domain proxy langsung tanpa perlu menyunting kode sumber.

Tambahkan variabel berikut pada menu **Settings -> Environment Variables** di dashboard Vercel Anda:

```env
# URL API Utama (Ganti dengan Reverse Proxy / IP VPS Anda)
SANKA_API_BASE=https://proxy-anime.domainanda.com/anime

# URL API Cadangan (Otomatis digunakan jika URL utama mengembalikan 403 / timeout)
SANKA_API_FALLBACK=https://www.sankavollerei.web.id/anime
```

### [+] Cara Membuat Cloudflare Worker Reverse Proxy (Gratis & Cepat)

Jika Anda tidak memiliki VPS, buat Cloudflare Worker sederhana untuk meneruskan request ke API Sanka:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = "https://www.sankavollerei.web.id" + url.pathname + url.search;

    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    );
    modifiedHeaders.set("Referer", "https://www.sankavollerei.web.id/");
    modifiedHeaders.set("Origin", "https://www.sankavollerei.web.id");

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
```

Setelah worker aktif (misal `https://sanka-proxy.worker-anda.workers.dev`), atur pada Vercel:

```env
SANKA_API_BASE=https://sanka-proxy.worker-anda.workers.dev/anime
```

---

## // Optimasi Performa & Penanganan Kendala Lag

Untuk mengatasi keluhan beban memori dan lag pada peramban berdaya rendah ataupun perangkat seluler, telah diimplementasikan pembaruan performa menyeluruh:

1. **In-Memory Cache & O(1) Indexing (`src/lib/watchlist.ts` & `src/lib/history.ts`)**
   - Menggantikan pembacaan berulang `localStorage.getItem` dan `JSON.parse` yang sebelumnya terpanggil puluhan kali per render kartu.
   - Menggunakan `Set<string>` terindeks untuk pengecekan status anime dalam waktu konstan $O(1)$.
2. **Komponen Termemoisasi (`React.memo`)**
   - `AnimeCard` dan `AnimeListRow` dibungkus dengan `memo` untuk mencegah siklus _re-render_ massal saat status UI lokal berubah.
3. **Pemuatan Aset Asinkron (`decoding="async"` & `loading="lazy"`)**
   - Menghilangkan _frame drops_ saat menggulir (_scrolling_) katalog ratusan judul anime.
4. **Optimasi Render Siklus & CPU (`HeroSlider` & `TrendingSlider`)**
   - Event listener pengguliran di-_throttle_ menggunakan `requestAnimationFrame`.
   - Timer putar otomatis (_auto-slide_) dijeda saat tab berada di latar belakang (`document.hidden`) guna menghemat daya baterai dan memori CPU.
5. **Konfigurasi Cache TanStack Query yang Terukur**
   - `staleTime: 5 menit` dan `gcTime: 15 menit` dengan mematikan `refetchOnWindowFocus` yang tidak perlu, memangkas lonjakan _network waterfall_ yang memicu lag.
6. **Penghapusan FontAwesome CDN Eksternal**
   - Seluruh ikon dimigrasikan secara penuh ke pustaka ringan `lucide-react`, memotong dependensi stylesheet eksternal yang memblokir rendering awal halaman.

---

## // Lapisan Penanganan Error Otomatis & Diagnostik Stream

Aplikasi kini dilengkapi dengan arsitektur pemutar video mandiri yang tangguh untuk mengatasi berbagai kendala sumber video (seperti CDN down, CORS blocking, atau ISP filtering):

### 1. Penanganan Error Otomatis (Automated Failover Layer)

- **Deteksi Kegagalan Multilapis**: Mendeteksi otomatis error native HTML5/Video.js (`MEDIA_ERR_NETWORK`, `MEDIA_ERR_SRC_NOT_SUPPORTED`, `MEDIA_ERR_DECODE`), buffer macet berkepanjangan (_stall_ > 10 detik), maupun kegagalan koneksi frame iframe.
- **Peralihan Server Tanpa Intervensi**: Saat server aktif mengalami kendala, sistem akan memicu _countdown_ visual 2 detik dan secara otomatis mengalihkan pemutaran ke server cadangan berikutnya (`Odstream`, `Filedon`, `Mega`, dll.) tanpa perlu tindakan manual dari pengguna.
- **Pencegahan Infinite Loop**: Menyimpan daftar server yang telah gagal pada sesi episode berjalan agar server rusak tidak dicoba berulang-ulang. Jika seluruh server telah habis dicoba, pemutar menampilkan kartu diagnosa komprehensif dengan opsi coba ulang atau pembukaan di tab baru.
- **Kendali Pengguna**: Opsi **Auto-Failover** dapat dinyalakan/dimatikan kapan saja melalui tombol toggle di bilah kontrol pemutar.

### 2. Panel Diagnostik Stream Real-Time (Live HUD)

Dapat diakses langsung melalui tombol **"Diagnostik"** pada pemutar video untuk membantu proses debugging:

- **Sumber Streaming Aktif**: Menampilkan URL target lengkap, domain host penyedia, dan mode pemutar aktif (`Native HTML5`, `Local Range Proxy`, `MEGA Decrypted`, atau `Iframe Embed`).
- **Validasi Content-Type**: Memeriksa tipe konten upstream (`video/mp4`, `application/x-mpegURL`, `text/html`) untuk memastikan sumber merupakan file media riil dan bukan halaman web yang diblokir.
- **Status HTTP Range Request (RFC 7233)**: Menampilkan status header `Accept-Ranges: bytes`, status respons `HTTP 206 Partial Content`, dan offset `Content-Range` byte untuk verifikasi kemampuan seeking instan.
- **Konektivitas & Buffer Health**: Mengukur latensi ping round-trip (ms), posisi detik pemutaran, durasi buffer ke depan (_buffered ahead seconds_), dan resolusi video riil.
- **Log Riwayat Failover & Ekspor JSON**: Mencatat kronologi kegagalan server serta menyediakan tombol satu-klik **"Salin Laporan (JSON)"** untuk pelaporan bug teknis.

### 3. Proxy Streaming Lokal Tanpa Buffering (`src/lib/stream-proxy.server.ts`)

- **Forwarding HTTP Range Request**: Mendukung penuh potongan byte acak (`Range: bytes=X-Y`) sehingga fitur seek, pause, dan resume pada file video besar (>500MB) berjalan lancar.
- **Zero In-Memory Buffering**: Meneruskan stream byte secara langsung sebagai `ReadableStream` ke peramban tanpa membebani memori server.
- **Bypass CORS & Proteksi SSRF**: Menginjeksi header `Access-Control-Allow-Origin: *` sembari memblokir akses ke host privat/internal.

### 4. Pengunduh Segmen Range HTTP & Penyimpanan Offline (`src/lib/download-manager.ts`)

- **Segmented Range Requests (RFC 7233)**: Memecah file video besar (>500MB) menjadi blok-blok segmen 2MB yang diunduh secara independen melalui proxy streaming.
- **Jeda & Lanjutkan (Pause & Resume)**: Karena setiap segmen byte tersimpan bertahap ke IndexedDB (`task_chunks`), pengunduhan dapat dijeda dan dilanjutkan kapan saja tanpa harus mengulang dari 0%.
- **Penyimpanan Lokal IndexedDB**: Segmen yang selesai diunduh dirakit menjadi objek `Blob` terpadu dan disimpan dalam object store `offline_episodes` untuk pemutaran bebas kuota.
- **Pemutar Video Offline Bawaan (`OfflinePlayerModal`)**: Memutar file hasil unduhan langsung melalui Blob URL dengan kendali kecepatan putar (0.75x–2x), mode bioskop, dan opsi ekspor file MP4 ke disk komputer/ponsel.
- **Download Manager Dialog (`DownloadManagerModal`) & Rute `/download`**: Antarmuka terpadu untuk memantau progress bar riil, estimasi waktu (ETA), kecepatan (MB/s), serta sisa ruang penyimpanan perangkat.

---

## // Fitur Utama & Fungsionalitas

| Kategori           | Fitur                                 | Penjelasan Teknis                                                                                                                                                      |
| :----------------- | :------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pencarian**      | **Spotlight Search (`Ctrl+K` / `/`)** | Modal pencarian cepat dengan filter status, tahun rilis, dan genre, serta navigasi pintasan keyboard instan.                                                           |
| **Pemutar Video**  | **Watch Enhancements**                | Pencahayaan dinamis bioskop (_Ambient Light_), Timer Mati Otomatis (_Sleep Timer_ 15–60 menit), Mode Bioskop (_Theater_), dan tombol loncat episode berikutnya.        |
| **Pemutar Video**  | **Automated Failover Layer**          | Deteksi kegagalan playback otomatis (error media, stall timeout, upstream blokir) dan peralihan otomatis ke server cadangan berikutnya tanpa intervensi manual.        |
| **Pemutar Video**  | **Stream Diagnostic Overlay (HUD)**   | Panel diagnostik live: pemantauan sumber streaming aktif, validasi `Content-Type`, verifikasi status `HTTP Range Request (RFC 7233)`, latensi ping, dan buffer health. |
| **Unduhan**        | **Segmented Range Downloader**        | Pengunduh file video besar per blok segmen 2MB via `HTTP Range (RFC 7233)` dengan fitur jeda (pause), lanjutkan (resume), dan perhitungan kecepatan transfer riil.     |
| **Penyimpanan**    | **Koleksi Offline (IndexedDB)**       | Penyimpanan episode anime langsung ke memori lokal peramban untuk pemutaran offline 100% tanpa kuota internet dengan pemutar video bawaan & ekspor file.               |
| **Koleksi**        | **Watchlist Manajemen Penuh**         | Pengelompokan status (Rencana Tonton, Sedang Nonton, Selesai Ditonton), rating personal, catatan episode, serta fitur **Ekspor & Impor Cadangan JSON**.                |
| **Riwayat**        | **Statistik Tontonan**                | Perhitungan otomatis total episode yang diselesaikan, estimasi durasi tontonan, dan pencarian riwayat berbasis kata kunci.                                             |
| **Pratinjau**      | **Quick Preview Modal**               | Menampilkan sinopsis, skor, status, dan tombol aksi cepat tanpa perlu memuat halaman detail anime.                                                                     |
| **Katalog**        | **Hero & Trending Slider**            | Showcase visual dinamis berkecepatan tinggi dengan navigasi responsif dan indikator radar tayang langsung.                                                             |
| **Jadwal & Genre** | **Direktori Komprehensif**            | Jadwal rilis mingguan terstruktur per hari serta indeks kategori genre lengkap.                                                                                        |
| **Notifikasi**     | **Web Push Native**                   | Berlangganan pengingat rilis episode anime favorit langsung ke peramban tanpa memerlukan akun pengguna.                                                                |
| **PWA**            | **Aksesibilitas PWA**                 | Kemampuan instalasi sebagai aplikasi mandiri di perangkat seluler dan desktop dengan dukungan offline state view.                                                      |

---

## // Tumpukan Teknologi

- **Kerangka Kerja**: [TanStack Start](https://tanstack.com/start) (React 19, Full-stack SSR, Server Functions)
- **Routing**: [TanStack Router](https://tanstack.com/router) (File-based, 100% Type-Safe)
- **Manajemen Kueri**: [TanStack Query v5](https://tanstack.com/query)
- **Animasi Antarmuka**: [Motion](https://motion.dev/) (Spring physics & Layout transitions)
- **Penataan Gaya**: [Tailwind CSS v4](https://tailwindcss.com/) dengan skema token OKLCH
- **Koleksi Ikon**: [Lucide React](https://lucide.dev/)
- **Carousel Slider**: [Embla Carousel](https://www.embla-carousel.com/)
- **Pemutar Media**: [Video.js](https://videojs.com/)
- **Komponen Notifikasi**: [Sonner](https://sonner.emilkowal.ski/)
- **Mesin Deployment**: [Nitro Engine](https://nitro.build/) (Kompatibel dengan Vercel, Netlify, Node.js)

---

## // Panduan Penginstalan & Eksekusi Lokal

### Prasyarat

- **Node.js**: versi 20.x atau lebih baru
- **npm**, **pnpm**, atau **yarn**

### Langkah Instalasi

```bash
# 1. Kloning repositori
git clone https://github.com/NimzzAI/nontonime.git
cd nontonime

# 2. Pasang dependensi
npm install

# 3. Konfigurasi berkas lingkungan
cp .env.example .env

# 4. Jalankan server pengembangan
npm run dev
```

Aplikasi dapat dibuka pada alamat `http://localhost:3000`.

---

## // Variabel Lingkungan (.env)

```env
# VAPID Keys untuk Notifikasi Push Web
VAPID_PRIVATE_KEY=
VITE_VAPID_PUBLIC_KEY=

# URL API Sanka (Ganti jika terjadi blokir 403 Forbidden di Vercel)
# Default: https://www.sankavollerei.web.id/anime
SANKA_API_BASE=

# URL API Cadangan Otomatis
SANKA_API_FALLBACK=
```

---

## // Perintah Eksekusi Proyek

| Perintah          | Fungsi                                                  |
| :---------------- | :------------------------------------------------------ |
| `npm run dev`     | Menjalankan server pengembangan lokal (port 3000)       |
| `npm run build`   | Melakukan kompilasi produksi berkas klien dan server    |
| `npm run preview` | Menjalankan pratinjau hasil build produksi secara lokal |
| `npm run lint`    | Memeriksa kepatuhan kode dan sintaks dengan ESLint      |
| `npm run format`  | Merapikan format kode dengan Prettier                   |

---

## // Struktur Direktori

```
src/
├── components/
│   ├── anime/               # Komponen spesifik (Card, Slider, Player, Spotlight, Watchlist)
│   └── ui/                  # Komponen primitif UI (Dialog, Popover, Tooltip, dll.)
├── lib/
│   ├── animein.server.ts    # Lapisan komunikasi Sanka API (Proxy, Headers, Fallback)
│   ├── anime.functions.ts   # TanStack Start Server Functions
│   ├── anime-types.ts       # Definisi antarmuka TypeScript terpadu
│   ├── queries.ts           # Definisi kueri data TanStack Query
│   ├── history.ts           # Manajemen riwayat tontonan dengan memory cache
│   ├── watchlist.ts         # Manajemen daftar tontonan dengan index Set
│   └── site-config.ts       # Konfigurasi metadata aplikasi nontonime
├── routes/                  # Rute berbasis berkas TanStack Router
└── styles.css               # Definisi token warna dan utilitas gaya
```

---

<div align="center">
Dikembangkan dan dipelihara secara aktif oleh <strong>NimzzAI</strong>.
</div>
