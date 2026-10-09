import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import {
  db,
  isGuestUser,
  sanitizeForFirestore,
  useAuth,
  useFirestoreUserProfile,
} from "@/lib/firebase";
import { addExp } from "@/lib/gamification";
import { effectiveBorderId, getBorder } from "@/lib/profile-style";
import { displayLevel, displayRank, resolveRole } from "@/lib/roles";
import { usePublicProfiles, type PublicProfile } from "@/lib/social";
import { pushSocialNotification } from "@/lib/social-notifications";
import { AvatarFrame } from "@/components/social/AvatarFrame";
import { ClanChip, LevelBadge, OwnerBadge } from "@/components/social/UserBadges";
import {
  CornerDownRight,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  LogIn,
  MessageSquare,
  Send,
  Trash2,
  Trophy,
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
  userClanTag?: string;
  userClanId?: string;
  userRole?: "owner" | "member";
  userBannerUrl?: string;
  userBorder?: string;
  content: string;
  isSpoiler: boolean;
  likesCount: number;
  likedBy: string[];
  createdAt: number;
  /** Diisi bila komentar ini adalah balasan. Nilainya id komentar induk (tingkat atas). */
  parentId?: string;
  replyToUserId?: string;
  replyToName?: string;
  deleted?: boolean;
}

interface EpisodeCommentsProps {
  episodeId: string;
  animeId?: string;
  animeTitle?: string;
  episodeTitle?: string;
  className?: string;
  onOpenAuth?: (tab: "login" | "register") => void;
}

const MAX_LENGTH = 500;
const POST_COOLDOWN_MS = 8000;

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

/** Profil publik yang terbaru menang atas salinan di dokumen komentar yang bisa basi. */
function resolveIdentity(c: EpisodeComment, p: PublicProfile | undefined) {
  const role = p?.role ?? c.userRole ?? "member";
  const level = displayLevel(role, p?.level ?? c.userLevel);
  return {
    role,
    level,
    rank: displayRank(role, p?.rankTitle ?? c.userRankTitle),
    name: p?.displayName || c.displayName,
    avatar: p?.avatarUrl || c.avatarUrl || "",
    banner: p?.bannerUrl || c.userBannerUrl || "",
    border: effectiveBorderId(p?.borderStyle ?? c.userBorder, level, role),
    clanTag: p?.clanTag ?? c.userClanTag ?? "",
    clanName: p?.clan ?? c.userClan ?? "",
  };
}

interface ComposerProps {
  placeholder: string;
  submitting: boolean;
  onSubmit: (text: string, spoiler: boolean) => Promise<boolean>;
  allowSpoiler?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  rows?: number;
}

