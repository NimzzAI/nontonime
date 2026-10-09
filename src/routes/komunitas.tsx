import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Loader2, MessageCircle, Search, UserPlus, Users, X } from "lucide-react";
import { SectionTitle } from "@/components/anime/StateViews";
import { UserRow } from "@/components/social/UserRow";
import { LoginPrompt } from "@/components/social/LoginPrompt";
import {
  acceptFriendRequest,
  removeFriendRequest,
  searchProfiles,
  useFollowIds,
  useFriendIds,
  useIncomingFriendRequests,
  useSocialActor,
  type PublicProfile,
} from "@/lib/social";
import { cn } from "@/lib/utils";

const TABS = ["cari", "teman", "permintaan", "mengikuti", "pengikut"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  cari: "Cari",
  teman: "Teman",
  permintaan: "Permintaan",
  mengikuti: "Mengikuti",
  pengikut: "Pengikut",
};

export const Route = createFileRoute("/komunitas")({
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => {
    const raw = search["tab"];
    return { tab: TABS.includes(raw as Tab) ? (raw as Tab) : "cari" };
  },
  head: () => ({
    meta: [
      { title: "Komunitas : Nontonime" },
      {
        name: "description",
        content: "Cari pengguna, berteman, mengikuti, dan ngobrol di Nontonime.",
      },
    ],
  }),
  component: CommunityPage,
});

function EmptyBox({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
      {text}
    </p>
  );
}

function SearchTab() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const clean = term.trim();
    if (clean.replace(/^@/, "").length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        setResults(await searchProfiles(clean));
      } catch (err) {
        console.warn("Pencarian pengguna gagal:", err);
        setResults([]);
      } finally {
        setSearched(true);
        setBusy(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [term]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Cari berdasarkan username, misalnya naruto_fans"
          maxLength={25}
          className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {busy && (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {results.map((p) => (
        <UserRow key={p.uid} uid={p.uid} />
      ))}
      {searched && results.length === 0 && !busy && (
        <EmptyBox text="Tidak ada pengguna dengan username itu." />
      )}
      {!searched && <EmptyBox text="Ketik minimal 2 huruf username untuk mencari pengguna." />}
    </div>
  );
}

function IdList({ ids, empty }: { ids: string[]; empty: string }) {
  if (ids.length === 0) return <EmptyBox text={empty} />;
  return (
    <div className="space-y-2.5">
      {ids.map((uid) => (
        <UserRow
          key={uid}
          uid={uid}
          right={
            <Link
              to="/chat"
              search={{ with: uid }}
              aria-label="Kirim pesan"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-foreground hover:bg-secondary/70"
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
          }
        />
      ))}
    </div>
  );
}

function RequestsTab() {
  const actor = useSocialActor();
  const requests = useIncomingFriendRequests(actor?.uid ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!actor) return null;
  if (requests.length === 0) return <EmptyBox text="Belum ada permintaan pertemanan masuk." />;

  const run = async (id: string, task: () => Promise<void>) => {
    setBusyId(id);
    try {
      await task();
    } catch (err) {
      console.warn("Aksi permintaan gagal:", err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {requests.map((r) => (
        <UserRow
          key={r.id}
          uid={r.fromId}
          right={
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => run(r.id, () => acceptFriendRequest(actor, r.fromId))}
                className="inline-flex h-9 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-50 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                Terima
              </button>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => run(r.id, () => removeFriendRequest(r.fromId, actor.uid))}
                aria-label="Tolak"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary disabled:opacity-50 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          }
        />
      ))}
    </div>
  );
}

function CommunityPage() {
  const { tab } = Route.useSearch();
  const actor = useSocialActor();
  const uid = actor?.uid ?? null;
  const friends = useFriendIds(uid);
  const following = useFollowIds(uid, "following");
  const followers = useFollowIds(uid, "followers");
  const requests = useIncomingFriendRequests(uid);

  const counts: Record<Tab, number | null> = {
    cari: null,
    teman: friends.length,
    permintaan: requests.length,
    mengikuti: following.length,
    pengikut: followers.length,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Komunitas" icon={Users} />
        <Link
          to="/chat"
          search={{}}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary/70"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Pesan
        </Link>
      </div>

      <nav className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Tab komunitas">
        {TABS.map((t) => (
          <Link
            key={t}
            to="/komunitas"
            search={{ tab: t }}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors",
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "cari" ? <UserPlus className="h-3.5 w-3.5" /> : null}
            {TAB_LABEL[t]}
            {counts[t] ? (
              <span className="rounded-full bg-background/25 px-1.5 text-[10px]">{counts[t]}</span>
            ) : null}
          </Link>
        ))}
      </nav>

      {!actor ? (
        <LoginPrompt message="Masuk dulu untuk mencari teman, mengikuti pengguna, dan mengirim pesan." />
      ) : tab === "cari" ? (
        <SearchTab />
      ) : tab === "teman" ? (
        <IdList
          ids={friends}
          empty="Belum ada teman. Cari pengguna lalu kirim permintaan pertemanan."
        />
      ) : tab === "permintaan" ? (
        <RequestsTab />
      ) : tab === "mengikuti" ? (
        <IdList ids={following} empty="Kamu belum mengikuti siapa pun." />
      ) : (
        <IdList ids={followers} empty="Belum ada yang mengikuti kamu." />
      )}
    </div>
  );
}
