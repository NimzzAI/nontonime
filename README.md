<p align="center">
  <img src="public/og-image.jpg" alt="Nontonime Banner" width="100%" style="border-radius: 12px; max-width: 1200px;" />
</p>

<div align="center">

# Nontonime

**Platform Streaming, Tracking, & Komunitas Anime Modern Berbasis TanStack Start**

[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-React%2019%20SSR-FF4154?style=for-the-badge&logo=react&logoColor=white)](https://tanstack.com/start)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.2-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

[🚀 Demo Langsung](https://nontonime.vercel.app/) • [📖 English Documentation](README.en.md) • [🐞 Laporkan Masalah](https://github.com/NimzzAI/nontonime/issues)

</div>

---

## 📌 Ringkasan Proyek

**Nontonime** adalah aplikasi web modern berkinerja tinggi untuk streaming, tracking, dan komunitas anime subtitle Indonesia. Dibangun di atas arsitektur full-stack modern dengan **TanStack Start (React 19 Server Components & SSR)**, mesin ini mengagregasi konten secara langsung dari delapan sumber independen menggunakan distributed scraping layer di server — tanpa ketergantungan API komersial pihak ketiga dan tanpa server backend eksternal yang lambat.

Dilengkapi dengan **Zero-Buffering Stream Proxy** berstandar RFC 7233 (HTTP Range Request forwarding), sistem **Auto-Failover Cerdas**, pemutar video multi-server, pengunduh luring (IndexedDB chunking), sistem gamifikasi komunitas, hingga sinkronisasi data real-time berbasis Firebase dan Supabase Storage.

---

## ✨ Fitur Unggulan

### 🎬 Pemutar Media & Streaming Engine

- **Multi-Server Streaming**: Dukungan pemutaran format langsung `.mp4`, `.m3u8` (HLS), dan dynamic iframe embed dengan isolasi sandbox.
- **Smart Automated Failover**: Pemutar secara otomatis mendeteksi kegagalan jaringan atau video macet (>10 detik) dan beralih mulus ke server cadangan berikutnya.
- **Zero-Buffering RFC 7233 Proxy**: Forwarding byte-range transparan untuk seek instan tanpa mengunduh seluruh berkas ke memori server.
- **Sub Indo Preference**: Deteksi otomatis dan prioritas tertinggi untuk server berbahasa Indonesia dengan resolusi terbaik (1080p FHD / 720p HD).
- **Subtitel Kustom**: Pengguna dapat mengunggah file `.srt` atau `.vtt` lokal secara instan ke pemutar.

### 🌐 Mesin Agregasi & Pencarian Cerdas

- **Cross-Source Search**: Pencarian paralel berkecepatan tinggi dengan normalisasi kata kunci (`sub indo`, `season N`, `episode`) dan deduplikasi judul identik.
- **Unified Catalog**: Beranda, rilis terbaru, populer, jadwal tayang mingguan, dan katalog genre yang disatukan secara mulus dari berbagai sumber.
- **Batch Download Finder**: Integrasi pencarian otomatis batch unduhan anime lengkap (Kusonime integration).

### ⚡ Fitur Offline & PWA

- **Segmented Offline Downloader**: Pengunduhan berkas per chunk 2 MB langsung ke IndexedDB browser, mendukung jeda (_pause_) dan lanjutkan (_resume_).
- **PWA Lengkap**: Responsif mobile-first, navigasi bilah bawah adaptif, safe-area inset support, dan penginstalan ke layar utama.

### 👥 Ekosistem Sosial & Gamifikasi (Firebase & Supabase)

- **Profil & Kustomisasi**: Avatar, banner profil WebP (Supabase Storage), border avatar eksklusif, dan biografi.
- **Gamifikasi Komunitas**: Perolehan EXP, Leveling, gelar rank, daily streak, dan badge interaktif berdasarkan riwayat tontonan.
- **Interaksi Real-time**: Komentar berbalas per episode, sistem klan/guild, follow antar-wibu, daftar teman, serta pesan obrolan langsung (Chat).

---

## 🏗️ Matriks Sumber Data

Setiap penyedia didefinisikan sebagai modul terpisah di `src/lib/sources/` yang mengimplementasikan kontrak interface `AnimeSource`.

| Sumber            |       ID        | Prefiks |             Beranda              | Katalog Berhalaman |    Cari    | Genre | Jadwal | Batch Unduhan |
| :---------------- | :-------------: | :-----: | :------------------------------: | :----------------: | :--------: | :---: | :----: | :-----------: |
| **AnimeIn**       |    `animein`    |  `ai`   |  Slider, Hari Ini, Hot, Populer  |   ✅ Bertingkat    |     ✅     |  ✅   |   ✅   |      ❌       |
| **NontonAnimeID** | `nontonanimeid` |  `na`   |      Terbaru, Populer, Film      |   ✅ Bertingkat    |     ✅     |  ✅   |   ✅   |      ✅       |
| **NontonAnime**   |  `nontonanime`  |  `nn`   |                -                 |         -          |     ✅     |  ❌   |   ❌   |      ✅       |
| **Gomunime**      |   `gomunime`    |  `gm`   |         Terbaru, Populer         |     Halaman 1      |     ✅     |  ✅   |   ❌   |      ❌       |
| **Aniwatch**      |   `aniwatch`    |  `aw`   |         Terbaru, Populer         |     Halaman 1      |     ✅     |  ✅   |   ❌   |      ❌       |
| **Stucknime**     |   `stucknime`   |  `stk`  |             Terbaru              |     Halaman 1      |     ✅     |  ✅   |   ❌   |      ❌       |
| **Samehadaku**    |  `samehadaku`   |  `sh`   |     Terbaru, Populer, Movie      |     Halaman 1      |     ✅     |  ❌   |   ❌   |      ✅       |
| **Nimegami**      |   `nimegami`    |  `ng`   | Slider, Hari Ini, Populer, Rilis |   ✅ Bertingkat    |     ✅     |  ✅   |   ❌   |      ✅       |
| **Kusonime**      |        -        |  `ks`   |                -                 |         -          | Batch Only |  ❌   |   ❌   |      ✅       |

---

## 🛡️ Arsitektur Proxy & Bypass

Banyak penyedia upstream menerapkan proteksi CORS, verifikasi `Referer`, dan _frame-busting_. Seluruh kendala tersebut dieliminasi secara server-side melalui empat endpoint proxy terpadu:

```
[ Klien Browser ]
       │
       ├──► /api/stream-proxy   ──► Forwarding HTTP Range RFC 7233, bypass CORS, normalisasi Content-Type (video/mp4)
       ├──► /api/embed-proxy    ──► Injeksi <base>, eliminasi frame-buster, dekode player & HTML5 bypass
       ├──► /api/nimegami-proxy ──► Stream decryptor & CORS relay khusus Nimegami/BerkasDrive
       ├──► /api/stream-check   ──► Pemeriksaan kesehatan stream (HEAD/Range probe)
       └──► /api/image-proxy    ──► Caching & optimalisasi poster lintas domain
```

### Keamanan Endpoint Proxy (SSRF Hardening)

- Menolak protokol selain `http:` dan `https:`.
- Memblokir alamat loopback (`localhost`, `127.0.0.1`), rentang IP privat (RFC 1918), CGNAT, link-local, dan multicast.
- Resolusi DNS di server untuk mencegah serangan DNS Rebinding ke IP privat.
- Membatasi akses port hanya ke port web standar (80, 443, 8080, 8443, 8888).

---

## 📐 Arsitektur Alur Data

```text
Browser (React 19 SPA)
   │
   ▼
TanStack Query (@tanstack/react-query)
   │
   ▼
TanStack Start Server Function (anime.functions.ts)
   │
   ▼
Core Aggregation Service (anime-service.server.ts)
   │
   ├── In-Memory LRU Cache & Request Deduplication (sources/cache.server.ts)
   ├── Parallel Execution Engine (withTimeout, graceful partial degradation)
   │     ├── animein.server.ts         (JSON REST API)
   │     ├── nontonanimeid.server.ts   (HTML, Cheerio, Nonce AJAX)
   │     ├── nontonanime.server.ts     (Live Search, Base64 Stream Resolver)
   │     ├── samehadaku.server.ts      (Cheerio, WordPress AJAX Resolver)
   │     ├── nimegami.server.ts        (Cheerio, Direct Stream Extraction)
   │     ├── gomunime.server.ts        (Cheerio, AES-256-GCM Decryption)
   │     ├── aniwatch.server.ts        (Cheerio, MegaPlay / VidNest Linker)
   │     └── stucknime.server.ts       (Cheerio Scraper)
   │
   ▼
Output Mapping ke Unified Type Contracts (AnimeDetail, StreamResult, SourceItem)
```

---

## 📂 Struktur Direktori

```text
nontonime/
├── public/                     # Aset statis, PWA Manifest, Service Worker, OpenGraph image
├── src/
│   ├── components/
│   │   ├── anime/              # Komponen VideoPlayer, kartu anime, shelf slider, navigasi
│   │   ├── social/             # Komponen profil, avatar frame, teman, klan, badge
│   │   └── ui/                 # Primitif UI (Radix UI / Tailwind)
│   ├── hooks/                  # Custom React hooks (useMobile, dll.)
│   ├── lib/
│   │   ├── sources/            # Modul scraper individual dan adapter per sumber
│   │   ├── anime-service.server.ts  # Core server-side aggregation service
│   │   ├── anime.functions.ts  # TanStack Start server functions
│   │   ├── stream-proxy.server.ts   # RFC 7233 stream proxy engine
│   │   ├── embed-proxy.server.ts    # Iframe embed sanitizer & player bypass
│   │   ├── download-manager.ts # IndexedDB segmented offline downloader
│   │   ├── firebase.ts         # Inisialisasi Firebase Auth & Firestore dengan long-polling
│   │   └── watchlist.ts, history.ts, gamification.ts
│   ├── routes/                 # File-based routing (TanStack Router)
│   ├── server.ts               # Server entry point & API route handlers
│   └── styles.css              # Styling Tailwind CSS v4
├── firestore.rules             # Aturan keamanan database Firestore
├── providers.ts                # Konfigurasi domain & resolver penyedia video
├── vercel.json                 # Konfigurasi deployment Vercel
└── package.json
```

---

## 🚀 Memulai (Panduan Lokal)

### Prasyarat

- **Node.js**: Versi `20.19.0+` atau `22.12.0+`
- **npm**: Versi `10.0.0+`

### Instalasi & Menjalankan

```bash
# 1. Kloning repositori
git clone https://github.com/NimzzAI/nontonime.git
cd nontonime

# 2. Pasang dependensi
npm install

# 3. Konfigurasi environment (opsional untuk streaming dasar)
cp .env.example .env

# 4. Jalankan development server
npm run dev
```

Buka peramban di `http://localhost:3000`. Fitur katalog dan pemutaran anime langsung berjalan tanpa konfigurasi API key wajib!

### Build Produksi

```bash
# Build aplikasi untuk produksi
npm run build

# Menjalankan server hasil build
npm run start
```

---

## ⚙️ Variabel Lingkungan (`.env`)

Fitur utama streaming anime **tidak memerlukan API key**. Variabel berikut opsional dan digunakan untuk akun Firebase, penyimpanan media Supabase, serta Web Push:

| Variabel                              |   Lingkup    | Deskripsi                                                 |
| :------------------------------------ | :----------: | :-------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`               | Klien/Server | API Key project Firebase Authentication & Firestore       |
| `VITE_FIREBASE_AUTH_DOMAIN`           |    Klien     | Auth Domain Firebase                                      |
| `VITE_FIREBASE_PROJECT_ID`            | Klien/Server | Project ID Firebase                                       |
| `VITE_FIREBASE_APP_ID`                |    Klien     | Web App ID Firebase                                       |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` |    Klien     | ID Database Firestore                                     |
| `SUPABASE_URL`                        | Server Only  | URL endpoint instance Supabase Storage                    |
| `SUPABASE_SERVICE_ROLE_KEY`           | Server Only  | Service Role Secret Supabase (untuk upload avatar/banner) |
| `VAPID_PRIVATE_KEY`                   | Server Only  | Private key VAPID untuk Web Push Notifications            |
| `VITE_VAPID_PUBLIC_KEY`               |    Klien     | Public key VAPID untuk registrasi push di browser         |

---

## 🛠️ Skrip npm Tersedia

| Skrip            | Deskripsi                                          |
| :--------------- | :------------------------------------------------- |
| `npm run dev`    | Menjalankan Vite development server di port `3000` |
| `npm run build`  | Menjalankan build produksi bundle SSR dan client   |
| `npm run start`  | Menjalankan server Nitro produksi dari `.output`   |
| `npm run lint`   | Menjalankan ESLint untuk memeriksa kualitas kode   |
| `npm run format` | Menjalankan Prettier untuk merapikan format kode   |

---

## ⚖️ Penafian (_Disclaimer_)

**Nontonime** tidak menyimpan atau meng-host berkas media video apa pun di server internal. Seluruh konten dan tautan video dikumpulkan dari situs web publik pihak ketiga melalui perayapan data otomatis. Hak cipta sepenuhnya merupakan milik masing-masing pemegang lisensi dan produsen konten asli. Jika Anda adalah pemilik hak cipta dan ingin meminta penghapusan tautan, silakan hubungi penyedia host sumber terkait.

---

<div align="center">

Dibuat dengan ❤️ oleh **[Nimzz](https://github.com/NimzzAI)** • Ditenagai oleh **TanStack Start & React 19**

</div>
