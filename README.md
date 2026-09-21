<div align="center">

<img src="public/og-image.jpg" alt="Nontonime" width="100%" />

# Nontonime

Website streaming anime subtitle Indonesia — tanpa iklan mengganggu, tanpa akun, dan performa ultra cepat.

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

## Tentang Proyek

**Nontonime** adalah platform web modern untuk streaming anime subtitle Indonesia dengan fokus pada **User Experience (UX) kelas atas**, performa kilat, dan kemudahan akses tanpa registrasi akun. Seluruh katalog anime, jadwal rilis harian, episode, serta multi-server streaming diambil server-side dari lapisan API proxy internal berkecepatan tinggi.

Semua preferensi personal seperti **Riwayat Tontonan**, **Watchlist**, dan **Langganan Notifikasi Rilis** tersimpan aman di penyimpanan lokal (Local Storage & IndexedDB) pengguna.

---

## Arsitektur & Desain UI/UX

Aplikasi ini dirancang dengan standar developer modern:
- **Clean Aesthetic & Anti-Slop Guidelines**: Menghilangkan gradien murahan dan template generik. Menggunakan sistem warna berbasis palet OKLCH dengan kontras tinggi (Dark & Light Mode).
- **Hero Slider Sinematik Tanpa Dead-Space**: Carousel anime unggulan dengan poster backdrop beresolusi tinggi, tata letak mobile-first yang proporsional tanpa dead space (ruang kosong berlebih), radar indicator badge tayang dinamis dengan dual-ring ping wave (*Ongoing* / *Tamat*), dan indikator pill interaktif.
- **Trending Anime Showcase**: Slider horizontal berkecepatan tinggi dengan edge-to-edge cinematic cards, hover-zoom effects (`scale-110`), glowing rank badges (#1 - #10), dan akses instan langsung ke streaming.
- **Watchlist Interaktif dengan Spring Motion**: Tombol simpan anime dengan animasi berbasis pegas (*spring physics*) dari `motion`, feedback visual letupan partikel saat ditambahkan, toast notifikasi (*Sonner*), serta sinkronisasi otomatis ke profil dan counter badge.
- **Mobile-First Glassmorphism Bottom Navigation**: Bar navigasi khusus mobile dengan efek glassmorphism blur berlapis (`backdrop-blur-2xl bg-card/75 border-white/10`), ambient light sheen, active pill spring transition, serta ikon SVG kustom yang dioptimalkan untuk sentuhan mobile.
- **Overlay & Sidebar Search Panel dengan Filter Multi-Kategori**: Drawer pencarian instan lengkap dengan filter Status Tayang (*Ongoing/Completed*), Tahun Rilis (2020–2026), dan Kategori Genre, serta pintasan keyboard global `Ctrl+K` atau `/`.
- **PWA Ready**: Dukungan Web App Manifest dan Service Worker sehingga dapat dipasang langsung ke layar utama perangkat (Android / iOS / Desktop).

---

## Sumber Data & Server Functions

Data anime diperoleh melalui client server-side di `src/lib/animein.server.ts` dengan arsitektur:
1. **Server-Only Security**: Endpoint dan rahasia proxy dieksekusi murni di backend via TanStack Start `createServerFn` (`src/lib/anime.functions.ts`). Kredensial tidak pernah terekspos ke browser.
2. **Instant Multi-Server Resolution**: Pemanggilan stream episode langsung menyediakan seluruh opsi server (OtakuWatch, OdStream, VidHide, Mega, dll.) dan resolusi (360p, 480p, 720p HD) dalam satu payload, memungkinkan pergantian server instan tanpa request ulang.
3. **Context-Aware Navigation**: Parameter konteks anime (`?a=<animeId>`) disematkan otomatis pada tautan tontonan untuk sinkronisasi daftar episode, histori, dan metadata.

---

## Fitur Unggulan

| Fitur | Deskripsi |
| :--- | :--- |
| **Trending Anime Horizontal Slider** | Slider horizontal sinematik dengan kartu berbingkai besar, efek hover-zoom halus, badge ranking #1–#10, rating skor, dan akses instan. |
| **Watchlist Spring-Animation & Profil** | Simpan anime favorit dengan toggle tombol beranimasi spring halus, efek letupan partikel, toast notifikasi, dan pengelolaan langsung di halaman profil. |
| **Glassmorphism Mobile Navigation** | Bar navigasi bawah mobile dengan custom SVG icons, layout spring pill animation, dan frosted glass effect beresolusi tinggi. |
| **Drawer Search & Filter Multi-Kategori** | Panel pencarian slide-in dengan filter Status (Ongoing/Tamat), Tahun Rilis, dan Genre, serta pintasan keyboard `Ctrl+K` / `/`. |
| **Hero Carousel Sinematik** | Slider anime unggulan dengan cuplikan sinopsis, rating, poster preview, live radar badge, dan navigasi dot/panah yang responsif tanpa dead space. |
| **Rak Anime Berbasis Status** | Rak terpisah untuk *Tayang Hari Ini*, *Sedang Tayang (Ongoing)*, *Anime Tamat (Completed)*, dan *Rekomendasi Pilihan*. |
| **Jadwal Rilis Mingguan** | Kalender rilis anime per hari (Senin–Minggu) dengan penanda otomatis hari ini. |
| **Eksplorasi Genre** | Direktori genre lengkap dengan navigasi berbasis teks yang bersih tanpa ikon berat. |
| **Player Video Multi-Kualitas** | Pemutar video responsif dengan dukungan server embed dan streaming langsung (`.mp4` / `.m3u8`). |
| **Riwayat & Lanjutkan Nonton** | Pelacakan otomatis episode terakhir yang ditonton, tersimpan lokal di perangkat. |
| **Notifikasi Web Push Native** | Langganan notifikasi episode baru per anime menggunakan Web Push API bawaan browser. |
| **PWA & Akses Offline** | Installable ke homescreen HP & tablet dengan dukungan offline state view yang elegan. |

---

## Tumpukan Teknologi

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19, Full-stack SSR & Server Functions)
- **Routing**: [TanStack Router](https://tanstack.com/router) (File-based, 100% type-safe routing)
- **State & Data Fetching**: [TanStack Query v5](https://tanstack.com/query)
- **Physics Animations**: [Motion](https://motion.dev/) (Spring animations, Layout transitions)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) dengan OKLCH color token & theme switching
- **Icon Set**: [Lucide React](https://lucide.dev/) + Custom Anime Mobile SVGs
- **Carousel**: [Embla Carousel React](https://www.embla-carousel.com/)
- **Video Engine**: [Video.js](https://videojs.com/)
- **Notification Toast**: [Sonner](https://sonner.emilkowal.ski/)
- **Push Notification**: Native Web Push API (Service Worker + VAPID)
- **Runtime & Deployment**: [Nitro Engine](https://nitro.build/) (Vercel / Node.js)

---

## Panduan Instalasi & Pengembangan Lokal

### Prasyarat
- **Node.js**: versi 20.x atau lebih baru
- **npm** atau **pnpm**

### Langkah Instalasi
```bash
# 1. Kloning repositori
git clone https://github.com/Nimzz-pemboy/nontonime.git
cd nontonime

# 2. Pasang dependensi
npm install

# 3. Siapkan environment variable
cp .env.example .env

# 4. Jalankan dev server
npm run dev
```

Aplikasi dapat diakses melalui peramban di `http://localhost:3000` (atau port yang ditentukan lingkungan).

---

## Skrip yang Tersedia

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server pengembangan dengan hot reload |
| `npm run build` | Menjalankan build produksi (client bundles + server bundles) |
| `npm run preview` | Menjalankan preview lokal dari hasil build |
| `npm run lint` | Memeriksa kepatuhan kode dan sintaks dengan ESLint |
| `npm run format` | Memformat kode menggunakan Prettier |

---

## Struktur Direktori

```
src/
├── components/
│   ├── anime/       # Komponen anime (AnimeCard, HeroSlider, Shelf, Player, BottomNav, dll.)
│   └── ui/          # Komponen primitif antarmuka
├── lib/
│   ├── animein.server.ts   # Client server-side scraping & rate limiting
│   ├── anime.functions.ts  # Server Functions per endpoint
│   ├── anime-types.ts      # TypeScript definitions untuk anime, episode, dan jadwal
│   ├── queries.ts          # TanStack Query query options
│   ├── history.ts          # State storage riwayat tontonan
│   ├── watchlist.ts        # State storage watchlist
│   ├── subscriptions.ts    # State storage langganan notifikasi
│   └── push.ts             # Integrasi Web Push & VAPID
├── routes/          # File-based routing (Beranda, Detail, Nonton, Genre, Jadwal, Profil)
├── styles.css       # Token Tailwind CSS, utilitas OKLCH, dan styling global
└── start.ts         # Middleware TanStack Start
```

---

<div align="center">
Dikelola dan dikembangkan dengan bangga oleh <strong>Nimzz</strong>.
</div>
