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

Seluruh data anime, jadwal rilis harian, direktori genre, hingga resolusi multi-server diintegrasikan secara *server-side* melalui Sanka API Proxy dengan lapisan proteksi WAF, failover cadangan, dan konfigurasi IP kustom.

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
    modifiedHeaders.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
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
   - `AnimeCard` dan `AnimeListRow` dibungkus dengan `memo` untuk mencegah siklus *re-render* massal saat status UI lokal berubah.
3. **Pemuatan Aset Asinkron (`decoding="async"` & `loading="lazy"`)**
   - Menghilangkan *frame drops* saat menggulir (*scrolling*) katalog ratusan judul anime.
4. **Optimasi Render Siklus & CPU (`HeroSlider` & `TrendingSlider`)**
   - Event listener pengguliran di-*throttle* menggunakan `requestAnimationFrame`.
   - Timer putar otomatis (*auto-slide*) dijeda saat tab berada di latar belakang (`document.hidden`) guna menghemat daya baterai dan memori CPU.
5. **Konfigurasi Cache TanStack Query yang Terukur**
   - `staleTime: 5 menit` dan `gcTime: 15 menit` dengan mematikan `refetchOnWindowFocus` yang tidak perlu, memangkas lonjakan *network waterfall* yang memicu lag.
6. **Penghapusan FontAwesome CDN Eksternal**
   - Seluruh ikon dimigrasikan secara penuh ke pustaka ringan `lucide-react`, memotong dependensi stylesheet eksternal yang memblokir rendering awal halaman.

---

## // Fitur Utama & Fungsionalitas

| Kategori | Fitur | Penjelasan Teknis |
| :--- | :--- | :--- |
| **Pencarian** | **Spotlight Search (`Ctrl+K` / `/`)** | Modal pencarian cepat dengan filter status, tahun rilis, dan genre, serta navigasi pintasan keyboard instan. |
| **Pemutar Video** | **Watch Enhancements** | Pencahayaan dinamis bioskop (*Ambient Light*), Timer Mati Otomatis (*Sleep Timer* 15–60 menit), Mode Bioskop (*Theater*), dan tombol loncat episode berikutnya. |
| **Koleksi** | **Watchlist Manajemen Penuh** | Pengelompokan status (Rencana Tonton, Sedang Nonton, Selesai Ditonton), rating personal, catatan episode, serta fitur **Ekspor & Impor Cadangan JSON**. |
| **Riwayat** | **Statistik Tontonan** | Perhitungan otomatis total episode yang diselesaikan, estimasi durasi tontonan, dan pencarian riwayat berbasis kata kunci. |
| **Pratinjau** | **Quick Preview Modal** | Menampilkan sinopsis, skor, status, dan tombol aksi cepat tanpa perlu memuat halaman detail anime. |
| **Katalog** | **Hero & Trending Slider** | Showcase visual dinamis berkecepatan tinggi dengan navigasi responsif dan indikator radar tayang langsung. |
| **Jadwal & Genre** | **Direktori Komprehensif** | Jadwal rilis mingguan terstruktur per hari serta indeks kategori genre lengkap. |
| **Notifikasi** | **Web Push Native** | Berlangganan pengingat rilis episode anime favorit langsung ke peramban tanpa memerlukan akun pengguna. |
| **PWA** | **Aksesibilitas PWA** | Kemampuan instalasi sebagai aplikasi mandiri di perangkat seluler dan desktop dengan dukungan offline state view. |

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

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server pengembangan lokal (port 3000) |
| `npm run build` | Melakukan kompilasi produksi berkas klien dan server |
| `npm run preview` | Menjalankan pratinjau hasil build produksi secara lokal |
| `npm run lint` | Memeriksa kepatuhan kode dan sintaks dengan ESLint |
| `npm run format` | Merapikan format kode dengan Prettier |

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
