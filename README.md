# nontonime

Aplikasi web untuk menonton dan mengelola koleksi anime subtitle Indonesia. Katalognya digabung dari delapan situs sumber lewat scraper yang berjalan di server aplikasi ini sendiri, tanpa API pihak ketiga dan tanpa backend terpisah.

Demo: https://nontonime.vercel.app/ - Dokumentasi bahasa Inggris: [README.en.md](README.en.md)

Stack: TanStack Start (React 19, SSR), TanStack Router, TanStack Query, Tailwind CSS v4, Vite, Nitro. Deploy target: Vercel.

## Fitur

- Beranda, daftar terbaru, populer, genre, jadwal, dan pencarian yang digabung dari beberapa sumber. Judul kembar hanya tampil sekali.
- Pencarian lintas sumber dengan pembersihan kata kunci (`sub indo`, `nonton`, `episode N`) dan pengenalan nomor season.
- Pemutar multi server yang mendukung MP4, HLS, dan embed. Server dikelompokkan per kualitas dan pemutar pindah ke server berikutnya saat stream gagal atau macet lebih dari 10 detik.
- Proxy stream dengan dukungan HTTP Range, jadi seeking tidak menunggu berkas selesai diunduh.
- Pengunduh offline per segmen 2 MB ke IndexedDB, bisa dijeda dan dilanjutkan.
- Watchlist, riwayat tontonan dengan posisi putar, ekspor dan impor JSON.
- Level, EXP, dan badge dari riwayat tontonan.
- PWA dengan navigasi bawah, safe-area, dan notifikasi push opsional.
- Fitur sosial di atas Firebase dan Supabase: komentar berbalas, profil publik, follow, teman, klan, chat, dan notifikasi.

## Sumber data

Setiap sumber adalah satu file di `src/lib/sources/` yang mengimplementasikan antarmuka `AnimeSource`. Tidak semua sumber punya semua fitur. Halaman hanya diisi dari sumber yang mendukungnya.

| Sumber        | ID              | Awalan | Beranda                                        | Terbaru dan populer | Cari | Genre | Jadwal | Unduhan |
| :------------ | :-------------- | :----: | :--------------------------------------------- | :-----------------: | :--: | :---: | :----: | :-----: |
| AnimeIn       | `animein`       |  `ai`  | slider, hari ini, hot, populer, baru, menunggu |     bertingkat      |  ya  |  ya   |   ya   |  tidak  |
| NontonAnimeID | `nontonanimeid` |  `na`  | terbaru, populer, film                         |     bertingkat      |  ya  |  ya   |   ya   |   ya    |
| NontonAnime   | `nontonanime`   |  `nn`  | tidak ada                                      |      tidak ada      |  ya  | tidak | tidak  |   ya    |
| Gomunime      | `gomunime`      |  `gm`  | terbaru, populer                               |      halaman 1      |  ya  |  ya   | tidak  |  tidak  |
| Aniwatch      | `aniwatch`      |  `aw`  | terbaru, populer                               |      halaman 1      |  ya  |  ya   | tidak  |  tidak  |
| Stucknime     | `stucknime`     | `stk`  | terbaru                                        |      halaman 1      |  ya  |  ya   | tidak  |  tidak  |
| Samehadaku    | `samehadaku`    |  `sh`  | terbaru, populer, film                         |      halaman 1      |  ya  | tidak | tidak  |   ya    |
| Nimegami      | `nimegami`      |  `ng`  | slider, hari ini, populer, terbaru             |     bertingkat      |  ya  |  ya   | tidak  |   ya    |
| Kusonime      | -               |  `ks`  | -                                              |          -          |  -   |   -   |   -    |   ya    |

Keterangan:

- "Bertingkat" berarti sumber punya daftar dengan halaman kedua dan seterusnya. "Halaman 1" berarti sumber hanya ikut lewat data berandanya pada halaman pertama.
- NontonAnime tidak punya beranda, daftar terbaru, genre, atau jadwal di sini. Sumber ini muncul lewat pencarian, lalu halaman detail dan episodenya dibuka seperti sumber lain.
- Kusonime bukan sumber streaming. Dipakai untuk mencari batch unduhan berdasarkan judul, hasilnya jadi tombol batch di halaman detail bila ada yang cocok.
- Halaman Jadwal hanya terisi dari AnimeIn dan NontonAnimeID.
- Kalau judul yang sama ada di beberapa sumber, yang tampil adalah sumber dengan urutan lebih awal di `DEFAULT_SOURCE_IDS` (`registry.server.ts`).

