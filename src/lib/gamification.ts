import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface UserGamification {
  level: number;
  exp: number; // current exp in this level
  maxExp: number; // exp needed to reach next level
  totalExp: number;
  rankTitle: string;
  rankBadgeColor: string;
  dailyStreak: number;
  lastCheckIn?: string; // YYYY-MM-DD
}

const STORAGE_KEY = "nonton-gamification-v1";

const RANKS = [
  { minLevel: 1, title: "Penonton Pemula", color: "from-zinc-500 to-zinc-600" },
  { minLevel: 3, title: "Pencari Anime", color: "from-blue-500 to-indigo-600" },
  { minLevel: 6, title: "Wibu Junior", color: "from-teal-500 to-emerald-600" },
  { minLevel: 10, title: "Otaku Terampil", color: "from-amber-500 to-orange-600" },
  { minLevel: 15, title: "Wibu Elit", color: "from-purple-500 to-indigo-700" },
  { minLevel: 20, title: "Hokage Anime", color: "from-rose-500 to-red-600" },
  { minLevel: 28, title: "Wibu Sepuh", color: "from-yellow-400 to-amber-600" },
  { minLevel: 35, title: "Dewa Anime", color: "from-fuchsia-600 via-pink-600 to-amber-500" },
];

export function getRankInfo(level: number) {
  let matched = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) {
      matched = r;
    }
  }
  return matched;
}

export function getMaxExpForLevel(level: number): number {
  return Math.round(100 * Math.pow(1.2, level - 1));
}

const DEFAULT_GAMIFICATION: UserGamification = {
  level: 1,
  exp: 0,
  maxExp: 100,
  totalExp: 0,
  rankTitle: "Penonton Pemula",
  rankBadgeColor: "from-zinc-500 to-zinc-600",
  dailyStreak: 0,
};

export function readGamification(): UserGamification {
  if (typeof window === "undefined") return DEFAULT_GAMIFICATION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_GAMIFICATION;
    const parsed = JSON.parse(raw);
    const maxExp = getMaxExpForLevel(parsed.level || 1);
    const rank = getRankInfo(parsed.level || 1);
    return {
      level: parsed.level || 1,
      exp: parsed.exp || 0,
      maxExp,
      totalExp: parsed.totalExp || 0,
      rankTitle: rank.title,
      rankBadgeColor: rank.color,
      dailyStreak: parsed.dailyStreak || 0,
      lastCheckIn: parsed.lastCheckIn,
    };
  } catch {
    return DEFAULT_GAMIFICATION;
  }
}

export function saveGamification(data: UserGamification) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("gamification-updated", { detail: data }));

  // Sync to Firestore if authenticated
  if (auth.currentUser) {
    const userRef = doc(db, "users", auth.currentUser.uid);
    setDoc(
      userRef,
      {
        gamification: data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    ).catch((err) => {
      console.warn("Failed to sync gamification to Firestore:", err);
    });
  }
}

export async function fetchRemoteGamification(userId: string): Promise<UserGamification | null> {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.gamification) {
        return data.gamification as UserGamification;
      }
    }
  } catch (e) {
    console.warn("Could not fetch remote gamification:", e);
  }
  return null;
}

export interface AddExpResult {
  newLevel: number;
  leveledUp: boolean;
  expGained: number;
  reason: string;
}

export function addExp(amount: number, reason: string): AddExpResult {
  const current = readGamification();
  let level = current.level;
  let exp = current.exp + amount;
  const totalExp = current.totalExp + amount;
  let leveledUp = false;

  while (exp >= getMaxExpForLevel(level)) {
    exp -= getMaxExpForLevel(level);
    level += 1;
    leveledUp = true;
  }

  const rank = getRankInfo(level);
  const updated: UserGamification = {
    ...current,
    level,
    exp,
    maxExp: getMaxExpForLevel(level),
    totalExp,
    rankTitle: rank.title,
    rankBadgeColor: rank.color,
  };

  saveGamification(updated);

  // Dispatch celebratory event for UI banner
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("exp-gained", {
        detail: {
          expGained: amount,
          reason,
          leveledUp,
          newLevel: level,
          rankTitle: rank.title,
        },
      }),
    );
  }

  return {
    newLevel: level,
    leveledUp,
    expGained: amount,
    reason,
  };
}

export function claimDailyCheckIn(): { success: boolean; expGained: number; message: string } {
  const today = new Date().toISOString().slice(0, 10);
  const current = readGamification();

  if (current.lastCheckIn === today) {
    return {
      success: false,
      expGained: 0,
      message: "Kamu sudah klaim absen harian hari ini. Kembali lagi besok ya!",
    };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = current.lastCheckIn === yesterday ? current.dailyStreak + 1 : 1;
  const expReward = 50 + Math.min(newStreak * 10, 50); // bonus for streaks!

  const result = addExp(expReward, `Absen Harian ke-${newStreak}`);

  const updated: UserGamification = {
    ...readGamification(),
    dailyStreak: newStreak,
    lastCheckIn: today,
  };
  saveGamification(updated);

  return {
    success: true,
    expGained: expReward,
    message: `Berhasil Absen! +${expReward} EXP didapatkan (Streak ${newStreak} Hari 🔥)`,
  };
}
