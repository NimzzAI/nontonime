import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth,
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  type Firestore,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import rawFirebaseConfig from "../../firebase-applet-config.json";
import { readWatchlist, type WatchlistItem, type WatchlistStatus } from "./watchlist";
import { readHistory, type HistoryItem } from "./history";
import {
  readGamification,
  saveGamification,
  type UserGamification,
  getRankInfo,
  getMaxExpForLevel,
} from "./gamification";

const env =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env
    : ({} as Record<string, string>);

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || rawFirebaseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || rawFirebaseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || rawFirebaseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || rawFirebaseConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawFirebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || rawFirebaseConfig.appId,
  firestoreDatabaseId:
    env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || rawFirebaseConfig.firestoreDatabaseId,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

export const auth: Auth = getAuth(app);

// Use initializeFirestore with experimentalForceLongPolling to ensure reliable connectivity
// across iframes, proxies, and cloud sandbox environments.
export const db: Firestore = (() => {
  const dbId = firebaseConfig.firestoreDatabaseId || undefined;
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      dbId,
    );
  } catch {
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
})();

// SKILL REQUIREMENT: Standardized error handling
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export interface LocalGuestUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isGuest: true;
}

export function isGuestUser(user: unknown): boolean {
  if (!user || typeof user !== "object") return false;
  return "isGuest" in user && (user as { isGuest?: boolean }).isGuest === true;
}

export function loginAsGuest(name?: string): LocalGuestUser {
  const guest: LocalGuestUser = {
    uid: "guest_" + Math.random().toString(36).substring(2, 9),
    displayName: name?.trim() || "Wibu Tamu",
    email: "tamu@nontonime.local",
    isGuest: true,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("nonton-guest-user", JSON.stringify(guest));
    window.dispatchEvent(new Event("guest-auth-changed"));
  }
  return guest;
}

export interface FirestoreUserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  gamification: UserGamification;
  createdAt?: string;
  lastLogin?: string;
}

// Helper to save or update user doc in Firestore
export async function persistUserDoc(user: User, customDisplayName?: string) {
  if (!user.uid || user.uid.startsWith("guest_")) return;
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, "users", user.uid);
    const existingSnap = await getDoc(userRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;

    const currentLocalGamification = readGamification();
    const gamificationToSave: UserGamification = existingData?.gamification
      ? {
          ...currentLocalGamification,
          totalExp: Math.max(
            currentLocalGamification.totalExp,
            existingData.gamification.totalExp || 0,
          ),
          level: Math.max(currentLocalGamification.level, existingData.gamification.level || 1),
          rankTitle:
            existingData.gamification.rankTitle ||
            getRankInfo(
              Math.max(currentLocalGamification.level, existingData.gamification.level || 1),
            ).title,
        }
      : currentLocalGamification;

    await setDoc(
      userRef,
      {
        uid: user.uid,
        displayName:
          customDisplayName || user.displayName || user.email?.split("@")[0] || "Pengguna",
        email: user.email || "",
        photoURL: user.photoURL || "",
        gamification: gamificationToSave,
        lastLogin: new Date().toISOString(),
      },
      { merge: true },
    );

    // Save synced gamification back to local
    saveGamification(gamificationToSave);

    // Sync watchlist & history
    await syncUserDataOnLogin(user.uid);
  } catch (err) {
    console.warn("Could not sync user profile to Firestore:", err);
  }
}

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await persistUserDoc(result.user);
    return result.user;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    // If browser blocks popups (e.g. on mobile/Safari), trigger redirect flow
    if (error?.code === "auth/popup-blocked") {
      console.warn("Popup blocked, falling back to redirect flow...");
      await signInWithRedirect(auth, googleProvider);
      throw new Error("Membuka login Google via pengalihan halaman...");
    }
    throw err;
  }
}

export async function signInWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName: string,
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  await persistUserDoc(result.user, displayName);
  return result.user;
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  await persistUserDoc(result.user);
  return result.user;
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function signOutUser(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("nonton-guest-user");
    window.dispatchEvent(new Event("guest-auth-changed"));
  }
  if (auth.currentUser) {
    await signOut(auth);
  }
}