## Proxy dan bypass

Banyak situs sumber dan hoster video memeriksa `Referer`, memasang frame-buster, atau tidak mengirim header CORS. Semua itu ditangani di server lewat empat endpoint, jadi pemutar di browser cukup memakai alamat dari aplikasi sendiri.

| Endpoint              | Fungsi                                                                                                                                                                                                     |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/stream-proxy`   | Meneruskan media dengan header `Range`, tanpa menampung berkas di memori. Parameter `ref` (opsional) menentukan `Referer` ke upstream. Kalau upstream mengembalikan HTML, alamat video dicari di dalamnya. |
| `/api/embed-proxy`    | Mengambil halaman embed, menyisipkan `<base>`, membuang skrip frame-buster, dan menimpa `document.referrer` dengan nilai `ref`. Untuk BerkasDrive dan Aniwatch memakai pemutar bersih.                     |
| `/api/nimegami-proxy` | Proxy khusus Nimegami dan BerkasDrive, termasuk pemeriksa stream.                                                                                                                                          |
| `/api/stream-check`   | Probe ringan (HEAD atau Range) untuk menentukan jenis dan kesehatan sebuah URL. Dipakai panel diagnostik pemutar.                                                                                          |

Selain itu ada `/api/image-proxy` untuk poster dan `/api/ping` untuk pemeriksaan hidup.

Semua endpoint yang meneruskan URL dari browser menolak protokol selain `http` dan `https`, host `localhost`, IP privat, alamat metadata cloud, dan nama domain yang resolve ke IP privat. `stream-proxy` juga membatasi port.

### NontonAnime

Halaman episode NontonAnime menanam seluruh data episode di variabel JavaScript `allEpisodes`. Setiap episode punya sampai tiga server (`video_url`, `video_url2`, `video_url3`) dan sampai enam tautan unduhan (`download_url_1` sampai `download_url_6`). URL server berupa halaman embed dengan parameter `link` berisi URL stream asli dalam base64.

Provider `nontonanime.server.ts` memperlakukannya begini:

1. `allEpisodes` dibaca dengan pemindai kurung yang memahami string, bukan regex, supaya data yang memuat `];` tidak terpotong.
2. Parameter `link` didekode di server.
3. Hasil dekode berupa media langsung (`m3u8`, `mp4`, `webm`, `mkv`, `mov`) dikirim lewat `/api/stream-proxy` dengan `ref` ke `https://nontonanime.id/`. Hasil dekode lain dikirim lewat `/api/embed-proxy`.
4. Setiap server juga punya versi cadangan bernama "(Bypass Embed)" yang membuka URL embed aslinya lewat `/api/embed-proxy`.
5. URL yang menunjuk ke host privat dibuang sebelum server dibentuk.

Server langsung ditaruh di depan server bypass, jadi pemutar mencobanya lebih dulu.

## Arsitektur

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
       |     |-- nontonanime.server.ts     (JSON live-search, HTML, data episode di halaman)
       |     |-- gomunime.server.ts        (HTML, cheerio, dekripsi AES-GCM)
       |     |-- aniwatch.server.ts        (HTML, cheerio)
       |     |-- stucknime.server.ts       (HTML, cheerio)
       |     |-- samehadaku.server.ts      (HTML, cheerio, player lewat AJAX)
       |     |-- nimegami.server.ts        (HTML, cheerio)
       |-- kusonime.server.ts              (pencarian batch)
  -> Hasil dipetakan ke AnimeSummary, AnimeDetail, StreamResult (anime-types.ts)
