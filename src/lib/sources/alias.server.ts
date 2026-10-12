import {
  looksRelated,
  levenshtein,
  normalizeLoose,
  parseSearchQuery,
  stripSymbols,
} from "../search-query";

export interface AnimeAliasData {
  romaji: string;
  english: string | null;
  native: string | null;
  synonyms: string[];
}

const aliasCache = new Map<string, AnimeAliasData | null>();

/**
 * Curated bidirectional dictionary of 100+ high-traffic anime titles
 * between Romaji (used by Indonesian Sub sources like Samehadaku, Animein, Kusonime)
 * and English titles (used by Aniwatch, global sources, or user searches).
 */
const CURATED_ALIASES: Record<string, { romaji: string; english: string; synonyms?: string[] }> = {
  // Yuru Camp / Laid-Back Camp / ゆるキャン
  "yuru camp": {
    romaji: "Yuru Camp△",
    english: "Laid-Back Camp",
    synonyms: ["Yurucamp", "Yurukyan", "ゆるキャン△", "ゆるキャン"],
  },
  "laid back camp": {
    romaji: "Yuru Camp△",
    english: "Laid-Back Camp",
    synonyms: ["Yurucamp", "Yurukyan", "ゆるキャン△"],
  },
  "laid-back camp": {
    romaji: "Yuru Camp△",
    english: "Laid-Back Camp",
    synonyms: ["Yurucamp", "Yurukyan", "ゆるキャン△"],
  },
  ゆるキャン: {
    romaji: "Yuru Camp△",
    english: "Laid-Back Camp",
    synonyms: ["Yuru Camp", "Yurucamp", "Yurukyan"],
  },
  "ゆるキャン△": {
    romaji: "Yuru Camp△",
    english: "Laid-Back Camp",
    synonyms: ["Yuru Camp", "Yurucamp", "Yurukyan"],
  },
  yurucamp: {
    romaji: "Yuru Camp△",
    english: "Laid-Back Camp",
    synonyms: ["Yurukyan", "ゆるキャン"],
  },
  "heya camp": {
    romaji: "Heya Camp△",
    english: "Room Camp",
    synonyms: ["Heyacamp", "へやキャン△"],
  },
  へやキャン: { romaji: "Heya Camp△", english: "Room Camp", synonyms: ["Heyacamp"] },
  "へやキャン△": { romaji: "Heya Camp△", english: "Room Camp", synonyms: ["Heyacamp"] },

  // Tonikaku Kawaii / Tonikawa: Over the Moon for You
  "tonikaku kawaii": {
    romaji: "Tonikaku Kawaii",
    english: "Tonikawa: Over the Moon for You",
    synonyms: ["Tonikawa", "Tonikaku Cawaii", "Fly Me to the Moon"],
  },
  tonikawa: {
    romaji: "Tonikaku Kawaii",
    english: "Tonikawa: Over the Moon for You",
    synonyms: ["Tonikawa", "Tonikaku Cawaii", "Fly Me to the Moon"],
  },
  "tonikawa over the moon for you": {
    romaji: "Tonikaku Kawaii",
    english: "Tonikawa: Over the Moon for You",
    synonyms: ["Tonikawa", "Fly Me to the Moon"],
  },
  "fly me to the moon": {
    romaji: "Tonikaku Kawaii",
    english: "Tonikawa: Over the Moon for You",
    synonyms: ["Tonikawa", "Tonikaku Cawaii"],
  },
  tokinawa: {
    romaji: "Tonikaku Kawaii",
    english: "Tonikawa: Over the Moon for You",
    synonyms: ["Tonikawa"],
  },

  // Attack on Titan / Shingeki no Kyojin / 進撃の巨人
  "attack on titan": {
    romaji: "Shingeki no Kyojin",
    english: "Attack on Titan",
    synonyms: ["SnK", "AoT", "進撃の巨人"],
  },
  "shingeki no kyojin": {
    romaji: "Shingeki no Kyojin",
    english: "Attack on Titan",
    synonyms: ["SnK", "AoT", "進撃の巨人"],
  },
  進撃の巨人: {
    romaji: "Shingeki no Kyojin",
    english: "Attack on Titan",
    synonyms: ["SnK", "AoT"],
  },

  // Demon Slayer / Kimetsu no Yaiba / 鬼滅の刃
  "demon slayer": {
    romaji: "Kimetsu no Yaiba",
    english: "Demon Slayer",
    synonyms: ["KnY", "鬼滅の刃"],
  },
  "kimetsu no yaiba": {
    romaji: "Kimetsu no Yaiba",
    english: "Demon Slayer",
    synonyms: ["KnY", "鬼滅の刃"],
  },
  鬼滅の刃: { romaji: "Kimetsu no Yaiba", english: "Demon Slayer", synonyms: ["KnY"] },

  // Jujutsu Kaisen / 呪術廻戦
  "jujutsu kaisen": {
    romaji: "Jujutsu Kaisen",
    english: "Jujutsu Kaisen",
    synonyms: ["JJK", "Sorcery Fight", "呪術廻戦"],
  },
  呪術廻戦: {
    romaji: "Jujutsu Kaisen",
    english: "Jujutsu Kaisen",
    synonyms: ["JJK"],
  },

  // Bocchi the Rock / ぼっち・ざ・ろっく
  "bocchi the rock": {
    romaji: "Bocchi the Rock!",
    english: "Bocchi the Rock!",
    synonyms: ["BTR", "ぼっち・ざ・ろっく!"],
  },
  "ぼっち・ざ・ろっく": {
    romaji: "Bocchi the Rock!",
    english: "Bocchi the Rock!",
    synonyms: ["BTR"],
  },
  "ぼっち・ざ・ろっく!": {
    romaji: "Bocchi the Rock!",
    english: "Bocchi the Rock!",
    synonyms: ["BTR"],
  },

  // My Hero Academia / Boku no Hero Academia
  "my hero academia": {
    romaji: "Boku no Hero Academia",
    english: "My Hero Academia",
    synonyms: ["BnHA", "MHA"],
  },
  "boku no hero academia": {
    romaji: "Boku no Hero Academia",
    english: "My Hero Academia",
    synonyms: ["BnHA", "MHA"],
  },

  // Frieren / Sousou no Frieren
  frieren: { romaji: "Sousou no Frieren", english: "Frieren: Beyond Journey's End" },
  "sousou no frieren": { romaji: "Sousou no Frieren", english: "Frieren: Beyond Journey's End" },
  "frieren beyond journeys end": {
    romaji: "Sousou no Frieren",
    english: "Frieren: Beyond Journey's End",
  },

  // The Eminence in Shadow / Kage no Jitsuryokusha
  "the eminence in shadow": {
    romaji: "Kage no Jitsuryokusha ni Naritakute!",
    english: "The Eminence in Shadow",
  },
  "kage no jitsuryokusha": {
    romaji: "Kage no Jitsuryokusha ni Naritakute!",
    english: "The Eminence in Shadow",
  },
  "kage no jitsuryokusha ni naritakute": {
    romaji: "Kage no Jitsuryokusha ni Naritakute!",
    english: "The Eminence in Shadow",
  },

  // Solo Leveling / Ore dake Level Up na Ken
  "solo leveling": { romaji: "Ore dake Level Up na Ken", english: "Solo Leveling" },
  "ore dake level up na ken": { romaji: "Ore dake Level Up na Ken", english: "Solo Leveling" },

  // Mushoku Tensei / Jobless Reincarnation
  "mushoku tensei": {
    romaji: "Mushoku Tensei: Isekai Ittara Honki Dasu",
    english: "Mushoku Tensei: Jobless Reincarnation",
  },
  "jobless reincarnation": {
    romaji: "Mushoku Tensei: Isekai Ittara Honki Dasu",
    english: "Mushoku Tensei: Jobless Reincarnation",
  },

  // That Time I Got Reincarnated as a Slime / Tensura
  "that time i got reincarnated as a slime": {
    romaji: "Tensei shitara Slime Datta Ken",
    english: "That Time I Got Reincarnated as a Slime",
    synonyms: ["Tensura"],
  },
  "tensei shitara slime datta ken": {
    romaji: "Tensei shitara Slime Datta Ken",
    english: "That Time I Got Reincarnated as a Slime",
    synonyms: ["Tensura"],
  },
  tensura: {
    romaji: "Tensei shitara Slime Datta Ken",
    english: "That Time I Got Reincarnated as a Slime",
  },

  // Jujutsu Kaisen
  "jujutsu kaisen": {
    romaji: "Jujutsu Kaisen",
    english: "Jujutsu Kaisen",
    synonyms: ["JJK", "Sorcery Fight"],
  },
  "sorcery fight": { romaji: "Jujutsu Kaisen", english: "Jujutsu Kaisen" },

  // The Apothecary Diaries / Kusuriya no Hitorigoto
  "the apothecary diaries": { romaji: "Kusuriya no Hitorigoto", english: "The Apothecary Diaries" },
  "kusuriya no hitorigoto": { romaji: "Kusuriya no Hitorigoto", english: "The Apothecary Diaries" },

  // Delicious in Dungeon / Dungeon Meshi
  "delicious in dungeon": { romaji: "Dungeon Meshi", english: "Delicious in Dungeon" },
  "dungeon meshi": { romaji: "Dungeon Meshi", english: "Delicious in Dungeon" },

  // DanMachi / Is It Wrong to Try to Pick Up Girls in a Dungeon
  danmachi: {
    romaji: "Dungeon ni Deai o Motomeru no wa Machigatteiru Darou ka",
    english: "Is It Wrong to Try to Pick Up Girls in a Dungeon?",
  },
  "is it wrong to try to pick up girls in a dungeon": {
    romaji: "Dungeon ni Deai o Motomeru no wa Machigatteiru Darou ka",
    english: "Is It Wrong to Try to Pick Up Girls in a Dungeon?",
  },

  // The Rising of the Shield Hero / Tate no Yuusha
  "the rising of the shield hero": {
    romaji: "Tate no Yuusha no Nariagari",
    english: "The Rising of the Shield Hero",
  },
  "tate no yuusha no nariagari": {
    romaji: "Tate no Yuusha no Nariagari",
    english: "The Rising of the Shield Hero",
  },

  // The Quintessential Quintuplets / Go-toubun no Hanayome
  "the quintessential quintuplets": {
    romaji: "Go-toubun no Hanayome",
    english: "The Quintessential Quintuplets",
  },
  "gotoubun no hanayome": {
    romaji: "Go-toubun no Hanayome",
    english: "The Quintessential Quintuplets",
  },

  // Kaguya-sama / Kaguya-sama: Love Is War
  "kaguya sama": { romaji: "Kaguya-sama wa Kokurasetai", english: "Kaguya-sama: Love Is War" },
  "kaguya sama love is war": {
    romaji: "Kaguya-sama wa Kokurasetai",
    english: "Kaguya-sama: Love Is War",
  },

  // Chainsaw Man
  "chainsaw man": { romaji: "Chainsaw Man", english: "Chainsaw Man", synonyms: ["CSM"] },

  // Oshi no Ko / My Star
  "oshi no ko": { romaji: "Oshi no Ko", english: "Oshi no Ko", synonyms: ["My Star"] },
  "my star": { romaji: "Oshi no Ko", english: "Oshi no Ko" },

  // Kaiju No. 8
  "kaiju no 8": { romaji: "Kaijuu 8-gou", english: "Kaiju No. 8" },
  "kaijuu 8 gou": { romaji: "Kaijuu 8-gou", english: "Kaiju No. 8" },

  // Wind Breaker
  "wind breaker": { romaji: "Wind Breaker", english: "Wind Breaker" },

  // Blue Lock
  "blue lock": { romaji: "Blue Lock", english: "Blue Lock" },

  // Fire Force / Enen no Shouboutai
  "fire force": { romaji: "Enen no Shouboutai", english: "Fire Force" },
  "enen no shouboutai": { romaji: "Enen no Shouboutai", english: "Fire Force" },

  // Konosuba
  konosuba: {
    romaji: "Kono Subarashii Sekai ni Shukufuku o!",
    english: "KonoSuba: God's Blessing on This Wonderful World!",
  },
  "kono subarashii sekai ni shukufuku o": {
    romaji: "Kono Subarashii Sekai ni Shukufuku o!",
    english: "KonoSuba: God's Blessing on This Wonderful World!",
  },

  // Re:Zero
  "re zero": {
    romaji: "Re:Zero kara Hajimeru Isekai Seikatsu",
    english: "Re:ZERO -Starting Life in Another World-",
  },
  rezero: {
    romaji: "Re:Zero kara Hajimeru Isekai Seikatsu",
    english: "Re:ZERO -Starting Life in Another World-",
  },

  // Spy x Family
  "spy x family": { romaji: "SPY×FAMILY", english: "Spy x Family" },
  "spy family": { romaji: "SPY×FAMILY", english: "Spy x Family" },

  // Bleach
  bleach: { romaji: "Bleach", english: "Bleach" },
  "bleach thousand year blood war": {
    romaji: "Bleach: Sennen Kessen-hen",
    english: "Bleach: Thousand-Year Blood War",
  },

  // Fullmetal Alchemist
  "fullmetal alchemist": {
    romaji: "Hagane no Renkinjutsushi",
    english: "Fullmetal Alchemist",
    synonyms: ["FMA"],
  },
  "fullmetal alchemist brotherhood": {
    romaji: "Hagane no Renkinjutsushi: Brotherhood",
    english: "Fullmetal Alchemist: Brotherhood",
    synonyms: ["FMAB"],
  },

  // Haikyuu
  haikyuu: { romaji: "Haikyuu!!", english: "Haikyu!!" },
  haikyu: { romaji: "Haikyuu!!", english: "Haikyu!!" },

  // Kuroko's Basketball
  "kuroko no basket": { romaji: "Kuroko no Basket", english: "Kuroko's Basketball" },
  "kurokos basketball": { romaji: "Kuroko no Basket", english: "Kuroko's Basketball" },

  // One Piece
  "one piece": { romaji: "ONE PIECE", english: "One Piece" },

  // Naruto
  naruto: { romaji: "Naruto", english: "Naruto" },
  "naruto shippuden": { romaji: "Naruto: Shippuuden", english: "Naruto Shippuden" },

  // Dragon Ball
  "dragon ball": { romaji: "Dragon Ball", english: "Dragon Ball" },
  "dragon ball super": { romaji: "Dragon Ball Super", english: "Dragon Ball Super" },

  // Hunter x Hunter
  "hunter x hunter": { romaji: "Hunter x Hunter", english: "Hunter x Hunter" },

  // Vinland Saga
  "vinland saga": { romaji: "Vinland Saga", english: "Vinland Saga" },

  // Hell's Paradise / Jigokuraku
  "hells paradise": { romaji: "Jigokuraku", english: "Hell's Paradise" },
  jigokuraku: { romaji: "Jigokuraku", english: "Hell's Paradise" },

  // Shangri-La Frontier
  "shangri la frontier": { romaji: "Shangri-La Frontier", english: "Shangri-La Frontier" },
  "shangrila frontier": { romaji: "Shangri-La Frontier", english: "Shangri-La Frontier" },

  // Bocchi the Rock
  "bocchi the rock": { romaji: "Bocchi the Rock!", english: "Bocchi the Rock!" },

  // Mashle
  mashle: { romaji: "Mashle", english: "Mashle: Magic and Muscles" },

  // My Dress-Up Darling
  "my dress up darling": {
    romaji: "Sono Bisque Doll wa Koi o Suru",
    english: "My Dress-Up Darling",
  },
  "sono bisque doll wa koi o suru": {
    romaji: "Sono Bisque Doll wa Koi o Suru",
    english: "My Dress-Up Darling",
  },

  // Dr. Stone
  "dr stone": { romaji: "Dr. Stone", english: "Dr. Stone" },

  // Tokyo Revengers
  "tokyo revengers": { romaji: "Tokyo Revengers", english: "Tokyo Revengers" },

  // Overlord
  overlord: { romaji: "Overlord", english: "Overlord" },

  // Sword Art Online
  "sword art online": {
    romaji: "Sword Art Online",
    english: "Sword Art Online",
    synonyms: ["SAO"],
  },

  // Steins;Gate
  "steins gate": { romaji: "Steins;Gate", english: "Steins;Gate" },
};

