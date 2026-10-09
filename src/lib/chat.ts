import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "./firebase";
import { pairId, type SocialActor } from "./social";
import { pushSocialNotification } from "./social-notifications";

export interface ChatDoc {
  id: string;
  users: [string, string];
  lastMessage: string;
  lastSenderId: string;
  updatedAt: number;
  lastRead?: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export const MAX_CHAT_LENGTH = 1000;

export const chatIdFor = pairId;

export function otherUserId(chat: ChatDoc, meUid: string): string {
  return chat.users.find((u) => u !== meUid) ?? chat.users[0];
}

export function isChatUnread(chat: ChatDoc, meUid: string): boolean {
  if (!chat.lastMessage || chat.lastSenderId === meUid) return false;
  return chat.updatedAt > (chat.lastRead?.[meUid] ?? 0);
}

export function useChats(uid: string | null) {
  const [chats, setChats] = useState<ChatDoc[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid || uid.startsWith("guest_")) {
      setChats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Tanpa orderBy supaya tidak butuh indeks komposit, urutan dibuat di klien.
    const unsub = onSnapshot(
      query(collection(db, "chats"), where("users", "array-contains", uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as ChatDoc), id: d.id }));
        list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setChats(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Listener chat gagal:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [uid]);

  const unreadCount = useMemo(
    () => (uid ? chats.filter((c) => isChatUnread(c, uid)).length : 0),
    [chats, uid],
  );

  return { chats, loading, unreadCount };
}

export function useMessages(chatId: string | null, max = 100) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(Boolean(chatId));

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "desc"), limit(max)),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as ChatMessage), id: d.id }));
        list.reverse();
        setMessages(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Listener pesan gagal:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [chatId, max]);

  return { messages, loading };
}

export async function sendChatMessage(
  actor: SocialActor,
  otherUid: string,
  rawText: string,
): Promise<void> {
  const text = rawText.trim().slice(0, MAX_CHAT_LENGTH);
  if (!text) return;
  if (!actor.uid || actor.uid.startsWith("guest_")) throw new Error("Masuk dengan akun dulu.");
  if (actor.uid === otherUid) throw new Error("Tidak bisa mengirim pesan ke diri sendiri.");

  const id = chatIdFor(actor.uid, otherUid);
  const users = [actor.uid, otherUid].sort() as [string, string];
  const now = Date.now();
  const messageId = `m_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  const batch = writeBatch(db);
  batch.set(
    doc(db, "chats", id),
    {
      users,
      lastMessage: text.slice(0, 120),
      lastSenderId: actor.uid,
      updatedAt: now,
      lastRead: { [actor.uid]: now },
    },
    { merge: true },
  );
  batch.set(doc(db, "chats", id, "messages", messageId), {
    senderId: actor.uid,
    text,
    createdAt: now,
  });
  await batch.commit();

  await pushSocialNotification(otherUid, {
    id: `chat_${actor.uid}`,
    type: "chat",
    fromId: actor.uid,
    fromName: actor.displayName,
    fromAvatar: actor.avatarUrl,
    text: text.length > 90 ? `${text.slice(0, 90)}...` : text,
    link: `/chat?with=${actor.uid}`,
  });
}

export async function markChatRead(chatId: string, uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, "chats", chatId), { [`lastRead.${uid}`]: Date.now() });
  } catch {
    // chat belum ada atau tidak ada izin, tidak kritis
  }
}