```

### Modul

| File                                 | Fungsi                                                                                                                                |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/anime-service.server.ts`    | Titik masuk backend. Menggabungkan sumber, memetakan data ke tipe frontend, mengatur cache dan timeout.                               |
| `src/lib/sources/types.ts`           | Antarmuka `AnimeSource` dan tipe internal (`SourceItem`, `SourceDetail`, `SourceStream`).                                             |
| `src/lib/sources/registry.server.ts` | Daftar sumber dan urutan prioritasnya.                                                                                                |
| `src/lib/sources/ids.ts`             | Pembuatan dan pembacaan ID berawalan sumber, normalisasi judul.                                                                       |
| `src/lib/sources/http.server.ts`     | Wrapper `fetch` dengan timeout, User-Agent browser, dan error bernama sumber.                                                         |
| `src/lib/sources/cache.server.ts`    | Cache dalam memori, penggabungan request kembar, `withTimeout`.                                                                       |
| `src/lib/sources/token.server.ts`    | Pengodean referensi server menjadi token, serta pemeriksaan URL publik.                                                               |
| `src/lib/sources/*.server.ts`        | Satu file per sumber.                                                                                                                 |
| `src/lib/stream-proxy.server.ts`     | `/api/stream-proxy` dan `/api/stream-check`.                                                                                          |
| `src/lib/embed-proxy.server.ts`      | `/api/embed-proxy`.                                                                                                                   |
| `src/server.ts`                      | Entrypoint server dan pemetaan rute `/api/*`.                                                                                         |
| `providers.ts`                       | Daftar hoster video yang dikenali (Streamwish, Mp4Upload, BerkasDrive, dan lainnya), dipakai scraper Nimegami untuk menyaring tautan. |

### Format ID

ID membawa nama sumbernya, jadi server tahu harus bertanya ke mana tanpa menyimpan pemetaan.

| Jenis   | Format               | Contoh                         |
| :------ | :------------------- | :----------------------------- |
| Anime   | `<awalan>_<slug>`    | `na_one-piece`, `nn_yuru-camp` |
| Episode | `<awalan>_ep_<slug>` | `nn_ep_yuru-camp-episode-3`    |
| Batch   | `ks_<slug>`          | `ks_one-piece-batch-sub-indo`  |

Awalan: `ai` AnimeIn, `na` NontonAnimeID, `nn` NontonAnime, `gm` Gomunime, `aw` Aniwatch, `stk` Stucknime, `sh` Samehadaku, `ng` Nimegami, `ks` Kusonime.

### Cache

Cache berada di memori proses, maksimal 500 entri, entri tertua dibuang lebih dulu.

| Data                        | Lama simpan |
| :-------------------------- | :---------- |
| Beranda, terbaru, pencarian | 5 menit     |
| Populer                     | 10 menit    |
| Detail anime, halaman genre | 15 menit    |
| Jadwal rilis, batch unduhan | 30 menit    |
| Daftar genre                | 60 menit    |
| Pencarian batch Kusonime    | 6 jam       |
| Stream episode              | 3 menit     |

- Request kembar digabung. Beberapa pengunjung yang meminta data sama bersamaan hanya memicu satu request ke situs sumber.
- Kalau pembaruan gagal dan masih ada salinan lama, salinan itu yang dikembalikan. Kalau belum ada salinan, error diteruskan.
- Di Vercel setiap instance fungsi punya cache sendiri dan cache hilang saat instance berhenti.

### Penggabungan hasil

- Semua sumber dipanggil bersamaan. Sumber yang gagal atau melewati 14 detik dilewati dan dicatat di log server sebagai `[sources] nama.aksi gagal`. Detail dan stream episode punya batas 25 detik.
- Hasil tiap sumber diselang-seling, jadi satu sumber tidak menguasai daftar.
- Judul kembar dibuang setelah dinormalkan (huruf kecil, tanpa kata seperti "sub indo", "nonton", "streaming", "season", "musim", tanpa tanda baca).
- Pencarian diurutkan dengan skor kecocokan judul: sama persis, diawali kata kunci, lalu jumlah kata yang cocok.
- Kalau semua sumber gagal, halaman daftar menampilkan error, sedangkan beranda mengembalikan bagian kosong supaya halamannya tetap terbuka.

### Server streaming

Daftar server dikelompokkan per kualitas. Setiap server dikirim ke browser sebagai token tertutup (`srv1.` diikuti data base64url), bukan URL mentah. Token diurai di server saat pengguna memilih server lewat `resolveServer`.