// Bidirectional sync between LocalStorage and Firestore
export async function syncUserDataOnLogin(userId: string) {
  try {
    // 1. Sync Watchlist
    const localWatchlist = readWatchlist();
    const watchlistColRef = collection(db, "users", userId, "watchlist");
    const remoteWatchlistSnap = await getDocs(watchlistColRef);

    const remoteMap = new Map<string, WatchlistItem>();
    remoteWatchlistSnap.forEach((d) => {
      remoteMap.set(d.id, d.data() as WatchlistItem);
    });

    // Push local to remote if remote does not have it
    for (const item of localWatchlist) {
      if (!remoteMap.has(item.animeId)) {
        await setDoc(doc(db, "users", userId, "watchlist", item.animeId), {
          ...item,
          currentEpisode: item.currentEpisode ?? 1,
          totalEpisodes: item.totalEpisodes ?? 12,
          updatedAt: Date.now(),
        });
        remoteMap.set(item.animeId, item);
      }
    }

    // Combine and save back to local
    const mergedWatchlist = Array.from(remoteMap.values());
    localStorage.setItem("nonton-watchlist-v1", JSON.stringify(mergedWatchlist));
    window.dispatchEvent(new Event("watchlist-updated"));

    // 2. Sync History
    const localHistory = readHistory();
    const historyColRef = collection(db, "users", userId, "history");
    const remoteHistorySnap = await getDocs(historyColRef);

    const historyMap = new Map<string, HistoryItem>();
    remoteHistorySnap.forEach((d) => {
      historyMap.set(d.id, d.data() as HistoryItem);
    });

    for (const item of localHistory) {
      if (!historyMap.has(item.episodeId)) {
        await setDoc(doc(db, "users", userId, "history", item.episodeId), item);
        historyMap.set(item.episodeId, item);
      }
    }

    const mergedHistory = Array.from(historyMap.values()).sort((a, b) => b.watchedAt - a.watchedAt);
    localStorage.setItem("nonton-history-v1", JSON.stringify(mergedHistory));
    window.dispatchEvent(new Event("history-updated"));
  } catch (e) {
    console.warn("Error syncing user data with Firestore:", e);
  }
}

