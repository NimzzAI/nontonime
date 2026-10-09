import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  increment,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { db, auth, handleFirestoreError, OperationType, sanitizeForFirestore } from "./firebase";
import { addExp } from "./gamification";
import { isOwnerEmail } from "./roles";
import { syncPublicProfile } from "./social";

export interface Clan {
  id: string;
  name: string;
  tag: string;
  description: string;
  leaderId: string;
  leaderName: string;
  leaderAvatar?: string;
  badgeColor: string;
  bannerUrl?: string;
  memberCount: number;
  totalXp: number;
  isOpen: boolean;
  createdAt: number;
}

export interface ClanMember {
  userId: string;
  clanId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  role: "leader" | "elder" | "member";
  level: number;
  rankTitle: string;
  joinedAt: number;
}

export const DEFAULT_CLANS: Clan[] = [
  {
    id: "konoha",
    name: "Konohagakure",
    tag: "KNHA",
    description: "Desa Daun Tersembunyi tempat para shinobi tangguh menjaga tekad api kemanusiaan.",
    leaderId: "system_hokage",
    leaderName: "Naruto Uzumaki",
    leaderAvatar:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=160&auto=format&fit=crop&q=80",
    badgeColor: "from-amber-500 to-orange-600",
    memberCount: 42,
    totalXp: 15420,
    isOpen: true,
    createdAt: Date.now() - 30 * 86400000,
  },
  {
    id: "akatsuki",
    name: "Akatsuki",
    tag: "AKTSK",
    description:
      "Klan misterius berjubah awan merah, kumpulan pengelana anime penjaga keadilan bayangan.",
    leaderId: "system_pain",
    leaderName: "Nagato Pain",
    leaderAvatar:
      "https://images.unsplash.com/photo-1563089145-599997674d42?w=160&auto=format&fit=crop&q=80",
    badgeColor: "from-rose-500 to-red-700",
    memberCount: 28,
    totalXp: 12890,
    isOpen: true,
    createdAt: Date.now() - 25 * 86400000,
  },
  {
    id: "strawhat",
    name: "Straw Hat Pirates",
    tag: "MUGI",
    description:
      "Keluarga bajak laut Topi Jerami yang berlayar bebas mengarungi samudra serial anime.",
    leaderId: "system_luffy",
    leaderName: "Monkey D. Luffy",
    leaderAvatar:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=160&auto=format&fit=crop&q=80",
    badgeColor: "from-emerald-500 to-teal-600",
    memberCount: 35,
    totalXp: 13900,
    isOpen: true,
    createdAt: Date.now() - 20 * 86400000,
  },
  {
    id: "jujutsu-high",
    name: "Jujutsu High",
    tag: "JJTS",
    description: "Akademi Penyihir Jujutsu pembasmi kutukan dan penakluk setiap episode laga.",
    leaderId: "system_gojo",
    leaderName: "Satoru Gojo",
    leaderAvatar:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=160&auto=format&fit=crop&q=80",
    badgeColor: "from-purple-500 to-indigo-700",
    memberCount: 24,
    totalXp: 9800,
    isOpen: true,
    createdAt: Date.now() - 15 * 86400000,
  },
  {
    id: "survey-corps",
    name: "Survey Corps",
    tag: "SRVY",
    description: "Pasukan Pengintai sayap kebebasan pelindung peradaban dari ancaman raksasa.",
    leaderId: "system_erwin",
    leaderName: "Erwin Smith",
    leaderAvatar:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80",
    badgeColor: "from-blue-500 to-cyan-600",
    memberCount: 19,
    totalXp: 8750,
    isOpen: true,
    createdAt: Date.now() - 10 * 86400000,
  },
];

const LOCAL_CLAN_MEMBERSHIP_KEY = "nonton-local-clan-membership";

/**
 * Hook to retrieve all clans with real-time Firestore updates and seed fallback.
 */
export function useClans() {
  const [clans, setClans] = useState<Clan[]>(DEFAULT_CLANS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clansCol = collection(db, "clans");
    const unsubscribe = onSnapshot(
      clansCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Clan[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Clan);
          });
          list.sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0));
          setClans(list);
        } else {
          // If Firestore collection has no documents yet, seed default anime clans
          seedInitialClans().then(() => {
            setClans(DEFAULT_CLANS);
          });
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore clans snapshot error, using local fallback:", err);
        setError(err.message);
        setClans(DEFAULT_CLANS);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { clans, loading, error };
}

/**
 * Seeds default anime clans into Firestore if empty
 */