- Server berjenis URL dibuka apa adanya. Kalau halaman embed berisi alamat `.m3u8` atau `.mp4`, server mencoba mengambilnya supaya diputar lewat pemutar sendiri.
- NontonAnimeID menyimpan server cadangan di balik request AJAX berisi nonce. Token membawa data yang dibutuhkan dan URL player baru diminta saat server dipilih.
- Samehadaku menaruh sebagian player di balik request AJAX (`player_ajax`). Token membawa `post`, `nume`, dan `type`.
- Gomunime memakai player Putarin dengan konfigurasi terenkripsi AES-256-GCM. Kalau gagal dibuka, tersedia server embed biasa.
- Server dengan awalan ID `ai_`, `sh_`, `gm_`, `na_`, `nn_`, dan server dari host tertentu diberi label `[SUB INDO]` dan diprioritaskan.

### Keamanan

- Token server datang dari browser, jadi isinya tidak dipercaya. URL di dalamnya harus berprotokol `http` atau `https` dan host-nya bukan `localhost`, IP privat, atau alamat metadata cloud.
- Endpoint AJAX NontonAnimeID wajib memakai host yang sama dengan situs sumbernya.
- Semua panggilan ke situs sumber terjadi di server. Tidak ada kunci atau URL sumber yang masuk ke bundel klien.

## Struktur direktori

```text
nontonime/
├── public/                     Aset publik, manifest PWA, service worker
├── src/
│   ├── components/
│   │   ├── anime/              Pemutar, kartu, rak, modal, navigasi
│   │   ├── social/             Avatar, badge, relasi, notifikasi sosial
│   │   └── ui/                 Komponen primitif UI
│   ├── hooks/
│   ├── lib/
│   │   ├── sources/            Scraper per sumber dan pendukungnya
│   │   ├── anime-service.server.ts
│   │   ├── anime.functions.ts  TanStack Start Server Functions
│   │   ├── stream-proxy.server.ts
│   │   ├── embed-proxy.server.ts
│   │   ├── nimegami-proxy.server.ts
│   │   ├── image-proxy.server.ts
│   │   ├── download-manager.ts Pengunduh per segmen dan IndexedDB
│   │   ├── firebase.ts, social.ts, chat.ts, clan.ts
│   │   └── watchlist.ts, history.ts, gamification.ts
│   ├── routes/                 Rute berbasis berkas TanStack Router
│   ├── server.ts
│   └── styles.css
├── supabase/setup.sql          Membuat bucket avatars dan banners
├── firestore.rules
├── providers.ts
└── package.json
```

## Menjalankan lokal

Prasyarat: Node.js 20.19 atau lebih baru, atau 22.12 atau lebih baru (syarat Vite), dan npm.

```bash
git clone https://github.com/NimzzAI/nontonime.git
cd nontonime
npm install
cp .env.example .env
npm run dev
```

Buka http://localhost:3000. Bagian anime tidak butuh pengaturan, jadi semua sumber langsung jalan tanpa mengisi `.env`.

Uji build produksi:

```bash
npm run build
npm run start
```

## Variabel lingkungan

Sumber anime tidak memakai variabel lingkungan. Alamat, daftar sumber, dan urutan prioritasnya ada di kode. Variabel di bawah untuk akun Firebase, fitur sosial, unggah gambar, dan notifikasi push, semuanya opsional untuk bagian anime.

| Variabel                              | Fungsi                                                                                                                   |
| :------------------------------------ | :----------------------------------------------------------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`               | API key Firebase. Server juga memakainya untuk memverifikasi login.                                                      |
| `VITE_FIREBASE_AUTH_DOMAIN`           | Domain autentikasi Firebase.                                                                                             |
| `VITE_FIREBASE_PROJECT_ID`            | ID proyek Firebase.                                                                                                      |
| `VITE_FIREBASE_APP_ID`                | ID aplikasi web Firebase.                                                                                                |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`   | Sender ID Firebase Cloud Messaging.                                                                                      |
| `VITE_FIREBASE_STORAGE_BUCKET`        | Bucket penyimpanan Firebase.                                                                                             |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | ID database Firestore.                                                                                                   |
| `SUPABASE_URL`                        | URL proyek Supabase. Hanya server.                                                                                       |
| `SUPABASE_SERVICE_ROLE_KEY`           | Service role key Supabase. Rahasia, hanya server, jangan diawali `VITE_`.                                                |
| `VAPID_PRIVATE_KEY`                   | Kunci privat Web Push. Hanya server.                                                                                     |
| `VITE_VAPID_PUBLIC_KEY`               | Kunci publik Web Push untuk browser.                                                                                     |
| `EXTRAS_URL`, `EXTRAS_CDN_URL`        | Opsional. Alamat sumber fitur tambahan (karakter, hitung mundur, berita, top search). Kosong berarti fitur itu nonaktif. |

