<div align="center">

<img src="public/og-image.jpg" alt="nontonime" width="100%" />

# nontonime

**Platform Streaming & Pelacakan Anime Subtitle Indonesia Berperforma Tinggi**

Cepat, responsif di ponsel berspesifikasi rendah, tanpa iklan mengganggu, ramah privasi, dan dioptimalkan secara menyeluruh.

[![Demo](https://img.shields.io/badge/demo-nontonime.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://nontonime.vercel.app/)
[![Deploy](https://img.shields.io/github/deployments/NimzzAI/nontonime/production?style=for-the-badge&label=vercel&logo=vercel)](https://nontonime.vercel.app/)
[![Repo](https://img.shields.io/badge/github-NimzzAI%2Fnontonime-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/NimzzAI/nontonime)
[![Status](https://img.shields.io/badge/status-active%20%2F%20production%20ready-brightgreen?style=flat-square)](#-status-proyek)
[![License](https://img.shields.io/github/license/NimzzAI/nontonime?style=flat-square)](./LICENSE)

</div>

---

## // Ringkasan Proyek

**nontonime** adalah aplikasi web modern untuk menonton dan mengelola koleksi anime berbahasa Indonesia. Dibangun di atas arsitektur **TanStack Start (React 19 SSR)**, **TanStack Router**, dan **Tailwind CSS v4**, nontonime dirancang untuk memberikan pengalaman menonton sinematik yang mulus tanpa lag, konsumsi RAM yang hemat, dan rendering yang gesit bahkan di perangkat ponsel menengah ke bawah.

Seluruh data anime, jadwal tayang harian, genre, dan server streaming terhubung langsung dengan sumber terpercaya **Otakudesu** melalui lapisan Sanka Vollerei API dan server proxy cerdas nontonime.

---

## // Status Proyek

- **Status**: Aktif & Production-Ready (Versi 1.1 Upgrade).
- **Fokus Utama**: Performa tinggi, kestabilan pemutaran streaming Otakudesu, ramah perangkat mobile, efisiensi memori (zero memory leaks), dan UX yang bersih dan konsisten.
- **Provider Standar**: **Otakudesu** (Koleksi lengkap, episode rilis harian teratur, multi-server stabil).

---

## // Fitur Utama

| Kategori         | Fitur                                 | Penjelasan & Keunggulan                                                                                                                         |
| :--------------- | :------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Streaming**    | **Player Adaptif Multi-Server**       | Pemutar video cerdas dengan dukungan server video langsung (MP4), HLS streaming, hingga embed cadangan.                                         |
| **Streaming**    | **Auto-Failover & Auto-Retry**        | Deteksi otomatis saat stream gagal (network error, stall buffer >10 detik, upstream down) dengan peralihan otomatis ke server alternatif.       |
| **Streaming**    | **Autoplay Episode Berikutnya**       | Menghitung dan melanjutkan tontonan ke episode selanjutnya secara mulus dengan countdown interaktif yang dapat dibatalkan.                      |
| **Streaming**    | **Zero-Buffering Range Proxy**        | Proxy lokal berbasis RFC 7233 HTTP Range Request; hemat RAM, tidak membebani memori server, dan mendukung seeking instan untuk video >500MB.    |
| **Streaming**    | **Live Stream Diagnostics HUD**       | Panel diagnostik real-time untuk memantau URL sumber, Content-Type upstream, status partial content 206, latensi ping, dan durasi buffer.       |
| **Pencarian**    | **Spotlight Search (`Ctrl+K` / `/`)** | Modal pencarian cepat dengan navigasi keyboard, filter status anime, dan debounce query untuk mengurangi request API.                           |
| **Offline**      | **Segmented Range Downloader**        | Pengunduh video per blok segmen 2MB via IndexedDB dengan fitur jeda (pause) & lanjutkan (resume) tanpa mengulang dari 0%.                       |
| **Offline**      | **Offline Video Player**              | Pemutar episode tersimpan langsung di browser tanpa koneksi internet (100% offline) dan opsi unduh file MP4 ke penyimpanan lokal.               |
| **Koleksi**      | **Watchlist & Riwayat Tontonan**      | Manajemen tontonan lokal (Rencana, Sedang Ditonton, Selesai) dengan pencarian, pemulihan posisi detik terakhir, serta Ekspor/Impor format JSON. |
| **Gamifikasi**   | **Level & Badge Wibu**                | Sistem EXP dan badge pencapaian berdasarkan riwayat tontonan dan aktivitas di platform nontonime.                                               |
| **Mobile & PWA** | **Mobile-First Experience**           | Desain navigasi bawah (bottom navigation) yang ergonomis, layout responsif sentuhan, safe-area-inset cover, dan dukungan PWA installable.       |

---

## // Arsitektur & Teknologi

### Tumpukan Teknologi (Tech Stack)

- **Frontend & SSR Framework**: [TanStack Start](https://tanstack.com/start) (React 19, Server Functions, SSR)
- **Routing**: [TanStack Router](https://tanstack.com/router) (File-based, 100% Type-Safe)
- **Data Fetching & State**: [TanStack Query v5](https://tanstack.com/query) dengan optimasi `staleTime` dan `gcTime`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) dengan palet OKLCH dan utilitas performa tinggi
- **Ikon**: [Lucide React](https://lucide.dev/) (menggantikan pustaka eksternal yang berat)
- **Media Player**: [Video.js](https://videojs.com/) dengan custom lightweight controls & overlay
- **Database / Auth Opsional**: [Firebase Firestore & Authentication](https://firebase.google.com/)
- **Server Engine**: Express.js + Vite Dev Middlewares / Production build

### Arsitektur Penting

1. **In-Memory Server LRU Caching & Request Deduplication (`src/lib/animein.server.ts`)**:
   - Membatasi entri cache pada 500 slot dengan TTL dinamis (15 menit untuk home/detail, 30 menit untuk list/jadwal).
   - _In-flight Promise Coalescing_: Jika ada beberapa request simultan untuk episode atau anime yang sama, hanya 1 request yang diteruskan ke upstream API.
   - _Stale-While-Revalidate Fallback_: Jika upstream mengembalikan timeout atau 403, cache sebelumnya langsung disajikan agar user tidak mengalami error layar kosong.

2. **Zero-Buffering Stream Proxy (`src/lib/stream-proxy.server.ts`)**:
   - Mem-bypass batasan CORS dan proteksi hotlinking tanpa menyimpan seluruh berkas di memori/disk server.
   - Proteksi keamanan SSRF (memblokir akses ke `localhost`, IP privat, link metadata cloud).
   - Meneruskan header `Range` secara transparan untuk penghematan data dan kemampuan seeking instan.

3. **Client-Side Cache Indexing (`src/lib/watchlist.ts` & `src/lib/history.ts`)**:
   - Pengecekan status anime dalam kompleksitas $O(1)$ menggunakan `Set<string>`, menghindari operasi `JSON.parse` berulang pada setiap render kartu anime.

---

## // Struktur Direktori

```text
nontonime/
├── public/                  # Aset publik, favicon, manifest PWA, service worker
├── src/
│   ├── components/
│   │   ├── anime/           # Komponen anime (Player, Card, Shelf, Modal, Navigasi)
│   │   └── ui/              # Komponen primitif UI (Dialog, Dropdown, Button, Input)
│   ├── hooks/               # Custom React hooks (useMobile, dll.)
│   ├── lib/
│   │   ├── animein.server.ts    # Lapisan API Otakudesu, caching, fallback
│   │   ├── stream-proxy.server.ts # Proxy streaming video & RFC 7233 Range
│   │   ├── download-manager.ts  # Segmented downloader & IndexedDB storage
│   │   ├── anime-types.ts       # Definisi interface TypeScript terpadu
│   │   ├── anime.functions.ts   # TanStack Start Server Functions
│   │   ├── queries.ts           # Konfigurasi query data TanStack Query
│   │   ├── watchlist.ts         # Pengelolaan watchlist & ekspor/impor
│   │   ├── history.ts           # Pengelolaan riwayat dan posisi pemutaran
│   │   ├── gamification.ts      # Logika EXP, level, dan badge pengguna
│   │   └── site-config.ts       # Metadata aplikasi dan konfigurasi SEO
│   ├── routes/              # Rute halaman file-based TanStack Router
│   ├── server.ts            # Entrypoint server Express & proxy routing
│   └── styles.css           # Styling global Tailwind CSS v4
├── firestore.rules          # Aturan keamanan database Firestore
├── metadata.json            # Konfigurasi metadata platform AI Studio
├── package.json             # Dependensi proyek dan skrip npm
└── README.md                # Dokumentasi lengkap proyek
```

---

## // Panduan Penginstalan & Menjalankan Lokal

### Prasyarat

- **Node.js**: Versi 20.x atau 22.x LTS
- **npm**: Versi 10.x atau lebih baru

### Langkah-langkah

1. **Kloning Repositori**:

   ```bash
   git clone https://github.com/NimzzAI/nontonime.git
   cd nontonime
   ```

2. **Pasang Dependensi**:

   ```bash
   npm install
   ```

3. **Buat Berkas Environment**:
   Salin dari template yang disediakan:

   ```bash
   cp .env.example .env
   ```

4. **Jalankan Development Server**:

   ```bash
   npm run dev
   ```

   Buka peramban di [http://localhost:3000](http://localhost:3000).

5. **Kompilasi & Uji Produksi**:
   ```bash
   npm run build
   npm run start
   ```

---

## // Variabel Lingkungan (.env)

| Variabel                    | Deskripsi                                             | Status   | Contoh / Catatan                            |
| :-------------------------- | :---------------------------------------------------- | :------- | :------------------------------------------ |
| `SANKA_API_BASE`            | URL endpoint Sanka Vollerei API (Otakudesu)           | Opsional | `https://www.sankavollerei.web.id/anime`    |
| `SANKA_API_FALLBACK`        | URL cadangan otomatis jika URL utama diblokir/timeout | Opsional | Mirror proxy atau domain cadangan           |
| `VITE_FIREBASE_API_KEY`     | API Key proyek Firebase                               | Opsional | Untuk fitur sinkronisasi akun online        |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domain autentikasi Firebase                           | Opsional | `ai-studio-nontonime-xxx.firebaseapp.com`   |
| `VITE_FIREBASE_PROJECT_ID`  | ID Proyek Firebase                                    | Opsional | ID proyek Firestore                         |
| `VAPID_PRIVATE_KEY`         | Kunci privat untuk Web Push Notification              | Opsional | Digunakan untuk pengiriman notifikasi rilis |
| `VITE_VAPID_PUBLIC_KEY`     | Kunci publik untuk Web Push Notification              | Opsional | Digunakan di browser klien                  |

> **Catatan Keamanan**: Jangan pernah mempublikasikan `VAPID_PRIVATE_KEY` atau secret server ke sisi klien. Semua panggilan API eksternal diproses secara aman di sisi server.

---

## // Informasi Sumber API & Penanganan Error 403

Data anime pada nontonime disediakan oleh **Otakudesu** melalui Sanka Vollerei API.

### Mengatasi Pemblokiran WAF / Error 403 di Layanan Cloud (Vercel, Cloud Run, VPS)

IP datacenter publik (AWS, GCP, Vercel Serverless) terkadang dibatasi oleh Cloudflare WAF upstream. Nontonime telah menyertakan mekanisme **Dual-Endpoint Fallback** dan header browser emulasi otomatis.

Jika Anda mengalami error 403 atau timeout dari upstream, Anda dapat membuat **Cloudflare Worker Reverse Proxy** sederhana:

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

Cukup atur `SANKA_API_BASE=https://worker-proxy-anda.workers.dev/anime` di pengaturan environment aplikasi Anda.

---

## // Catatan Penting Mengenai Streaming

1. **Pemilihan Server Otomatis**: Server utama diutamakan server langsung (MP4 Direct/Odstream/Filedon). Jika server tersebut tidak dapat dijangkau oleh ISP pengguna, sistem otomatis mencoba server cadangan berikutnya.
2. **HTTP Range (RFC 7233)**: Pemutar video nontonime memanfaatkan endpoint `/api/stream-proxy` untuk streaming potongan byte. Hal ini memastikan user dapat melakukan lompatan waktu (seeking) instan tanpa perlu menunggu seluruh berkas video selesai diunduh.
3. **Autoplay & Sleep Timer**: Fitur autoplay episode berikutnya dilengkapi dengan hitung mundur 5 detik. Pengguna juga dapat menyetel _Sleep Timer_ (15 hingga 60 menit) agar pemutaran berhenti otomatis saat pengguna tertidur.
4. **Efisiensi Memori (Low Memory Footprint)**: Seluruh pemrosesan video dilakukan secara streaming langsung tanpa buffer memori server, memastikan aplikasi tetap stabil dijalankan pada server spesifikasi minimal (512MB RAM).

---

## // Perintah Eksekusi Proyek

```bash
# Menjalankan server development lokal
npm run dev

# Membangun aplikasi untuk produksi
npm run build

# Menjalankan server aplikasi produksi
npm run start

# Menjalankan linter kode (ESLint)
npm run lint

# Merapikan format kode (Prettier)
npm run format
```

---

## // Credits & Author

- **Pengembang Asli**: [NimzzAI](https://github.com/NimzzAI)
- **Sumber Data & Katalog**: Komunitas Otakudesu & Sanka Vollerei
- **Lisensi**: Proyek ini dilisensikan di bawah lisensi terbuka [MIT License](./LICENSE).

<div align="center">
<br />
Ditingkatkan dengan komitmen performa, stabilitas pemutaran, dan kebersihan kode untuk seluruh penikmat anime Indonesia.
</div>