export async function seedInitialClans(): Promise<void> {
  // firestore.rules hanya mengizinkan owner membuat klan bawaan (leaderId "system_*"),
  // jadi pengguna biasa tidak perlu mencoba (dan tidak memenuhi log dengan error izin).
  const me = auth.currentUser;
  if (!me || !isOwnerEmail(me.email, me.emailVerified)) return;
  try {
    for (const clan of DEFAULT_CLANS) {
      const clanRef = doc(db, "clans", clan.id);
      await setDoc(clanRef, sanitizeForFirestore(clan), { merge: true });
    }
  } catch (err) {
    console.warn("Could not seed default clans:", err);
  }
}

/**
 * Hook to retrieve user's current clan and membership status
 */
export function useUserClan(userId: string | undefined | null) {
  const [userClan, setUserClan] = useState<Clan | null>(null);
  const [membership, setMembership] = useState<ClanMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUserClan(null);
      setMembership(null);
      setLoading(false);
      return;
    }

    if (userId.startsWith("guest_")) {
      const local = localStorage.getItem(LOCAL_CLAN_MEMBERSHIP_KEY);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setUserClan(parsed.clan);
          setMembership(parsed.member);
        } catch {
          // no-op
        }
      }
      setLoading(false);
      return;
    }

    // 1. Listen to user profile document to get current clanId
    const userDocRef = doc(db, "users", userId);
    const unsubUser = onSnapshot(
      userDocRef,
      async (userSnap) => {
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const clanId = userData.clanId;

          if (clanId) {
            // 2. Fetch clan document
            try {
              const clanRef = doc(db, "clans", clanId);
              const clanSnap = await getDoc(clanRef);
              if (clanSnap.exists()) {
                const clanData = clanSnap.data() as Clan;
                setUserClan(clanData);

                // 3. Fetch membership subcollection
                const memberRef = doc(db, "clans", clanId, "members", userId);
                const memberSnap = await getDoc(memberRef);
                if (memberSnap.exists()) {
                  setMembership(memberSnap.data() as ClanMember);
                } else {
                  setMembership({
                    userId,
                    clanId,
                    displayName: userData.displayName || "Member",
                    username: userData.username || "wibu",
                    avatarUrl: userData.avatarUrl || userData.photoURL || "",
                    role: userData.clanRole || "member",
                    level: userData.gamification?.level || 1,
                    rankTitle: userData.gamification?.rankTitle || "Penonton Pemula",
                    joinedAt: Date.now(),
                  });
                }
              } else {
                // Clan doesn't exist, check default seeds
                const matched = DEFAULT_CLANS.find((c) => c.id === clanId);
                if (matched) setUserClan(matched);
              }
            } catch (err) {
              console.warn("Error fetching user clan:", err);
            }
          } else {
            setUserClan(null);
            setMembership(null);
          }
        }
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsubUser();
  }, [userId]);

  return { userClan, membership, loading };
}

/**
 * Creates a new Clan in Firestore and designates creator as Leader
 */
export async function createClan(
  data: {
    name: string;
    tag: string;
    description: string;
    badgeColor?: string;
  },
  user: {
    uid: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    level?: number;
    rankTitle?: string;
    totalExp?: number;
  },
): Promise<Clan> {
  const cleanName = data.name.trim();
  const cleanTag = data.tag
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);

  if (!cleanName || cleanName.length < 3) {
    throw new Error("Nama Clan minimal 3 karakter.");
  }
  if (!cleanTag || cleanTag.length < 2) {
    throw new Error("Tag Clan harus 2-5 huruf kapital.");
  }

  const clanId = "clan_" + cleanTag.toLowerCase() + "_" + Math.random().toString(36).slice(2, 7);
  const now = Date.now();

  const newClan: Clan = {
    id: clanId,
    name: cleanName,
    tag: cleanTag,
    description: data.description.trim() || "Klan wibu pejuang anime sejati.",
    leaderId: user.uid,
    leaderName: user.displayName || "Ketua Clan",
    leaderAvatar: user.avatarUrl || "",
    badgeColor: data.badgeColor || "from-primary to-accent",
    memberCount: 1,
    totalXp: (user.totalExp || 100) + 150,
    isOpen: true,
    createdAt: now,
  };

  const memberData: ClanMember = {
    userId: user.uid,
    clanId,
    displayName: user.displayName || "Ketua",
    username: user.username || "leader",
    avatarUrl: user.avatarUrl || "",
    role: "leader",
    level: user.level || 1,
    rankTitle: user.rankTitle || "Hokage Anime",
    joinedAt: now,
  };

  // 1. If guest user, save locally
  if (user.uid.startsWith("guest_")) {
    localStorage.setItem(
      LOCAL_CLAN_MEMBERSHIP_KEY,
      JSON.stringify({ clan: newClan, member: memberData }),
    );
    addExp(150, "Mendirikan Clan Baru (+150 XP) 🚩");
    return newClan;
  }

  // 2. Persist to Firestore
  try {
    const clanRef = doc(db, "clans", clanId);
    await setDoc(clanRef, sanitizeForFirestore(newClan));

    const memberRef = doc(db, "clans", clanId, "members", user.uid);
    await setDoc(memberRef, sanitizeForFirestore(memberData));

    // Update user document
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      sanitizeForFirestore({
        clan: cleanName,
        clanId,
        clanTag: cleanTag,
        clanRole: "leader",
        updatedAt: new Date().toISOString(),
      }),
      { merge: true },
    );

    await syncPublicProfile(user.uid);
    addExp(150, "Mendirikan Clan Baru (+150 XP) 🚩");
    return newClan;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `clans/${clanId}`);
    throw err;
  }
}

