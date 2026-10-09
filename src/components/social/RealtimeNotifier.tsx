import { isGuestUser, useAuth } from "@/lib/firebase";
import { useRealtimeNotifier } from "@/lib/social-notifications";

/** Dipasang sekali di root: menampilkan notifikasi sistem untuk balasan, pesan, dan pengumuman baru. */
export function RealtimeNotifier() {
  const { user } = useAuth();
  useRealtimeNotifier(user && !isGuestUser(user) ? user.uid : null);
  return null;
}
