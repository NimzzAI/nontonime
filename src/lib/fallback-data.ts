import type {
  AnimeDetail,
  AnimeSummary,
  GenreItem,
  HomeSections,
  ScheduleMap,
} from "./anime-types";

export const FALLBACK_ANIME: AnimeSummary[] = [
  {
    id: "futsutsuka-akujo-gozaimasu-sub-indo",
    title: "Futsutsuka na Akujo dewa Gozaimasu ga",
    synonyms: "ふつつかな悪女ではございますが ～雛宮蝶鼠とりかえ伝～",
    type: "TV",
    status: "Ongoing",
    day: "Minggu",
    year: "2026",
    views: 89400,
    favorites: 3420,
    genres: ["Fantasy", "Romance", "Villainess"],
    poster: "https://otakudesu.blog/wp-content/uploads/2026/07/158341-1.jpg",
    cover: "https://otakudesu.blog/wp-content/uploads/2026/07/158341-1.jpg",
    airedStart: "12 Jul 2026",
    synopsis:
      "Guna mencari permaisuri berikutnya, lima keluarga bangsawan mengirim putri mereka masing-masing ke Harem Istana. Di sana Kou Reirin, yang dikenal sebagai Kupu-kupu Rapuh, bertukar tubuh dengan Shu Keigetsu, yang dijuluki Tikus Pengadilan.",
  },
  {
    id: "solo-leveling-season-2-sub-indo",
    title: "Solo Leveling Season 2: Arise from the Shadow",
    synonyms: "Ore dake Level Up na Ken Season 2",
    type: "TV",
    status: "Ongoing",
    day: "Minggu",
    year: "2026",
    views: 198000,
    favorites: 12400,
    genres: ["Action", "Adventure", "Fantasy"],
    poster:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    cover:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
    airedStart: "Jan 2026",
    synopsis:
      "Sung Jin-Woo melanjutkan perjalanannya setelah membangkitkan kekuatan Shadow Monarch. Bersama para prajurit bayangan yang setia, ia menghadapi ancaman dungeon berperingkat S yang mengancam keselamatan umat manusia.",
  },
  {
    id: "jjk-s3-sub-indo",
    title: "Jujutsu Kaisen Season 3: The Culling Game",
    synonyms: "Jujutsu Kaisen: Shimetsukaiyou",
    type: "TV",
    status: "Ongoing",
    day: "Kamis",
    year: "2026",
    views: 245000,
    favorites: 18900,
    genres: ["Action", "Supernatural", "School", "Shounen"],
    poster: "https://otakudesu.blog/wp-content/uploads/2026/01/154488.jpg",
    cover: "https://otakudesu.blog/wp-content/uploads/2026/01/154488.jpg",
    airedStart: "Jul 2026",
    synopsis:
      "Setelah insiden Shibhuya yang memporak-porandakan Tokyo, Kenjaku memulai Culling Game. Yuji Itadori dan Megumi Fushiguro harus terjun ke dalam permainan mematikan ini demi menyelamatkan Tsumiki dan membebaskan Satoru Gojo.",
  },
  {
    id: "slime-s4-sub-indo",
    title: "Tensei shitara Slime Datta Ken Season 4",
    synonyms: "That Time I Got Reincarnated as a Slime Season 4",
    type: "TV",
    status: "Ongoing",
    day: "Jumat",
    year: "2026",
    views: 135000,
    favorites: 8700,
    genres: ["Action", "Adventure", "Comedy", "Fantasy", "Isekai"],
    poster: "https://otakudesu.blog/wp-content/uploads/2026/04/156389.jpg",
    cover: "https://otakudesu.blog/wp-content/uploads/2026/04/156389.jpg",
    airedStart: "Apr 2026",
    synopsis:
      "Rimuru Tempest terus memperkuat Federasi Jura Tempest pasca rekonsiliasi dengan Gereja Barat. Namun intrik baru dari Kekaisaran Timur mulai membayangi kedamaian yang baru diraih para monster.",
  },
  {
    id: "sousou-no-frieren-sub-indo",
    title: "Sousou no Frieren (Frieren: Beyond Journey's End)",
    synonyms: "Frieren at the Funeral",
    type: "TV",
    status: "Completed",
    day: null,
    year: "2024",
    views: 310000,
    favorites: 24500,
    genres: ["Adventure", "Drama", "Fantasy"],
    poster:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    cover:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
    airedStart: "Sep 2023",
    synopsis:
      "Penyihir elf Frieren telah mengalahkan Raja Iblis bersama kelompok pahlawannya. Sebagai makhluk abadi dengan rentang hidup ribuan tahun, ia memulai perjalanan baru untuk memahami nilai waktu dan arti hubungan antar manusia.",
  },
  {
    id: "kimetsu-no-yaiba-hashira-training-sub-indo",
    title: "Demon Slayer: Kimetsu no Yaiba - Hashira Training Arc",
    synonyms: "Kimetsu no Yaiba: Hashira Geiko-hen",
    type: "TV",
    status: "Completed",
    day: null,
    year: "2024",
    views: 420000,
    favorites: 31000,
    genres: ["Action", "Historical", "Supernatural"],
    poster:
      "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
    cover:
      "https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80",
    airedStart: "Mei 2024",
    synopsis:
      "Tanjiro dan Pasukan Pembasmi Iblis menjalani pelatihan berat di bawah bimbingan para Hashira untuk bersiap menghadapi pertempuran akhir melawan Muzan Kibutsuji di Infinity Castle.",
  },
  {
    id: "kaiju-no-8-sub-indo",
    title: "Kaiju No. 8",
    synonyms: "Monster #8",
    type: "TV",
    status: "Completed",
    day: null,
    year: "2024",
    views: 184000,
    favorites: 9600,
    genres: ["Action", "Sci-Fi", "Military"],
    poster:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    cover:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    airedStart: "Apr 2024",
    synopsis:
      "Kafka Hibino yang bekerja sebagai pembersih sisa bangkai Kaiju tiba-tiba memperoleh kemampuan untuk bertransformasi menjadi Kaiju berdaya hancur tinggi. Dengan tekad membara, ia berjuang masuk ke Pasukan Pertahanan Jepang.",
  },
  {
    id: "heroine-seijo-iie-sub-indo",
    title: "Heroine? Seijo? Iie, All Works Maid desu (Hokori)!",
    synonyms: "Heroine? Saint? No, I'm an All-Works Maid (with Pride)!",
    type: "TV",
    status: "Completed",
    day: null,
    year: "2026",
    views: 62000,
    favorites: 2100,
    genres: ["Comedy", "Fantasy", "Slice of Life"],
    poster:
      "https://otakudesu.blog/wp-content/uploads/2026/09/Heroine-Seijo-Iie-All-Works-Maid-desu-Hokori-Sub-Indo.jpg",
    cover:
      "https://otakudesu.blog/wp-content/uploads/2026/09/Heroine-Seijo-Iie-All-Works-Maid-desu-Hokori-Sub-Indo.jpg",
    airedStart: "Jul 2026",
    synopsis:
      "Kisah seorang pelayan serba bisa yang bangga akan pekerjaannya dan mengatasi berbagai konflik istana dengan dedikasi tinggi serta kemampuan rumah tangga tingkat legendaris.",
  },
];