/**
 * Joins an existing clan in Firestore
 */
export async function joinClan(
  clan: Clan,
  user: {
    uid: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    level?: number;
    rankTitle?: string;
    totalExp?: number;
  },
): Promise<void> {
  const memberData: ClanMember = {
    userId: user.uid,
    clanId: clan.id,
    displayName: user.displayName || "Member",
    username: user.username || "wibu",
    avatarUrl: user.avatarUrl || "",
    role: "member",
    level: user.level || 1,
    rankTitle: user.rankTitle || "Penonton Pemula",
    joinedAt: Date.now(),
  };

  // 1. Guest handling
  if (user.uid.startsWith("guest_")) {
    const updatedClan = { ...clan, memberCount: (clan.memberCount || 1) + 1 };
    localStorage.setItem(
      LOCAL_CLAN_MEMBERSHIP_KEY,
      JSON.stringify({ clan: updatedClan, member: memberData }),
    );
    addExp(50, `Bergabung ke Clan ${clan.name} (+50 XP) ⚔️`);
    return;
  }

  // 2. Firestore handling
  try {
    const clanRef = doc(db, "clans", clan.id);
    const clanSnap = await getDoc(clanRef);
    if (!clanSnap.exists()) {
      throw new Error(
        "Klan ini belum aktif di server. Minta owner membuka halaman Klan sekali untuk menyiapkannya.",
      );
    }

    const memberRef = doc(db, "clans", clan.id, "members", user.uid);
    await setDoc(memberRef, sanitizeForFirestore(memberData));

    // Hitungan atomik: dua orang yang bergabung bersamaan tidak lagi saling menimpa angkanya
    await updateDoc(clanRef, {
      memberCount: increment(1),
      totalXp: increment(Math.max(0, Math.min(user.totalExp || 50, 100000))),
    });

    // Update user document
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      sanitizeForFirestore({
        clan: clan.name,
        clanId: clan.id,
        clanTag: clan.tag,
        clanRole: "member",
        updatedAt: new Date().toISOString(),
      }),
      { merge: true },
    );

    await syncPublicProfile(user.uid);
    addExp(50, `Bergabung ke Clan ${clan.name} (+50 XP) ⚔️`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `clans/${clan.id}/members/${user.uid}`);
    throw err;
  }
}

/**
 * Leaves current clan in Firestore
 */
export async function leaveClan(clanId: string, userId: string): Promise<void> {
  if (userId.startsWith("guest_")) {
    localStorage.removeItem(LOCAL_CLAN_MEMBERSHIP_KEY);
    return;
  }

  try {
    const memberRef = doc(db, "clans", clanId, "members", userId);
    const memberSnap = await getDoc(memberRef);
    await deleteDoc(memberRef);

    // Kurangi hitungan hanya bila dokumen anggota memang ada, supaya tidak jadi negatif
    const clanRef = doc(db, "clans", clanId);
    const clanSnap = await getDoc(clanRef);
    if (memberSnap.exists() && clanSnap.exists()) {
      const current = clanSnap.data() as Clan;
      if ((current.memberCount || 0) > 0) {
        await updateDoc(clanRef, { memberCount: increment(-1) });
      }
    }

    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      sanitizeForFirestore({
        clan: "",
        clanId: "",
        clanTag: "",
        clanRole: "",
        updatedAt: new Date().toISOString(),
      }),
      { merge: true },
    );
    await syncPublicProfile(userId);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `clans/${clanId}/members/${userId}`);
    throw err;
  }
}