function normalizeKey(str: string): string {
  return normalizeLoose(str);
}

/** Cari kunci kamus yang paling mirip (toleran salah ketik, misalnya "tokinawa" ke "tonikawa"). */
function fuzzyCuratedKey(key: string): string | null {
  if (key.length < 5) return null;
  const allowed = key.length <= 6 ? 1 : 2;
  let best: { key: string; dist: number } | null = null;
  for (const candidate of Object.keys(CURATED_ALIASES)) {
    if (Math.abs(candidate.length - key.length) > allowed) continue;
    const dist = levenshtein(key, normalizeKey(candidate), allowed);
    if (dist <= allowed && (!best || dist < best.dist)) best = { key: candidate, dist };
  }
  return best ? best.key : null;
}

/**
 * Mencari alias judul (Romaji, Inggris, Jepang, sinonim) dari kamus lokal, lalu AniList.
 * Mengembalikan alias untuk judul INTI saja, nomor season ditangani terpisah oleh pemanggil.
 */
export async function resolveAnimeAliases(term: string): Promise<AnimeAliasData | null> {
  const clean = stripSymbols(parseSearchQuery(term).base);
  if (!clean || clean.length < 2) return null;

  const key = normalizeKey(clean);
  if (aliasCache.has(key)) {
    return aliasCache.get(key) ?? null;
  }

  // 1. Kamus lokal: persis, lalu mirip (salah ketik)
  const curatedKey = CURATED_ALIASES[key] ? key : fuzzyCuratedKey(key);
  const hit = curatedKey ? CURATED_ALIASES[curatedKey] : undefined;
  if (hit) {
    const data: AnimeAliasData = {
      romaji: hit.romaji,
      english: hit.english,
      native: null,
      synonyms: hit.synonyms ?? [],
    };
    aliasCache.set(key, data);
    return data;
  }

  // 2. AniList GraphQL (timeout 2 detik). Hasilnya dipakai hanya bila mirip dengan yang diketik.
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        title {
          romaji
          english
          native
        }
        synonyms
      }
    }
  `;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables: { search: clean } }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = (await res.json()) as {
        data?: {
          Media?: {
            title?: { romaji?: string; english?: string; native?: string };
            synonyms?: string[];
          };
        };
      };
      const media = json?.data?.Media;
      if (media?.title) {
        const names = [media.title.romaji, media.title.english, ...(media.synonyms ?? [])];
        if (looksRelated(clean, names)) {
          const data: AnimeAliasData = {
            romaji: media.title.romaji || clean,
            english: media.title.english || null,
            native: media.title.native || null,
            synonyms: media.synonyms || [],
          };
          aliasCache.set(key, data);
          return data;
        }
      }
    }
  } catch {
    // ignore lookup error
  }

  aliasCache.set(key, null);
  return null;
}

/**
 * Daftar kueri untuk dikirim ke situs sumber, urutan pertama = judul inti.
 * Selalu bersih dari "sub indo", "season N", dan simbol. Bila ada season, tiap nama juga
 * dicoba dalam bentuk "<nama> Season N" karena sebagian situs menulis judulnya begitu.
 */
export async function getSearchQueryTerms(term: string): Promise<string[]> {
  const parsed = parseSearchQuery(term);
  if (!parsed.base) return [];
  const alias = await resolveAnimeAliases(parsed.base);

  const names = [parsed.base, alias?.romaji, alias?.english, ...(alias?.synonyms ?? []).slice(0, 2)]
    .filter((n): n is string => Boolean(n))
    .map(stripSymbols)
    .filter((n) => n.length >= 2);

  const out: string[] = [];
  const seen = new Set<string>();
  const push = (value: string) => {
    const k = normalizeKey(value);
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(value);
    }
  };
  for (const name of names) {
    push(name);
    if (parsed.season && parsed.season > 1) push(`${name} Season ${parsed.season}`);
  }
  return out;
}

/**
 * Checks if a candidate title matches the user query or any known aliases.
 */
export function isTitleMatchingQuery(
  candidateTitle: string,
  userQuery: string,
  aliases?: AnimeAliasData | null,
): boolean {
  const c = candidateTitle.toLowerCase();
  const q = userQuery.toLowerCase().trim();

  if (c.includes(q)) return true;

  if (aliases) {
    if (aliases.romaji && c.includes(aliases.romaji.toLowerCase())) return true;
    if (aliases.english && c.includes(aliases.english.toLowerCase())) return true;
    for (const syn of aliases.synonyms) {
      if (c.includes(syn.toLowerCase())) return true;
    }
  }

  return false;
}