Variabel berawalan `VITE_` ikut terkirim ke browser. Jangan menaruh rahasia di sana.

Kalau alamat sebuah sumber pindah, ubah konstanta di bagian atas file sumbernya di `src/lib/sources/`: `DEFAULT_BASE` untuk NontonAnimeID, NontonAnime, Gomunime, Aniwatch, Stucknime, dan Kusonime, `DEFAULT_DOMAINS` untuk Samehadaku, serta `BASE_URL` untuk Nimegami dan AnimeIn (AnimeIn juga punya `API_BASE`). Untuk mematikan sumber atau mengubah prioritasnya, ubah `DEFAULT_SOURCE_IDS` di `registry.server.ts`.

## Firebase dan Supabase

### Firebase (akun, komentar, sosial, notifikasi)

1. Aktifkan Authentication (Google dan Email/Password) dan Firestore di Firebase Console.
2. Deploy aturan keamanan:

   ```bash
   firebase deploy --only firestore:rules
   ```

   Atau salin isi `firestore.rules` ke Firebase Console, Firestore, Rules, lalu Publish.

3. Akun owner ditentukan dari email terverifikasi. Daftarnya ada di `OWNER_EMAILS` pada `src/lib/roles.ts` dan di fungsi `isOwner()` pada `firestore.rules`. Ubah keduanya bersamaan.
4. Login sebagai owner dan buka halaman Klan sekali. Klan bawaan hanya boleh dibuat owner, dan pengguna lain baru bisa bergabung setelah klannya ada.

Koleksi Firestore:

| Koleksi                              | Isi                                                              | Akses                                             |
| :----------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------ |
| `users/{uid}`                        | Data pribadi (termasuk email), watchlist, riwayat.               | Hanya pemiliknya.                                 |
| `profiles/{uid}`                     | Salinan publik: nama, avatar, banner, border, level, klan, role. | Baca semua orang, tulis pemiliknya.               |
| `follows/{a}_{b}`                    | Relasi follow.                                                   | Baca semua orang, buat dan hapus oleh pengikut.   |
| `friendRequests/{a}_{b}`             | Permintaan teman.                                                | Dua pihak yang terlibat.                          |
| `friendships/{a}_{b}`                | Pertemanan, ID berupa uid terurut.                               | Dibuat penerima, hanya bila permintaannya ada.    |
| `chats/{a}_{b}/messages/{id}`        | Pesan chat.                                                      | Dua peserta.                                      |
| `users/{uid}/notifications/{id}`     | Kotak masuk notifikasi.                                          | Pemilik membaca, orang lain hanya menambah.       |
| `announcements/{id}`                 | Pengumuman update situs.                                         | Baca semua orang, tulis hanya owner.              |
| `clans/{id}` dan `.../members/{uid}` | Klan dan anggotanya.                                             | Pemimpin mengelola, anggota bergabung dan keluar. |
| `episodes/{id}/comments/{id}`        | Komentar dan balasan.                                            | Penulis, owner (moderasi), like oleh siapa pun.   |

Notifikasi berjalan realtime lewat Firestore dan notifikasi sistem browser selama situs atau PWA terbuka. Push saat browser tertutup butuh Firebase Cloud Messaging dengan service account dan belum disertakan.

### Supabase (avatar dan banner)

