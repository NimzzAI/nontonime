<div align="center">

<img src="public/og-image.jpg" alt="nontonime" width="100%" />

# nontonime

<<<<<<< HEAD
**Situs streaming dan pelacak anime subtitle Indonesia**

Katalog digabung dari enam sumber scraper, tanpa API pihak ketiga, dengan pemutar yang bisa pindah server sendiri saat stream gagal.
=======
**Platform Streaming & Pelacakan Anime Subtitle Indonesia Berperforma Tinggi**

Cepat, responsif di ponsel berspesifikasi rendah, tanpa iklan mengganggu, ramah privasi, dan dioptimalkan secara menyeluruh.
>>>>>>> 29d30b74a34c4b8e1a20df21d47e03c7dd54e479

[![Demo](https://img.shields.io/badge/demo-nontonime.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://nontonime.vercel.app/)
[![Deploy](https://img.shields.io/github/deployments/NimzzAI/nontonime/production?style=for-the-badge&label=vercel&logo=vercel)](https://nontonime.vercel.app/)
[![Repo](https://img.shields.io/badge/github-NimzzAI%2Fnontonime-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/NimzzAI/nontonime)
<<<<<<< HEAD
=======
[![Status](https://img.shields.io/badge/status-active%20%2F%20production%20ready-brightgreen?style=flat-square)](#-status-proyek)
>>>>>>> 29d30b74a34c4b8e1a20df21d47e03c7dd54e479
[![License](https://img.shields.io/github/license/NimzzAI/nontonime?style=flat-square)](./LICENSE)

</div>

---

<<<<<<< HEAD
## Daftar Isi

1. [Ringkasan](#-ringkasan)
2. [Yang Berubah di Versi Ini](#-yang-berubah-di-versi-ini)
3. [Fitur](#-fitur)
4. [Sumber Data](#-sumber-data)
5. [Arsitektur Backend](#-arsitektur-backend)
6. [Struktur Direktori](#-struktur-direktori)
7. [Menjalankan Lokal](#-menjalankan-lokal)
8. [Variabel Lingkungan](#-variabel-lingkungan)
9. [Deploy ke Vercel](#-deploy-ke-vercel)
10. [Menambah Sumber Baru](#-menambah-sumber-baru)
11. [Migrasi dari Versi Sebelumnya](#-migrasi-dari-versi-sebelumnya)
12. [Pemecahan Masalah](#-pemecahan-masalah)
13. [Catatan Streaming](#-catatan-streaming)
14. [Batasan yang Diketahui](#-batasan-yang-diketahui)
15. [Perintah npm](#-perintah-npm)
16. [Disclaimer dan Kredit](#-disclaimer-dan-kredit)

---

## // Ringkasan

nontonime adalah aplikasi web untuk menonton dan mengelola koleksi anime subtitle Indonesia. Dibangun di atas TanStack Start (React 19 dengan SSR), TanStack Router, TanStack Query, dan Tailwind CSS v4.

Data anime, jadwal rilis, genre, dan server streaming diambil langsung dari situs sumber lewat scraper yang berjalan di server aplikasi ini sendiri. Tidak ada lagi ketergantungan pada Sanka Vollerei API. Hasil dari semua sumber digabung menjadi satu katalog, lalu disajikan ke halaman yang sama seperti sebelumnya.

---

## // Yang Berubah di Versi Ini

| Sebelumnya                                         | Sekarang                                                                           |
| :------------------------------------------------- | :--------------------------------------------------------------------------------- |
| Semua data dari satu API (Sanka Vollerei, Otakudesu) | Enam sumber scraper, digabung di `src/lib/anime-service.server.ts`                 |
| `src/lib/animein.server.ts` sebagai lapisan API    | Dihapus, diganti folder `src/lib/sources/` dan `anime-service.server.ts`           |
| Env `SANKA_API_BASE` dan `SANKA_API_FALLBACK`      | Dihapus, tidak ada env pengganti                                                   |
| ID anime berupa slug Otakudesu                     | ID berawalan sumber, misalnya `na_one-piece` atau `ai_1234`                         |
| Link batch dari Otakudesu                          | Batch dicari otomatis dari Kusonime lewat judul                                    |

Yang tidak berubah: seluruh halaman, komponen, pemutar, watchlist, riwayat, unduhan offline, gamifikasi, dan PWA. Fungsi server di `anime.functions.ts` memakai nama dan bentuk data yang sama, jadi frontend tidak perlu diubah.

Logika scraper berasal dari backend hwaverseB (Bun dan Fastify). Kodenya ditulis ulang ke TypeScript dan dijalankan di dalam server nontonime sendiri, jadi tidak perlu menjalankan atau men-deploy backend terpisah.

---

## // Fitur

| Kategori         | Fitur                          | Penjelasan                                                                                                                     |
| :--------------- | :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **Katalog**      | Multi sumber                   | Beranda, terbaru, populer, pencarian, genre, dan jadwal digabung dari beberapa situs, judul kembar hanya tampil sekali.        |
| **Katalog**      | Pencarian lintas sumber        | Satu kata kunci dikirim ke semua sumber sekaligus, hasilnya diurutkan menurut kecocokan judul.                                 |
| **Streaming**    | Pemutar multi server           | Mendukung file langsung (MP4 atau HLS) dan embed, server dikelompokkan per kualitas.                                           |
| **Streaming**    | Auto failover dan auto retry   | Stream yang gagal, macet lebih dari 10 detik, atau upstream mati dialihkan ke server berikutnya.                                |
| **Streaming**    | Autoplay episode berikutnya    | Hitung mundur yang bisa dibatalkan sebelum pindah ke episode selanjutnya.                                                      |
| **Streaming**    | Proxy dengan Range request     | Endpoint `/api/stream-proxy` meneruskan header `Range` (RFC 7233), jadi seeking tidak menunggu berkas selesai diunduh.          |
| **Streaming**    | Panel diagnostik               | Menampilkan URL sumber, Content-Type upstream, status 206, ping, dan durasi buffer.                                            |
| **Pencarian**    | Spotlight (`Ctrl+K` atau `/`)  | Modal pencarian dengan navigasi keyboard dan debounce.                                                                         |
| **Offline**      | Pengunduh per segmen           | Video diunduh per blok 2 MB ke IndexedDB, bisa dijeda dan dilanjutkan.                                                         |
| **Offline**      | Pemutar offline                | Episode yang sudah tersimpan diputar dari browser tanpa koneksi, atau diekspor sebagai MP4.                                    |
| **Koleksi**      | Watchlist dan riwayat          | Status Rencana, Sedang Ditonton, Selesai, posisi terakhir tersimpan, ekspor dan impor JSON.                                    |
| **Gamifikasi**   | Level dan badge                | EXP dan badge dari riwayat tontonan.                                                                                           |
| **Mobile**       | PWA dan navigasi bawah         | Bisa dipasang, mendukung safe-area, dan punya notifikasi push opsional.                                                        |

---

## // Sumber Data

Setiap sumber adalah satu file di `src/lib/sources/` yang mengimplementasikan antarmuka `AnimeSource`. Tidak semua sumber punya semua fitur, jadi halaman tertentu hanya diisi dari sumber yang mendukungnya.

| Sumber          | ID env          | Beranda                       | Terbaru | Populer | Cari | Genre | Jadwal | Detail | Stream | Unduhan |
| :-------------- | :-------------- | :---------------------------- | :-----: | :-----: | :--: | :---: | :----: | :----: | :----: | :-----: |
| AnimeIn         | `animein`       | slider, hari ini, hot, populer, baru, menunggu | ya | ya | ya | ya | ya | ya | ya | tidak |
| NontonAnimeID   | `nontonanimeid` | terbaru, populer, film        | ya      | ya      | ya   | ya    | ya     | ya     | ya     | ya      |
| Gomunime        | `gomunime`      | terbaru, populer              | tidak   | tidak   | ya   | ya    | tidak  | ya     | ya     | tidak   |
| Aniwatch        | `aniwatch`      | terbaru, populer              | tidak   | tidak   | ya   | ya    | tidak  | ya     | ya     | tidak   |
| Stucknime       | `stucknime`     | terbaru                       | tidak   | tidak   | ya   | ya    | tidak  | ya     | ya     | tidak   |
| Samehadaku      | `samehadaku`    | terbaru, populer, film        | tidak   | tidak   | ya   | tidak | tidak  | ya     | ya     | ya      |
| Kusonime        | tidak ada       | khusus mencari batch unduhan  | tidak   | tidak   | ya   | tidak | tidak  | tidak  | tidak  | ya      |

Hal yang perlu diketahui dari tabel itu:

- **Beranda** diisi dari semua sumber. Setiap bagian (slider, hari ini, hot, populer, baru, menunggu) mengambil daftar yang tersedia dari tiap sumber, lalu menyelang-selingkan hasilnya. Sumber yang tidak punya bagian tertentu ikut lewat daftar terdekatnya, misalnya populer atau terbaru.
- Halaman **Terbaru** dan **Populer** memuat semua sumber pada halaman pertama. Halaman kedua dan seterusnya hanya dari AnimeIn dan NontonAnimeID, karena hanya dua sumber itu yang punya daftar bertingkat. Sumber lain hanya punya satu halaman beranda.
- Halaman **Jadwal** hanya terisi dari AnimeIn dan NontonAnimeID. Scraper Samehadaku asli membagi anime ke hari secara berurutan, bukan menurut jadwal tayang sebenarnya, jadi bagian itu tidak dipindahkan.
- **Kusonime** bukan sumber streaming. Dipakai untuk mencari batch unduhan berdasarkan judul anime, hasilnya muncul sebagai tombol batch di halaman detail kalau ada yang cocok.
- Satu anime tetap milik satu sumber. Kalau judul yang sama ada di dua sumber, yang tampil adalah sumber dengan urutan lebih awal di `registry.server.ts`.

---

## // Arsitektur Backend

### Alur request

```text
Browser
  -> TanStack Query (queries.ts)
  -> Server Function (anime.functions.ts)
  -> Lapisan gabungan (anime-service.server.ts)
       |-- cache, penggabungan request kembar, data lama saat gagal (sources/cache.server.ts)
       |-- semua sumber dipanggil bersamaan, yang gagal dilewati
       |     |-- animein.server.ts         (JSON API)
       |     |-- nontonanimeid.server.ts   (HTML, cheerio)
       |     |-- gomunime.server.ts        (HTML, cheerio, dekripsi AES-GCM)
       |     |-- aniwatch.server.ts        (HTML, cheerio)
       |     |-- stucknime.server.ts       (HTML, cheerio)
       |     |-- samehadaku.server.ts      (HTML, cheerio, player lewat AJAX)
       |-- kusonime.server.ts              (pencarian batch)
  -> Hasil dipetakan ke bentuk AnimeSummary, AnimeDetail, StreamResult (anime-types.ts)
```

### Modul

| File                                   | Fungsi                                                                                                              |
| :------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| `src/lib/anime-service.server.ts`      | Titik masuk backend. Menggabungkan sumber, memetakan data ke tipe frontend, mengatur cache dan timeout.              |
| `src/lib/sources/types.ts`             | Antarmuka `AnimeSource` dan tipe internal (`SourceItem`, `SourceDetail`, `SourceStream`).                            |
| `src/lib/sources/registry.server.ts`   | Daftar sumber dan urutan prioritasnya.                                                                              |
| `src/lib/sources/ids.ts`               | Pembuatan dan pembacaan ID berawalan sumber, normalisasi judul.                                                     |
| `src/lib/sources/http.server.ts`       | Wrapper `fetch` dengan timeout, User-Agent browser, dan error bernama sumber.                                       |
| `src/lib/sources/cache.server.ts`      | Cache dalam memori, penggabungan request kembar, `withTimeout`.                                                     |
| `src/lib/sources/token.server.ts`      | Pengodean referensi server menjadi token, serta pemeriksaan URL publik.                                             |
| `src/lib/sources/*.server.ts`          | Satu file per sumber.                                                                                               |

### Format ID

ID membawa nama sumbernya, jadi server tahu harus bertanya ke mana tanpa menyimpan pemetaan apa pun.

| Jenis    | Format           | Contoh                              |
| :------- | :--------------- | :---------------------------------- |
| Anime    | `<awalan>_<slug>`    | `na_one-piece`, `ai_1234`           |
| Episode  | `<awalan>_ep_<slug>` | `na_ep_one-piece-episode-1`         |
| Batch    | `ks_<slug>`      | `ks_one-piece-batch-sub-indo`       |

Awalan sumber: `ai` AnimeIn, `na` NontonAnimeID, `gm` Gomunime, `aw` Aniwatch, `stk` Stucknime, `sh` Samehadaku, `ks` Kusonime.

### Cache

Cache berada di memori proses, maksimal 500 entri, entri tertua dibuang lebih dulu.

| Data                          | Lama simpan |
| :---------------------------- | :---------- |
| Beranda, terbaru, pencarian   | 5 menit     |
| Populer                       | 10 menit    |
| Detail anime, halaman genre   | 15 menit    |
| Jadwal rilis                  | 30 menit    |
| Batch unduhan                 | 30 menit    |
| Daftar genre                  | 60 menit    |
| Pencarian batch Kusonime      | 6 jam       |
| Stream episode                | 3 menit     |

Perilakunya:

- **Request kembar digabung.** Kalau beberapa pengunjung meminta data yang sama bersamaan, hanya satu request yang dikirim ke situs sumber.
- **Data lama dipakai saat sumber gagal.** Kalau pembaruan gagal dan masih ada salinan lama, salinan itu yang dikembalikan, bukan layar error. Kalau belum ada salinan, errornya diteruskan.
- **Cache hidup selama proses hidup.** Di Vercel setiap instance fungsi punya cache sendiri, dan cache hilang saat instance berhenti.

### Penggabungan hasil

- Semua sumber dipanggil bersamaan. Satu sumber yang gagal atau lebih dari 14 detik hanya dilewati dan dicatat di log server (`[sources] nama.aksi gagal`).
- Hasil tiap sumber diselang-seling, jadi satu sumber tidak menguasai daftar.
- Sumber yang tidak punya daftar bertingkat tetap dipakai pada halaman pertama lewat data berandanya. Beranda tiap sumber disimpan sendiri selama 5 menit dan dipakai bersama oleh beranda, terbaru, dan populer.
- Judul kembar dibuang setelah dinormalkan (huruf kecil, tanpa kata seperti "sub indo", "nonton", "streaming", "season", "musim", dan tanpa tanda baca).
- Kalau semua sumber gagal, halaman daftar menampilkan error, sedangkan beranda mengembalikan bagian kosong supaya halamannya tetap terbuka.
- Pencarian diurutkan dengan skor kecocokan judul: sama persis, diawali kata kunci, lalu jumlah kata yang cocok.

### Server streaming

Daftar server dikelompokkan per kualitas. Setiap server dikirim ke browser sebagai token tertutup (`srv1.` diikuti data berkode base64url), bukan URL mentah. Token ini diurai lagi di server saat pengguna memilih server lewat `resolveServer`.

- Server berjenis URL langsung dibuka apa adanya. Kalau halaman embed berisi alamat `.m3u8` atau `.mp4`, server mencoba mengambilnya agar bisa diputar lewat pemutar sendiri.
- NontonAnimeID menyimpan server cadangan di balik request AJAX berisi nonce. Token membawa data yang dibutuhkan, dan URL player baru diminta saat server itu dipilih.
- Samehadaku menaruh sebagian player di balik request AJAX (`player_ajax`). Token membawa `post`, `nume`, dan `type` dari tombol player, dan URL iframe diminta saat server itu dipilih. Iframe yang sudah ada di halaman dipakai langsung.
- Gomunime memakai player Putarin yang konfigurasinya terenkripsi AES-256-GCM. Server mengambil kuncinya dan membukanya, kalau gagal tersedia server embed biasa.

### Keamanan

- Token server datang dari browser, jadi isinya tidak dipercaya. URL di dalamnya harus berprotokol `http` atau `https` dan host-nya tidak boleh `localhost`, IP privat, atau alamat metadata cloud.
- Endpoint AJAX NontonAnimeID wajib memakai host yang sama dengan situs sumbernya.
- Proxy stream (`stream-proxy.server.ts`) menerapkan pemeriksaan host privat yang sama dan membatasi port.
- Semua pemanggilan ke situs sumber terjadi di server. Tidak ada kunci atau URL sumber yang dikirim ke bundel klien.

---

## // Struktur Direktori

```text
nontonime/
├── public/                         # Aset publik, favicon, manifest PWA, service worker
├── src/
│   ├── components/
│   │   ├── anime/                  # Komponen anime (Player, Card, Shelf, Modal, Navigasi)
│   │   └── ui/                     # Komponen primitif UI
│   ├── hooks/                      # Custom React hooks
│   ├── lib/
│   │   ├── sources/                # Scraper per sumber dan pendukungnya
│   │   │   ├── animein.server.ts
│   │   │   ├── nontonanimeid.server.ts
│   │   │   ├── gomunime.server.ts
│   │   │   ├── aniwatch.server.ts
│   │   │   ├── stucknime.server.ts
│   │   │   ├── samehadaku.server.ts
│   │   │   ├── kusonime.server.ts  # Pencarian batch unduhan
│   │   │   ├── registry.server.ts  # Daftar sumber dan urutan prioritas
│   │   │   ├── cache.server.ts     # Cache, request kembar, timeout
│   │   │   ├── http.server.ts      # fetch dengan timeout dan helper teks
│   │   │   ├── ids.ts              # Format ID dan normalisasi judul
│   │   │   ├── token.server.ts     # Token server dan cek URL publik
│   │   │   └── types.ts            # Antarmuka AnimeSource
│   │   ├── anime-service.server.ts # Penggabung sumber, titik masuk backend
│   │   ├── anime.functions.ts      # TanStack Start Server Functions
│   │   ├── anime-types.ts          # Tipe yang dipakai frontend
│   │   ├── queries.ts              # Konfigurasi TanStack Query
│   │   ├── stream-proxy.server.ts  # Proxy video dengan Range
│   │   ├── download-manager.ts     # Pengunduh per segmen dan IndexedDB
│   │   ├── watchlist.ts            # Watchlist, ekspor dan impor
│   │   ├── history.ts              # Riwayat dan posisi putar
│   │   ├── gamification.ts         # EXP, level, badge
│   │   └── site-config.ts          # Metadata dan SEO
│   ├── routes/                     # Rute berbasis berkas TanStack Router
│   ├── server.ts                   # Entrypoint server
│   └── styles.css                  # Gaya global Tailwind v4
├── firestore.rules                 # Aturan keamanan Firestore
├── package.json                    # Dependensi dan skrip
└── README.md
```

---

## // Menjalankan Lokal

### Prasyarat

- Node.js 20.x atau 22.x
- npm 10.x atau lebih baru

### Langkah

```bash
git clone https://github.com/NimzzAI/nontonime.git
cd nontonime
npm install
cp .env.example .env
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Bagian anime tidak butuh pengaturan, jadi aplikasi langsung jalan dengan keenam sumbernya tanpa mengisi `.env`.

Untuk uji build produksi:

```bash
npm run build
npm run start
```

---

## // Variabel Lingkungan

Sumber anime tidak memakai variabel lingkungan sama sekali. Alamat, daftar sumber, dan urutan prioritasnya tetap di kode, jadi aplikasi langsung jalan tanpa mengisi apa pun untuk bagian anime.

Variabel di bawah hanya untuk akun Firebase dan notifikasi push, dan semuanya opsional.

| Variabel                    | Fungsi                                          |
| :-------------------------- | :---------------------------------------------- |
| `VITE_FIREBASE_API_KEY`     | API key Firebase untuk sinkronisasi akun.       |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domain autentikasi Firebase.                    |
| `VITE_FIREBASE_PROJECT_ID`  | ID proyek Firebase.                             |
| `VAPID_PRIVATE_KEY`         | Kunci privat Web Push, hanya dipakai di server. |
| `VITE_VAPID_PUBLIC_KEY`     | Kunci publik Web Push untuk browser.            |

Kalau suatu saat alamat sumber pindah, ubah konstanta di bagian atas file sumbernya di `src/lib/sources/`: `DEFAULT_BASE` untuk NontonAnimeID, Gomunime, Aniwatch, Stucknime, dan Kusonime, `DEFAULT_DOMAINS` untuk Samehadaku, serta `BASE_URL` dan `API_BASE` untuk AnimeIn. Untuk mematikan sumber atau mengubah prioritasnya, ubah `DEFAULT_SOURCE_IDS` di `registry.server.ts`.

> Jangan menaruh `VAPID_PRIVATE_KEY` atau rahasia server lain di variabel berawalan `VITE_`, karena variabel itu ikut terkirim ke browser.

---

## // Deploy ke Vercel

1. Impor repositori di Vercel. Framework terdeteksi sebagai TanStack Start lewat `vercel.json`.
2. Isi variabel Firebase dan VAPID kalau fitur itu dipakai. Bagian anime tidak butuh variabel apa pun.
3. Deploy. Scraper berjalan di fungsi server yang sama dengan aplikasinya, tidak ada layanan kedua.

Catatan untuk Vercel:

- Memuat detail anime dari AnimeIn bisa memakai beberapa request berurutan (episode diambil per halaman, sampai 10 halaman). Pastikan batas durasi fungsi di plan Anda cukup untuk anime dengan episode banyak.
- Beberapa situs sumber membatasi IP datacenter. Kalau satu sumber selalu gagal di produksi tapi jalan di lokal, cek log fungsi untuk status HTTP-nya, lalu keluarkan sumber itu dari `DEFAULT_SOURCE_IDS` di `registry.server.ts` atau ganti alamatnya di file sumbernya.
- Cache dalam memori tidak dibagi antar instance, jadi request pertama ke instance baru selalu lebih lambat.

---

## // Menambah Sumber Baru

1. Buat `src/lib/sources/namasumber.server.ts` dan ekspor objek bertipe `AnimeSource`:

   ```ts
   import type { AnimeSource } from "./types";

   export const namasumber: AnimeSource = {
     id: "namasumber",
     label: "Nama Sumber",
     async search(keyword, page) { /* kembalikan { items, hasNext } */ },
     async getDetail(slug) { /* kembalikan SourceDetail */ },
     async getStream(slug) { /* kembalikan SourceStream */ },
     // Metode berikut opsional: getHome, getLatest, getPopular,
     // getGenres, getByGenre, getSchedule
   };
   ```

2. Tambahkan ID barunya ke `SourceId` di `types.ts` dan awalan pendeknya ke `SOURCE_PREFIX` serta `PREFIX_TO_SOURCE` di `ids.ts`. Perbarui juga pola di `parseId`.
3. Daftarkan di `registry.server.ts` pada `ALL_SOURCES` dan `DEFAULT_SOURCE_IDS`.
4. Gunakan `makeItem`, `toAnimeId`, dan `toEpisodeId` agar ID dan skor terformat seragam, serta `fetchText` atau `fetchJson` dari `http.server.ts` agar timeout dan pesan error konsisten.

Metode yang tidak diisi tidak menjadi masalah. Lapisan gabungan melewati sumber yang tidak memilikinya.

---

## // Migrasi dari Versi Sebelumnya

- **ID lama.** Anime yang tersimpan di watchlist atau riwayat memakai slug Otakudesu tanpa awalan. Saat halaman anime dibuka dengan ID seperti itu, server mencari ulang judulnya di semua sumber dan memakai hasil terbaik. Kalau judul tidak ditemukan, halaman menampilkan error.
- **Episode lama.** ID episode lama tidak bisa dicari ulang. Buka episodenya lewat halaman anime supaya memakai ID baru.
- **Riwayat tontonan** yang terkait ID lama tetap tersimpan, tetapi posisi putarnya hanya terpakai kalau ID-nya cocok dengan ID baru.
- **Env lama.** `SANKA_API_BASE` dan `SANKA_API_FALLBACK` tidak dibaca lagi dan aman dihapus. Worker Cloudflare yang dulu dipakai sebagai proxy Sanka juga tidak diperlukan.

---

## // Pemecahan Masalah

| Gejala                                         | Kemungkinan penyebab dan langkah                                                                                         |
| :--------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| Beranda kosong                                 | Semua sumber gagal. Lihat log server untuk baris `[sources] ... gagal`, lalu periksa alamat sumber di file masing-masing.     |
| Satu sumber tidak pernah muncul                | Domainnya pindah atau struktur HTMLnya berubah. Ganti `DEFAULT_BASE` di file sumbernya, atau cek selector di file itu.   |
| Halaman Tamat menampilkan daftar populer biasa | Halaman ini menyaring daftar populer lewat kata `tamat`, `complete`, `finish`, atau `selesai` pada status. Kalau tidak ada yang cocok, daftar populer ditampilkan apa adanya. |
| Server tertentu di pemutar kosong atau error   | Token server gagal diurai, host ditolak pemeriksaan keamanan, atau nonce NontonAnimeID kedaluwarsa. Muat ulang halaman episode. |
| Detail anime lambat                            | AnimeIn mengambil episode per halaman. Anime dengan banyak episode butuh beberapa request, hasilnya di-cache 15 menit.    |
| Tombol batch tidak muncul                      | Kusonime tidak menemukan judul yang cocok, atau pencarian melewati batas 4 detik. Batch bersifat tambahan, bukan kewajiban. |
| Error 403 dari satu sumber di produksi         | IP datacenter diblokir situs sumber. Keluarkan sumber itu dari `DEFAULT_SOURCE_IDS` atau pakai alamat mirror. |

---

## // Catatan Streaming

1. **Pemilihan server.** Server pertama pada daftar dicoba lebih dulu. Kalau gagal diputar, pemutar pindah ke server berikutnya.
2. **HTTP Range.** Pemutar memakai `/api/stream-proxy` untuk meneruskan potongan byte, sehingga lompat waktu tidak menunggu video selesai diunduh.
3. **Autoplay dan Sleep Timer.** Autoplay episode berikutnya punya hitung mundur 5 detik. Sleep Timer bisa diatur 15 sampai 60 menit.
4. **Memori server.** Proxy meneruskan data sebagai stream, tidak menampung seluruh berkas di memori.

---

## // Batasan yang Diketahui

- Scraper membaca HTML situs pihak lain. Kalau situs mengubah tampilan, selector di file sumbernya bisa berhenti bekerja dan perlu diperbarui. Domain sumber juga bisa berpindah.
- Scraper tidak punya tes otomatis terhadap situs aslinya. Bagian yang bisa diuji tanpa jaringan (format ID, token, cache, pemeriksaan URL) sudah dicoba, tetapi pembacaan HTML tiap sumber perlu dicoba langsung setelah deploy.
- Hanya AnimeIn dan NontonAnimeID yang punya daftar terbaru dan populer bertingkat serta jadwal. Sumber lain muncul di halaman pertama, pencarian, dan genre.
- Daftar episode dari AnimeIn diambil per 30 episode dengan batas 10 halaman, jadi satu anime menampilkan paling banyak 300 episode. Batas ada di `MAX_EPISODE_PAGES` pada `sources/animein.server.ts`.
- Genre digabung berdasarkan nama. Nama genre yang ditulis berbeda antar situs bisa muncul sebagai dua genre.
- Halaman daftar abjad (`getDirectory`) tidak lagi diisi, karena sumber baru tidak punya daftar semacam itu. Fungsinya masih ada dan mengembalikan daftar kosong.
- Scraper Samehadaku asli tidak punya pencarian dan pemanggilan player AJAX. Dua hal itu ditambahkan di sini dengan pola umum situs WordPress, jadi perlu dicoba langsung. Genre Samehadaku tidak tersedia.
- Item di beranda Samehadaku menaut ke halaman episode. Slug anime diturunkan dengan memotong bagian `-episode-N`, yang bisa meleset untuk judul dengan pola slug tidak biasa.

---

## // Perintah npm

```bash
npm run dev      # Server development lokal
npm run build    # Build produksi
npm run start    # Menjalankan hasil build
npm run lint     # ESLint
npm run format   # Prettier
=======
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
>>>>>>> 29d30b74a34c4b8e1a20df21d47e03c7dd54e479
```

---

<<<<<<< HEAD
## // Disclaimer dan Kredit

nontonime tidak menyimpan atau meng-host berkas video. Semua konten berasal dari situs pihak ketiga, dan hak ciptanya dimiliki pemegang haknya masing-masing. Pemilik konten dapat meminta penghapusan lewat pengelola situs sumber.

- **Pengembang**: [NimzzAI](https://github.com/NimzzAI)
- **Basis logika scraper**: backend hwaverseB
- **Lisensi**: [MIT License](./LICENSE)
=======
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
>>>>>>> 29d30b74a34c4b8e1a20df21d47e03c7dd54e479