// Save or update an anime in user's Firestore watchlist
export async function saveWatchlistItemToFirestore(userId: string, item: WatchlistItem) {
  const path = `users/${userId}/watchlist/${item.animeId}`;
  try {
    const itemRef = doc(db, "users", userId, "watchlist", item.animeId);
    const dataToSave = {
      animeId: item.animeId,
      title: item.title,
      poster: item.poster || "",
      addedAt: item.addedAt || Date.now(),
      status: item.status || "plan",
      currentEpisode: item.currentEpisode ?? 1,
      totalEpisodes: item.totalEpisodes ?? 12,
      userRating: item.userRating ?? 0,
      notes: item.notes ?? "",
      updatedAt: Date.now(),
    };
    await setDoc(itemRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Update episode tracking in Firestore
export async function updateEpisodeProgressInFirestore(
  userId: string,
  animeId: string,
  currentEpisode: number,
  totalEpisodes?: number,
) {
  const path = `users/${userId}/watchlist/${animeId}`;
  try {
    const itemRef = doc(db, "users", userId, "watchlist", animeId);
    const payload: Record<string, unknown> = {
      currentEpisode,
      updatedAt: Date.now(),
    };
    if (typeof totalEpisodes === "number" && totalEpisodes > 0) {
      payload.totalEpisodes = totalEpisodes;
    }
    // If reached max episodes, optionally auto mark completed
    if (typeof totalEpisodes === "number" && currentEpisode >= totalEpisodes) {
      payload.status = "completed";
    }
    await setDoc(itemRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Update anime status in Firestore (watching, plan, completed)
export async function updateWatchlistStatusInFirestore(
  userId: string,
  animeId: string,
  status: WatchlistStatus,
  extra?: { currentEpisode?: number; totalEpisodes?: number },
) {
  const path = `users/${userId}/watchlist/${animeId}`;
  try {
    const itemRef = doc(db, "users", userId, "watchlist", animeId);
    const payload: Record<string, unknown> = {
      status,
      updatedAt: Date.now(),
      ...extra,
    };
    await setDoc(itemRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Remove anime from Firestore watchlist
export async function deleteWatchlistItemFromFirestore(userId: string, animeId: string) {
  const path = `users/${userId}/watchlist/${animeId}`;
  try {
    const itemRef = doc(db, "users", userId, "watchlist", animeId);
    await deleteDoc(itemRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Hook for fetching and real-time syncing User Profile (Rank, XP, Level) from Firestore
export function useFirestoreUserProfile(userId: string | undefined | null) {
  const [profile, setProfile] = useState<FirestoreUserProfile | null>(null);
  const [gamification, setGamification] = useState<UserGamification>(readGamification());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || userId.startsWith("guest_")) {
      setLoading(false);
      setGamification(readGamification());
      return;
    }

    setLoading(true);
    const docPath = `users/${userId}`;
    const userRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as FirestoreUserProfile;
          setProfile(data);

          if (data.gamification) {
            const rawGamification = data.gamification;
            const level = rawGamification.level || 1;
            const rank = getRankInfo(level);
            const totalExp = rawGamification.totalExp ?? rawGamification.exp ?? 0;
            const exp = rawGamification.exp ?? 0;
            const maxExp = rawGamification.maxExp || getMaxExpForLevel(level);

            const parsedGamification: UserGamification = {
              level,
              exp,
              maxExp,
              totalExp,
              rankTitle: rank.title,
              rankBadgeColor: rank.color,
              dailyStreak: rawGamification.dailyStreak || 0,
              lastCheckIn: rawGamification.lastCheckIn,
            };

            setGamification(parsedGamification);
            // Sync to local
            saveGamification(parsedGamification);
          }
        } else {
          // Document does not exist yet, fallback to local and trigger creation
          setGamification(readGamification());
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        try {
          handleFirestoreError(err, OperationType.GET, docPath);
        } catch {
          // Logged by handleFirestoreError
        }
      },
    );

    return () => unsubscribe();
  }, [userId]);

  return { profile, gamification, loading, error };
}

// Hook for real-time syncing user's Watchlist from Firestore
export function useFirestoreWatchlist(userId: string | undefined | null) {
  const [items, setItems] = useState<WatchlistItem[]>(readWatchlist());
  const [loading, setLoading] = useState(Boolean(userId && !userId.startsWith("guest_")));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || userId.startsWith("guest_")) {
      setItems(readWatchlist());
      setLoading(false);
      return;
    }

    const colPath = `users/${userId}/watchlist`;
    const colRef = collection(db, "users", userId, "watchlist");

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const firestoreItems: WatchlistItem[] = [];
        snapshot.forEach((d) => {
          firestoreItems.push(d.data() as WatchlistItem);
        });

        firestoreItems.sort(
          (a, b) => (b.updatedAt || b.addedAt || 0) - (a.updatedAt || a.addedAt || 0),
        );
        setItems(firestoreItems);
        // Sync to local storage
        localStorage.setItem("nonton-watchlist-v1", JSON.stringify(firestoreItems));
        window.dispatchEvent(new Event("watchlist-updated"));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        try {
          handleFirestoreError(err, OperationType.LIST, colPath);
        } catch {
          // Logged by handleFirestoreError
        }
      },
    );

    return () => unsubscribe();
  }, [userId]);

  return { items, loading, error, setItems };
}

// Hook for Auth state
export function useAuth() {
  const [user, setUser] = useState<User | LocalGuestUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getStoredGuest = (): LocalGuestUser | null => {
      if (typeof window === "undefined") return null;
      try {
        const item = localStorage.getItem("nonton-guest-user");
        return item ? (JSON.parse(item) as LocalGuestUser) : null;
      } catch {
        return null;
      }
    };

    // Handle Google redirect sign-in result (mobile/popup-blocked browsers)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("nonton-guest-user");
          }
          await persistUserDoc(result.user);
          setUser(result.user);
        }
      })
      .catch((err) => {
        console.warn("Redirect sign-in error:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("nonton-guest-user");
        }
        setUser(currentUser);
      } else {
        const guest = getStoredGuest();
        setUser(guest);
      }
      setLoading(false);
    });

    const handleGuestChange = () => {
      if (!auth.currentUser) {
        const guest = getStoredGuest();
        setUser(guest);
      }
    };
    window.addEventListener("guest-auth-changed", handleGuestChange);

    return () => {
      unsubscribe();
      window.removeEventListener("guest-auth-changed", handleGuestChange);
    };
  }, []);

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithGoogleRedirect,
    signInWithEmail,
    signUpWithEmail,
    loginAsGuest,
    resetPassword,
    signOutUser,
  };
}
