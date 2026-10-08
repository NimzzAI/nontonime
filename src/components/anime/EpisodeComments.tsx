import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  db,
  auth,
  useAuth,
  useFirestoreUserProfile,
  handleFirestoreError,
  OperationType,
  sanitizeForFirestore,
} from "@/lib/firebase";
import { addExp } from "@/lib/gamification";
import {
  MessageSquare,
  Send,
  Heart,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  Trophy,
  Users,
  Loader2,
  Sparkles,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EpisodeComment {
  id: string;
  episodeId: string;
  animeId?: string;
  animeTitle?: string;
  episodeTitle?: string;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  userLevel: number;
  userRankTitle: string;
  userClan?: string;
  content: string;
  isSpoiler: boolean;
  likesCount: number;
  likedBy: string[];
  createdAt: number;
}

interface EpisodeCommentsProps {
  episodeId: string;
  animeId?: string;
  animeTitle?: string;
  episodeTitle?: string;
  className?: string;
  onOpenAuth?: (tab: "login" | "register") => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} hari lalu`;
  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EpisodeComments({
  episodeId,
  animeId,
  animeTitle,
  episodeTitle,
  className,
  onOpenAuth,
}: EpisodeCommentsProps) {
  const { user } = useAuth();
  const { profile, gamification } = useFirestoreUserProfile(user?.uid);

  const [comments, setComments] = useState<EpisodeComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real-time Firestore subscription to this episode's comments
  useEffect(() => {
    if (!episodeId) return;

    setLoading(true);
    // Sanitize episodeId for path safety
    const safeEpId = encodeURIComponent(episodeId).replace(/%/g, "_");
    const commentsCol = collection(db, "episodes", safeEpId, "comments");

    const unsubscribe = onSnapshot(
      commentsCol,
      (snapshot) => {
        const list: EpisodeComment[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as EpisodeComment);
        });
        // Sort newest first
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setComments(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore comments listener error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [episodeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    if (!user) {
      if (onOpenAuth) {
        onOpenAuth("login");
      } else {
        setErrorMsg("Silakan masuk akun terlebih dahulu untuk berkomentar.");
      }
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const safeEpId = encodeURIComponent(episodeId).replace(/%/g, "_");
    const commentId = "cmt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
    const now = Date.now();

    const authorDisplayName =
      profile?.displayName || user.displayName || user.email?.split("@")[0] || "Wibu Nontonime";
    const authorUsername =
      profile?.username ||
      (user.displayName ? user.displayName.toLowerCase().replace(/[^a-z0-9_]/g, "") : "wibu");
    const authorAvatar = profile?.avatarUrl || profile?.photoURL || user.photoURL || "";

    const newComment: EpisodeComment = {
      id: commentId,
      episodeId,
      animeId: animeId || "",
      animeTitle: animeTitle || "",
      episodeTitle: episodeTitle || "",
      userId: user.uid,
      displayName: authorDisplayName,
      username: authorUsername,
      avatarUrl: authorAvatar,
      userLevel: gamification.level || 1,
      userRankTitle: gamification.rankTitle || "Penonton Pemula",
      userClan: profile?.clan || "",
      content: text,
      isSpoiler,
      likesCount: 0,
      likedBy: [],
      createdAt: now,
    };

    try {
      const commentDocRef = doc(db, "episodes", safeEpId, "comments", commentId);
      await setDoc(commentDocRef, sanitizeForFirestore(newComment));

      // Also persist to global comments index for easy reference
      try {
        const globalRef = doc(db, "comments", commentId);
        await setDoc(globalRef, sanitizeForFirestore(newComment));
      } catch {
        // non-blocking
      }

      addExp(15, "Menulis Komentar Episode (+15 XP) 💬");
      setCommentText("");
      setIsSpoiler(false);
    } catch (err: unknown) {
      console.error("Failed to post comment:", err);
      const msg = err instanceof Error ? err.message : "Gagal mengirim komentar.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (comment: EpisodeComment) => {
    if (!user) {
      onOpenAuth?.("login");
      return;
    }

    const safeEpId = encodeURIComponent(episodeId).replace(/%/g, "_");
    const isLiked = comment.likedBy?.includes(user.uid);
    const updatedLikedBy = isLiked
      ? (comment.likedBy || []).filter((uid) => uid !== user.uid)
      : [...(comment.likedBy || []), user.uid];
    const updatedLikesCount = updatedLikedBy.length;

    try {
      const commentDocRef = doc(db, "episodes", safeEpId, "comments", comment.id);
      await setDoc(
        commentDocRef,
        sanitizeForFirestore({
          likedBy: updatedLikedBy,
          likesCount: updatedLikesCount,
        }),
        { merge: true },
      );
    } catch (err) {
      console.warn("Failed to toggle like on comment:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    if (!window.confirm("Hapus komentar ini?")) return;

    const safeEpId = encodeURIComponent(episodeId).replace(/%/g, "_");
    try {
      const commentDocRef = doc(db, "episodes", safeEpId, "comments", commentId);
      await deleteDoc(commentDocRef);

      try {
        const globalRef = doc(db, "comments", commentId);
        await deleteDoc(globalRef);
      } catch {
        // non-blocking
      }
    } catch (err) {
      console.warn("Failed to delete comment:", err);
    }
  };

  const toggleRevealSpoiler = (commentId: string) => {
    setRevealedSpoilers((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-4 sm:p-6 space-y-6 shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-black text-foreground">
                Diskusi & Komentar Episode
              </h3>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-muted-foreground border border-border/70">
                {comments.length}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tersambung ke Cloud Firestore • Profil & Clan otomatis tersemat
            </p>
          </div>
        </div>
      </div>

      {/* Input Box */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
              {profile?.avatarUrl || user.photoURL ? (
                <img
                  src={profile?.avatarUrl || user.photoURL || ""}
                  alt="My avatar"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs font-bold text-foreground">
                  {(user.displayName || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-foreground">
                {profile?.displayName || user.displayName || "Wibu Nontonime"}
              </span>
              <span className="rounded-md bg-primary/15 text-primary px-1.5 py-0.2 text-[10px] font-bold">
                Lv. {gamification.level}
              </span>
              {profile?.clan && (
                <span className="rounded-md bg-secondary text-muted-foreground px-1.5 py-0.2 text-[10px] font-semibold">
                  Clan: {profile.clan}
                </span>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Tulis pendapatmu tentang episode ini... (Gunakan spoiler tag jika membocorkan cerita)"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none transition-all"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={(e) => setIsSpoiler(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Tandai sebagai Spoiler
              </span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{commentText.length}/500</span>
              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Kirim Komentar (+15 XP)</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-border/80 bg-secondary/30 p-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-foreground">Masuk untuk Ikut Berdiskusi</p>
              <p className="text-muted-foreground">
                Tampilkan nama, avatar, level, dan clan anime kamu di kolom komentar!
              </p>
            </div>
          </div>
          {onOpenAuth && (
            <button
              type="button"
              onClick={() => onOpenAuth("login")}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer shrink-0 shadow-xs"
            >
              Masuk / Daftar
            </button>
          )}
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3.5 rounded-2xl bg-secondary/30">
                <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm font-bold text-foreground">Belum Ada Komentar</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Jadilah orang pertama yang mengomentari episode ini dan bagikan pendapatmu!
            </p>
          </div>
        ) : (
          comments.map((cmt) => {
            const isAuthor = user?.uid === cmt.userId;
            const isLiked = user && cmt.likedBy?.includes(user.uid);
            const isSpoilerRevealed = revealedSpoilers[cmt.id];

            return (
              <div
                key={cmt.id}
                className="group relative rounded-2xl border border-border/70 bg-card p-4 transition-all hover:border-border hover:bg-secondary/15 space-y-2.5 shadow-2xs"
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden border border-border/80 bg-muted flex items-center justify-center">
                      {cmt.avatarUrl ? (
                        <img
                          src={cmt.avatarUrl}
                          alt={cmt.displayName}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xs font-bold text-foreground">
                          {cmt.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-display text-xs sm:text-sm font-bold text-foreground">
                          {cmt.displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          @{cmt.username || "wibu"}
                        </span>
                        <span className="rounded bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.2 text-[9px] font-bold">
                          Lv.{cmt.userLevel || 1}
                        </span>
                        {cmt.userClan && (
                          <span className="rounded bg-secondary text-muted-foreground border border-border/70 px-1.5 py-0.2 text-[9px] font-semibold flex items-center gap-0.5">
                            <Users className="h-2.5 w-2.5 text-primary" />
                            {cmt.userClan}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(cmt.createdAt)}
                      </span>
                    </div>
                  </div>

                  {isAuthor && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(cmt.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive cursor-pointer rounded-lg hover:bg-destructive/10"
                      title="Hapus komentar saya"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Comment Content */}
                {cmt.isSpoiler && !isSpoilerRevealed ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Komentar ini mengandung spoiler jalan cerita.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRevealSpoiler(cmt.id)}
                      className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 transition cursor-pointer"
                    >
                      Buka Spoiler
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {cmt.isSpoiler && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 text-amber-500 px-1.5 py-0.2 text-[9px] font-bold mb-1">
                        <AlertTriangle className="h-2.5 w-2.5" /> Spoiler Terbuka
                      </span>
                    )}
                    <p className="text-xs sm:text-sm text-card-foreground leading-relaxed whitespace-pre-line">
                      {cmt.content}
                    </p>
                  </div>
                )}

                {/* Comment Footer (Like Button) */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(cmt)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                      isLiked
                        ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
                    <span>{cmt.likesCount || 0}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