function Composer({
  placeholder,
  submitting,
  onSubmit,
  allowSpoiler = true,
  autoFocus,
  onCancel,
  rows = 2,
}: ComposerProps) {
  const [text, setText] = useState("");
  const [spoiler, setSpoiler] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    const ok = await onSubmit(text, spoiler);
    if (ok) {
      setText("");
      setSpoiler(false);
    }
  };

  return (
    <form onSubmit={handle} className="space-y-2">
      <textarea
        value={text}
        autoFocus={autoFocus}
        rows={rows}
        maxLength={MAX_LENGTH}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {allowSpoiler && (
            <label className="flex cursor-pointer select-none items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <input
                type="checkbox"
                checked={spoiler}
                onChange={(e) => setSpoiler(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Spoiler
            </label>
          )}
          <span className="text-[10px] text-muted-foreground">
            {text.length}/{MAX_LENGTH}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-50 cursor-pointer"
          >
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Kirim
          </button>
        </div>
      </div>
    </form>
  );
}

interface CardProps {
  comment: EpisodeComment;
  profile: PublicProfile | undefined;
  isReply: boolean;
  meUid: string | null;
  isOwnerViewer: boolean;
  revealed: boolean;
  onReveal: () => void;
  onLike: () => void;
  onReply: () => void;
  onDelete: () => void;
}

function CommentCard({
  comment,
  profile,
  isReply,
  meUid,
  isOwnerViewer,
  revealed,
  onReveal,
  onLike,
  onReply,
  onDelete,
}: CardProps) {
  const idn = resolveIdentity(comment, profile);
  const border = getBorder(idn.border);
  const hasBorder = border.id !== "none";
  const isOwnerAuthor = idn.role === "owner";
  const liked = Boolean(meUid && comment.likedBy?.includes(meUid));
  const canDelete = Boolean(meUid) && (comment.userId === meUid || isOwnerViewer);
  const hideContent = comment.isSpoiler && !revealed;
  const showBanner = !isReply && (idn.banner || isOwnerAuthor);

  const frameStyle = {
    "--nt-frame-w": hasBorder ? "2px" : "1px",
    "--nt-frame-r": isReply ? "14px" : "18px",
  } as React.CSSProperties;

  if (comment.deleted) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-[11px] italic text-muted-foreground">
        Komentar ini telah dihapus.
      </div>
    );
  }

  return (
    <div className={cn("nt-frame", border.className)} style={frameStyle}>
      <div className="nt-frame-inner">
        {showBanner && (
          <div
            className={cn(
              "relative h-14 bg-cover bg-center sm:h-16",
              !idn.banner && "bg-gradient-to-r from-amber-500/50 via-rose-500/40 to-violet-600/50",
            )}
            style={idn.banner ? { backgroundImage: `url("${idn.banner}")` } : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
          </div>
        )}

        <div className={cn("flex gap-3 p-3 sm:p-3.5", showBanner && "-mt-7 relative")}>
          <Link to="/u/$userId" params={{ userId: comment.userId }} className="shrink-0">
            <AvatarFrame src={idn.avatar} name={idn.name} borderId={idn.border} size={isReply ? 34 : 46} />
          </Link>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                to="/u/$userId"
                params={{ userId: comment.userId }}
                className={cn(
                  "truncate text-xs font-bold hover:underline sm:text-sm",
                  isOwnerAuthor ? "nt-owner-name" : "text-foreground",
                )}
              >
                {idn.name}
              </Link>
              {isOwnerAuthor && <OwnerBadge />}
              <LevelBadge role={idn.role} level={idn.level} />
              <ClanChip tag={idn.clanTag} name={idn.clanName} />
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            {!isReply && (
              <p className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                <Trophy className="h-3 w-3 text-primary" />
                {idn.rank}
              </p>
            )}

            {comment.replyToName && (
              <p className="flex items-center gap-1 text-[11px] text-primary">
                <CornerDownRight className="h-3 w-3" />
                Membalas {comment.replyToName}
              </p>
            )}

            {hideContent ? (
              <button
                type="button"
                onClick={onReveal}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground cursor-pointer"
              >
                <EyeOff className="h-3 w-3" />
                Komentar ini mengandung spoiler, ketuk untuk membuka
              </button>
            ) : (
              <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground sm:text-sm">
                {comment.content}
              </p>
            )}

            <div className="flex items-center gap-3 pt-0.5 text-[11px] font-semibold text-muted-foreground">
              <button
                type="button"
                onClick={onLike}
                className={cn(
                  "inline-flex items-center gap-1 transition-colors cursor-pointer",
                  liked ? "text-rose-500" : "hover:text-foreground",
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
                {comment.likesCount || 0}
              </button>
              <button
                type="button"
                onClick={onReply}
                className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Balas
              </button>
              {comment.isSpoiler && revealed && (
                <button
                  type="button"
                  onClick={onReveal}
                  className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Sembunyikan
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="ml-auto inline-flex items-center gap-1 hover:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
  const router = useRouter();
  const signedIn = Boolean(user && !isGuestUser(user));
  const meUid = signedIn && user ? user.uid : null;
  const { profile, gamification } = useFirestoreUserProfile(user?.uid);

  const [comments, setComments] = useState<EpisodeComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<EpisodeComment | null>(null);
  const lastPostAt = useRef(0);

  const safeEpId = useMemo(() => encodeURIComponent(episodeId).replace(/%/g, "_"), [episodeId]);

  useEffect(() => {
    if (!episodeId) return;
    setLoading(true);
    const q = query(
      collection(db, "episodes", safeEpId, "comments"),
      orderBy("createdAt", "desc"),
      limit(300),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setComments(snapshot.docs.map((d) => d.data() as EpisodeComment));
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore comments listener error:", err);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [episodeId, safeEpId]);

  const authorIds = useMemo(
    () => Array.from(new Set(comments.map((c) => c.userId).filter(Boolean))).sort(),
    [comments],
  );
  const profiles = usePublicProfiles(authorIds);
  const myProfiles = usePublicProfiles(meUid ? [meUid] : []);
  const myPublic = meUid ? myProfiles[meUid] : undefined;

  const { roots, repliesByParent } = useMemo(() => {
    const rootList: EpisodeComment[] = [];
    const map = new Map<string, EpisodeComment[]>();
    for (const c of comments) {
      if (c.parentId) {
        const list = map.get(c.parentId) ?? [];
        list.push(c);
        map.set(c.parentId, list);
      } else {
        rootList.push(c);
      }
    }
    rootList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    for (const list of map.values()) list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    return { roots: rootList, repliesByParent: map };
  }, [comments]);

  const isOwnerViewer =
    signedIn && user && !isGuestUser(user)
      ? resolveRole((user as { email?: string | null }).email, (user as { emailVerified?: boolean }).emailVerified) === "owner"
      : false;

  const post = async (
    text: string,
    spoiler: boolean,
    parent: EpisodeComment | null,
  ): Promise<boolean> => {
    const content = text.trim().slice(0, MAX_LENGTH);
    if (!content) return false;
    if (!signedIn || !user) {
      if (onOpenAuth) onOpenAuth("login");
      else setErrorMsg("Silakan masuk akun terlebih dahulu untuk berkomentar.");
      return false;
    }
    if (Date.now() - lastPostAt.current < POST_COOLDOWN_MS) {
      setErrorMsg("Tunggu beberapa detik sebelum mengirim komentar lagi.");
      return false;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const now = Date.now();
    const commentId = `cmt_${now}_${Math.random().toString(36).slice(2, 7)}`;
    const authorName =
      myPublic?.displayName ||
      profile?.displayName ||
      user.displayName ||
      user.email?.split("@")[0] ||
      "Wibu Nontonime";
    const role = resolveRole(
      (user as { email?: string | null }).email,
      (user as { emailVerified?: boolean }).emailVerified,
    );

    const rootId = parent ? (parent.parentId ?? parent.id) : null;
    const newComment: EpisodeComment = {
      id: commentId,
      episodeId,
      animeId: animeId || "",
      animeTitle: animeTitle || "",
      episodeTitle: episodeTitle || "",
      userId: user.uid,
      displayName: authorName,
      username:
        profile?.username ||
        (user.displayName ? user.displayName.toLowerCase().replace(/[^a-z0-9_]/g, "") : "wibu"),
      avatarUrl: myPublic?.avatarUrl || profile?.avatarUrl || profile?.photoURL || user.photoURL || "",
      userLevel: gamification.level || 1,
      userRankTitle: gamification.rankTitle || "Penonton Pemula",
      userClan: profile?.clan || "",
      userClanTag: profile?.clanTag || "",
      userClanId: profile?.clanId || "",
      userRole: role,
      userBannerUrl: myPublic?.bannerUrl || profile?.bannerUrl || "",
      userBorder: myPublic?.borderStyle || "none",
      content,
      isSpoiler: spoiler,
      likesCount: 0,
      likedBy: [],
      createdAt: now,
      ...(rootId && parent
        ? { parentId: rootId, replyToUserId: parent.userId, replyToName: parent.displayName }
        : {}),
    };

    try {
      await setDoc(
        doc(db, "episodes", safeEpId, "comments", commentId),
        sanitizeForFirestore(newComment),
      );
      lastPostAt.current = Date.now();
      addExp(parent ? 5 : 15, parent ? "Membalas Komentar (+5 XP) 💬" : "Menulis Komentar Episode (+15 XP) 💬");

      if (parent && parent.userId !== user.uid) {
        void pushSocialNotification(parent.userId, {
          type: "reply",
          fromId: user.uid,
          fromName: authorName,
          fromAvatar: newComment.avatarUrl ?? "",
          text: `${authorName} membalas komentarmu: "${content.length > 70 ? `${content.slice(0, 70)}...` : content}"`,
          link: `/watch/${encodeURIComponent(episodeId)}`,
        });
      }
      if (parent) setReplyTo(null);
      return true;
    } catch (err: unknown) {
      console.error("Failed to post comment:", err);
      setErrorMsg(err instanceof Error ? err.message : "Gagal mengirim komentar.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLike = async (c: EpisodeComment) => {
    if (!signedIn || !meUid) {
      onOpenAuth?.("login");
      return;
    }
    const current = c.likedBy ?? [];
    const next = current.includes(meUid) ? current.filter((u) => u !== meUid) : [...current, meUid];
    try {
      await setDoc(
        doc(db, "episodes", safeEpId, "comments", c.id),
        { likedBy: next, likesCount: next.length },
        { merge: true },
      );
    } catch (err) {
      console.warn("Failed to toggle like on comment:", err);
    }
  };

  const removeComment = async (c: EpisodeComment) => {
    if (!signedIn) return;
    if (!window.confirm("Hapus komentar ini?")) return;
    const hasReplies = (repliesByParent.get(c.id)?.length ?? 0) > 0;
    try {
      const ref = doc(db, "episodes", safeEpId, "comments", c.id);
      if (hasReplies && !c.parentId) {
        // Balasan orang lain tidak boleh ikut terhapus, jadi komentar induk dikosongkan saja.
        await setDoc(
          ref,
          { deleted: true, content: "", isSpoiler: false, likedBy: [], likesCount: 0 },
          { merge: true },
        );
      } else {
        await deleteDoc(ref);
      }
    } catch (err) {
      console.warn("Failed to delete comment:", err);
      setErrorMsg("Gagal menghapus komentar.");
    }
  };

  const openProfileHint = () => router.navigate({ to: "/profil" });

  return (
    <section className={cn("space-y-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold text-foreground sm:text-base">
          <MessageSquare className="h-4 w-4 text-primary" />
          Diskusi Episode
          <span className="text-xs font-semibold text-muted-foreground">({comments.filter((c) => !c.deleted).length})</span>
        </h3>
      </div>

      {signedIn && user ? (
        <div className="flex gap-3">
          <AvatarFrame
            src={myPublic?.avatarUrl || profile?.avatarUrl || user.photoURL}
            name={myPublic?.displayName || profile?.displayName || user.displayName || "Aku"}
            borderId={effectiveBorderId(
              myPublic?.borderStyle,
              displayLevel(myPublic?.role, myPublic?.level),
              myPublic?.role,
            )}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <Composer
              placeholder="Tulis komentar tentang episode ini..."
              submitting={isSubmitting && !replyTo}
              onSubmit={(text, spoiler) => post(text, spoiler, null)}
            />
            <button
              type="button"
              onClick={openProfileHint}
              className="mt-1 text-[10px] text-muted-foreground underline-offset-2 hover:underline cursor-pointer"
            >
              Atur banner, avatar, dan border komentarmu di Profil
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onOpenAuth?.("login")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-4 text-xs font-bold text-muted-foreground transition hover:bg-secondary/60 cursor-pointer"
        >
          <LogIn className="h-4 w-4" />
          Masuk dengan akun untuk ikut berdiskusi
        </button>
      )}

      {errorMsg && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errorMsg}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : roots.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          Belum ada komentar. Jadilah yang pertama membuka diskusi.
        </p>
      ) : (
        <div className="space-y-4">
          {roots.map((root) => {
            const replies = repliesByParent.get(root.id) ?? [];
            return (
              <div key={root.id} className="space-y-2">
                <CommentCard
                  comment={root}
                  profile={profiles[root.userId]}
                  isReply={false}
                  meUid={meUid}
                  isOwnerViewer={isOwnerViewer}
                  revealed={Boolean(revealed[root.id])}
                  onReveal={() => setRevealed((p) => ({ ...p, [root.id]: !p[root.id] }))}
                  onLike={() => void toggleLike(root)}
                  onReply={() => (signedIn ? setReplyTo(root) : onOpenAuth?.("login"))}
                  onDelete={() => void removeComment(root)}
                />

                {(replies.length > 0 || replyTo?.id === root.id) && (
                  <div className="ml-4 space-y-2 border-l-2 border-border/60 pl-3 sm:ml-8">
                    {replies.map((reply) => (
                      <div key={reply.id} className="space-y-2">
                        <CommentCard
                          comment={reply}
                          profile={profiles[reply.userId]}
                          isReply
                          meUid={meUid}
                          isOwnerViewer={isOwnerViewer}
                          revealed={Boolean(revealed[reply.id])}
                          onReveal={() => setRevealed((p) => ({ ...p, [reply.id]: !p[reply.id] }))}
                          onLike={() => void toggleLike(reply)}
                          onReply={() => (signedIn ? setReplyTo(reply) : onOpenAuth?.("login"))}
                          onDelete={() => void removeComment(reply)}
                        />
                        {replyTo?.id === reply.id && (
                          <ReplyBox
                            target={reply}
                            submitting={isSubmitting}
                            onSubmit={(text, spoiler) => post(text, spoiler, reply)}
                            onCancel={() => setReplyTo(null)}
                          />
                        )}
                      </div>
                    ))}
                    {replyTo?.id === root.id && (
                      <ReplyBox
                        target={root}
                        submitting={isSubmitting}
                        onSubmit={(text, spoiler) => post(text, spoiler, root)}
                        onCancel={() => setReplyTo(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ReplyBox({
  target,
  submitting,
  onSubmit,
  onCancel,
}: {
  target: EpisodeComment;
  submitting: boolean;
  onSubmit: (text: string, spoiler: boolean) => Promise<boolean>;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
      <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold text-primary">
        <CornerDownRight className="h-3 w-3" />
        Membalas {target.displayName}
      </p>
      <Composer
        autoFocus
        rows={2}
        placeholder="Tulis balasan..."
        submitting={submitting}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </div>
  );
}