export const FALLBACK_HOME: HomeSections = {
  slider: FALLBACK_ANIME.slice(0, 5),
  today: FALLBACK_ANIME.filter((a) => a.status === "Ongoing"),
  hot: [FALLBACK_ANIME[1]!, FALLBACK_ANIME[2]!, FALLBACK_ANIME[0]!],
  popular: FALLBACK_ANIME.filter((a) => a.status === "Completed"),
  new: FALLBACK_ANIME.slice(0, 6),
  waiting: [FALLBACK_ANIME[3]!, FALLBACK_ANIME[0]!],
};

export const FALLBACK_GENRES: GenreItem[] = [
  { id: "action", name: "Action", group: null, image: null },
  { id: "adventure", name: "Adventure", group: null, image: null },
  { id: "comedy", name: "Comedy", group: null, image: null },
  { id: "drama", name: "Drama", group: null, image: null },
  { id: "fantasy", name: "Fantasy", group: null, image: null },
  { id: "isekai", name: "Isekai", group: null, image: null },
  { id: "mystery", name: "Mystery", group: null, image: null },
  { id: "romance", name: "Romance", group: null, image: null },
  { id: "sci-fi", name: "Sci-Fi", group: null, image: null },
  { id: "shounen", name: "Shounen", group: null, image: null },
  { id: "slice-of-life", name: "Slice of Life", group: null, image: null },
  { id: "supernatural", name: "Supernatural", group: null, image: null },
];

export const FALLBACK_SCHEDULE: ScheduleMap = {
  SENIN: [FALLBACK_ANIME[3]!],
  SELASA: [FALLBACK_ANIME[0]!],
  RABU: [FALLBACK_ANIME[6]!],
  KAMIS: [FALLBACK_ANIME[2]!],
  JUMAT: [FALLBACK_ANIME[3]!],
  SABTU: [FALLBACK_ANIME[1]!],
  MINGGU: [FALLBACK_ANIME[0]!, FALLBACK_ANIME[1]!],
};

export const FALLBACK_DETAILS: Record<string, AnimeDetail> = {
  "futsutsuka-akujo-gozaimasu-sub-indo": {
    ...FALLBACK_ANIME[0]!,
    studio: "Doga Kobo",
    airedEnd: null,
    totalEpisodes: 12,
    episodes: Array.from({ length: 11 }, (_, i) => ({
      id: `fnadgg-episode-${11 - i}-sub-indo`,
      number: 11 - i,
      title: `Episode ${11 - i} Subtitle Indonesia`,
      views: 3500 + i * 200,
      releaseDate: `${20 - i} Sep 2026`,
      image: FALLBACK_ANIME[0]!.poster,
      isNew: i === 0,
    })),
  },
  "solo-leveling-season-2-sub-indo": {
    ...FALLBACK_ANIME[1]!,
    studio: "A-1 Pictures",
    airedEnd: null,
    totalEpisodes: 13,
    episodes: Array.from({ length: 12 }, (_, i) => ({
      id: `solo-leveling-s2-episode-${12 - i}-sub-indo`,
      number: 12 - i,
      title: `Episode ${12 - i} Subtitle Indonesia`,
      views: 12000 + i * 500,
      releaseDate: `${15 - i} Sep 2026`,
      image: FALLBACK_ANIME[1]!.poster,
      isNew: i === 0,
    })),
  },
};
