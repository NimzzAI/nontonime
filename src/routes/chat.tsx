import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MessageCircle, Send } from "lucide-react";
import { AvatarFrame } from "@/components/social/AvatarFrame";
import { LoginPrompt } from "@/components/social/LoginPrompt";
import { ClanChip, OwnerBadge } from "@/components/social/UserBadges";
import {
  MAX_CHAT_LENGTH,
  chatIdFor,
  isChatUnread,
  markChatRead,
  otherUserId,
  sendChatMessage,
  useChats,
  useMessages,
} from "@/lib/chat";
import { markNotificationRead } from "@/lib/social-notifications";
import { effectiveBorderId } from "@/lib/profile-style";
import { displayLevel } from "@/lib/roles";
import { usePublicProfiles, useSocialActor, type SocialActor } from "@/lib/social";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  validateSearch: (search: Record<string, unknown>): { with?: string } => {
    const raw = search["with"];
    return typeof raw === "string" && raw ? { with: raw } : {};
  },
  head: () => ({
    meta: [
      { title: "Pesan : Nontonime" },
      { name: "description", content: "Ngobrol langsung dengan sesama pengguna Nontonime." },
    ],
  }),
  component: ChatPage,
});

function formatTime(ts: number): string {
  const d = new Date(ts);
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function ChatListItem({
  meUid,
  otherUid,
  preview,
  unread,
  active,
  updatedAt,
}: {
  meUid: string;
  otherUid: string;
  preview: string;
  unread: boolean;
  active: boolean;
  updatedAt: number;
}) {
  const profiles = usePublicProfiles([otherUid]);
  const p = profiles[otherUid];
  const border = effectiveBorderId(p?.borderStyle, displayLevel(p?.role, p?.level), p?.role);
  return (
    <Link
      to="/chat"
      search={{ with: otherUid }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
        active ? "border-primary/50 bg-primary/5" : "border-border/70 bg-card hover:bg-secondary/40",
      )}
    >
      <AvatarFrame src={p?.avatarUrl} name={p?.displayName ?? "?"} borderId={border} size={42} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold text-foreground">{p?.displayName ?? "Pengguna"}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(updatedAt)}</span>
        </div>
        <p className={cn("truncate text-xs", unread ? "font-semibold text-foreground" : "text-muted-foreground")}>
          {preview}
        </p>
      </div>
      {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
      <span className="sr-only">{meUid}</span>
    </Link>
  );
}

function Thread({ me, otherUid }: { me: SocialActor; otherUid: string }) {
  const chatId = chatIdFor(me.uid, otherUid);
  const { messages, loading } = useMessages(chatId);
  const profiles = usePublicProfiles([otherUid]);
  const other = profiles[otherUid];
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    void markChatRead(chatId, me.uid);
    void markNotificationRead(me.uid, `chat_${otherUid}`);
  }, [chatId, me.uid, otherUid, messages.length]);

  const border = effectiveBorderId(other?.borderStyle, displayLevel(other?.role, other?.level), other?.role);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendChatMessage(me, otherUid, value);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pesan gagal dikirim.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[70vh] min-h-[420px] flex-col overflow-hidden rounded-3xl border border-border/80 bg-card">
      <div className="flex items-center gap-3 border-b border-border/70 p-3">
        <Link
          to="/chat"
          search={{}}
          aria-label="Kembali ke daftar pesan"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link to="/u/$userId" params={{ userId: otherUid }} className="flex min-w-0 items-center gap-3">
          <AvatarFrame src={other?.avatarUrl} name={other?.displayName ?? "?"} borderId={border} size={38} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-bold text-foreground">
                {other?.displayName ?? "Pengguna"}
              </span>
              {other?.role === "owner" && <OwnerBadge />}
            </div>
            <ClanChip tag={other?.clanTag} />
          </div>
        </Link>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            Belum ada pesan. Sapa dulu supaya obrolan dimulai.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === me.uid;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    mine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-secondary text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="space-y-1.5 border-t border-border/70 p-3">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={text}
            maxLength={MAX_CHAT_LENGTH}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(e);
              }
            }}
            placeholder="Tulis pesan..."
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            aria-label="Kirim"
            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-50 cursor-pointer"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

function ChatPage() {
  const { with: activeUid } = Route.useSearch();
  const me = useSocialActor();
  const { chats, loading } = useChats(me?.uid ?? null);

  if (!me) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <LoginPrompt message="Masuk dulu untuk mengirim pesan ke sesama pengguna Nontonime." />
      </div>
    );
  }

  const list = (
    <div className="space-y-2">
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : chats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
          <MessageCircle className="mx-auto mb-2 h-6 w-6" />
          Belum ada percakapan. Buka profil seseorang lalu tekan Pesan, atau cari teman di Komunitas.
          <div className="mt-3">
            <Link
              to="/komunitas"
              search={{ tab: "cari" }}
              className="inline-flex rounded-xl bg-primary px-3 py-2 font-bold text-primary-foreground"
            >
              Cari pengguna
            </Link>
          </div>
        </div>
      ) : (
        chats.map((c) => {
          const other = otherUserId(c, me.uid);
          return (
            <ChatListItem
              key={c.id}
              meUid={me.uid}
              otherUid={other}
              preview={c.lastSenderId === me.uid ? `Kamu: ${c.lastMessage}` : c.lastMessage}
              unread={isChatUnread(c, me.uid)}
              active={other === activeUid}
              updatedAt={c.updatedAt}
            />
          );
        })
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <aside className={cn(activeUid ? "hidden md:block" : "block")}>
          <h1 className="mb-3 font-display text-lg font-black text-foreground">Pesan</h1>
          {list}
        </aside>
        <section className={cn(activeUid ? "block" : "hidden md:block")}>
          {activeUid ? (
            <Thread key={activeUid} me={me} otherUid={activeUid} />
          ) : (
            <div className="flex h-[70vh] items-center justify-center rounded-3xl border border-dashed border-border/80 text-sm text-muted-foreground">
              Pilih percakapan untuk mulai ngobrol.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