1. Buat proyek, lalu jalankan `supabase/setup.sql` di SQL Editor. Skrip ini membuat bucket publik `avatars` dan `banners`.
2. Isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` di `.env` atau Environment Variables Vercel.
3. Alur unggah: browser memperkecil gambar (avatar 512x512, banner 1600x600, WebP) dan mengirimnya bersama ID token Firebase. Server memverifikasi token lewat Identity Toolkit, memeriksa tipe file dari isinya, menyimpan ke `avatars/<uid>/...` atau `banners/<uid>/...`, lalu menghapus file lama milik pengguna itu. Kunci Supabase tidak sampai ke browser.

## Deploy ke Vercel

1. Impor repositori di Vercel. Framework terdeteksi sebagai TanStack Start lewat `vercel.json`.
2. Isi variabel Firebase, Supabase, dan VAPID kalau fitur itu dipakai.
3. Deploy. Scraper berjalan di fungsi server yang sama dengan aplikasinya.

Hal yang perlu diperhatikan:

- Detail anime dari AnimeIn bisa memakai beberapa request berurutan (episode diambil per halaman, sampai 10 halaman). Pastikan batas durasi fungsi di plan cukup untuk anime dengan episode banyak.
- Beberapa situs sumber memblokir IP datacenter. Kalau satu sumber selalu gagal di produksi tapi jalan di lokal, cek status HTTP di log fungsi, lalu keluarkan sumber itu dari `DEFAULT_SOURCE_IDS` atau ganti alamatnya.
- Cache dalam memori tidak dibagi antar instance, jadi request pertama ke instance baru lebih lambat.
- `/api/embed-proxy` membuffer respons non-HTML. Gunakan `/api/stream-proxy` untuk media.

## Menambah sumber baru

1. Buat `src/lib/sources/namasumber.server.ts` dan ekspor objek bertipe `AnimeSource`. Hanya `search`, `getDetail`, dan `getStream` yang wajib. `getHome`, `getLatest`, `getPopular`, `getGenres`, `getByGenre`, dan `getSchedule` opsional.

   ```ts
   import type { AnimeSource } from "./types";

   export const namasumber: AnimeSource = {
     id: "namasumber",
     label: "Nama Sumber",
     async search(keyword, page) {
       // kembalikan { items, hasNext }
     },
     async getDetail(slug) {
       // kembalikan SourceDetail
     },
     async getStream(slug) {
       // kembalikan SourceStream
     },
   };
   ```

2. Tambahkan ID baru ke `SourceId` di `types.ts`, awalan pendeknya ke `SOURCE_PREFIX` dan `PREFIX_TO_SOURCE` di `ids.ts`, lalu perbarui regex awalan di `parseId` dan `extractTitleAndEpisodeFromSlug`.
3. Daftarkan di `registry.server.ts` pada `ALL_SOURCES` dan `DEFAULT_SOURCE_IDS`.
4. Kalau sumbernya berbahasa Indonesia, tambahkan awalan ID dan nama hostnya ke `isServerSubIndo` di `anime-service.server.ts` supaya serverya diberi label dan prioritas `[SUB INDO]`.
5. Pakai `makeItem`, `toAnimeId`, dan `toEpisodeId` agar ID dan skor seragam, serta `fetchText` atau `fetchJson` dari `http.server.ts` agar timeout dan pesan error konsisten.
6. Kalau hoster sumber butuh `Referer` tertentu atau memasang frame-buster, arahkan servernya lewat `/api/stream-proxy?url=...&ref=...` untuk media atau `/api/embed-proxy?url=...&ref=...` untuk halaman embed. Contohnya ada di `nontonanime.server.ts`. Periksa host dengan `assertPublicHttpUrl` sebelum membentuk URL.

Metode yang tidak diisi dilewati oleh lapisan gabungan.

## Pemecahan masalah

| Gejala                                                      | Kemungkinan penyebab dan langkah                                                                                                                            |
| :---------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beranda kosong                                              | Semua sumber gagal. Cari baris `[sources] ... gagal` di log server, lalu periksa alamat sumber di file masing-masing.                                       |
| Satu sumber tidak pernah muncul                             | Domainnya pindah atau struktur HTML berubah. Ganti `DEFAULT_BASE` atau periksa selector di file sumbernya.                                                  |
| Sumber hanya muncul di pencarian                            | Sumber itu tidak punya beranda atau daftar terbaru. Lihat tabel Sumber data. NontonAnime memang begitu.                                                     |
| Server di pemutar kosong atau error                         | Token gagal diurai, host ditolak pemeriksaan keamanan, nonce NontonAnimeID kedaluwarsa, atau upstream menolak `Referer`. Muat ulang halaman episode.        |
| Server "(Direct)" NontonAnime gagal, "(Bypass Embed)" jalan | URL hasil dekode butuh header yang tidak dikirim proxy. Cek respons `/api/stream-check` untuk URL itu.                                                      |
| Halaman Tamat menampilkan daftar populer biasa              | Halaman ini menyaring daftar populer lewat status (`tamat`, `complete`, `finish`, `selesai`). Kalau tidak ada yang cocok, daftar populer tampil apa adanya. |
| Detail anime lambat                                         | AnimeIn mengambil episode per halaman. Hasilnya di-cache 15 menit.                                                                                          |
| Tombol batch tidak muncul                                   | Kusonime tidak menemukan judul yang cocok atau pencarian melewati batas 4 detik.                                                                            |
| Unggah avatar atau banner gagal                             | Cek `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`, pastikan `supabase/setup.sql` sudah dijalankan, dan akun yang dipakai bukan mode tamu.                  |
| `Missing or insufficient permissions`                       | `firestore.rules` terbaru belum dideploy atau pengguna belum login. Mode tamu tidak bisa berkomentar, chat, atau berteman.                                  |
| Error 403 dari satu sumber di produksi                      | IP datacenter diblokir situs sumber. Keluarkan sumber itu dari `DEFAULT_SOURCE_IDS` atau pakai alamat mirror.                                               |

## Batasan yang diketahui

- Scraper membaca HTML situs pihak lain. Kalau tampilan situs berubah, selector bisa berhenti bekerja dan perlu diperbarui. Domain sumber juga bisa pindah.
- Tidak ada tes otomatis terhadap situs asli. Pembacaan HTML tiap sumber perlu dicoba langsung setelah deploy.
- NontonAnime hanya mendukung pencarian (halaman pertama), detail, dan stream. Pembacaan detailnya memakai pola label di HTML, sehingga field seperti studio atau genre bisa kosong kalau markup situs berbeda dari yang diperkirakan.
- Daftar episode AnimeIn diambil per 30 episode dengan batas 10 halaman, jadi satu anime menampilkan paling banyak 300 episode (`MAX_EPISODE_PAGES` di `sources/animein.server.ts`).
- Genre digabung berdasarkan nama. Penulisan berbeda antar situs bisa muncul sebagai dua genre.
- Scraper Samehadaku asli tidak punya pencarian dan pemanggilan player AJAX. Keduanya ditambahkan di sini dengan pola umum situs WordPress, jadi perlu dicoba langsung. Genre Samehadaku tidak tersedia.
- Item di beranda Samehadaku menaut ke halaman episode. Slug anime diturunkan dengan memotong `-episode-N`, yang bisa meleset untuk pola slug tidak biasa.
- Playlist HLS yang dilewatkan `/api/stream-proxy` tidak ditulis ulang. Segmen dengan URL relatif tidak melewati proxy.
- Fitur sosial belum punya rate limit di sisi server. Aturan Firestore mencegah pemalsuan identitas, bukan spam dari akun asli.
- Level dan EXP tersimpan di dokumen pengguna sendiri dan bisa dimanipulasi pemiliknya. Level hanya dipakai untuk tampilan dan membuka border. Hak owner ditentukan dari email terverifikasi.
- Chat belum punya fitur blokir atau laporan.
- Fitur tambahan dari hianime-api mencocokkan anime dengan judul persis, jadi judul yang ditulis berbeda antar situs tidak mendapat karakter atau hitung mundur.

## Catatan migrasi

- Anime di watchlist atau riwayat dengan ID lama (slug Otakudesu tanpa awalan) dicari ulang lewat judulnya di semua sumber saat dibuka. Kalau judul tidak ditemukan, halaman menampilkan error.
- ID episode lama tidak bisa dicari ulang. Buka episodenya lewat halaman anime.
- `SANKA_API_BASE` dan `SANKA_API_FALLBACK` tidak dibaca lagi dan aman dihapus.

## Perintah npm

```bash
npm run dev      # Server development lokal
npm run build    # Build produksi
npm run start    # Menjalankan hasil build
npm run lint     # ESLint
npm run format   # Prettier
```

## Disclaimer

nontonime tidak menyimpan atau meng-host berkas video. Semua konten berasal dari situs pihak ketiga dan hak ciptanya dimiliki pemegang haknya masing-masing. Pemilik konten dapat meminta penghapusan lewat pengelola situs sumber.
