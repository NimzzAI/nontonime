const SW_PATH = "/sw.js";

function urlBase64ToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  return navigator.serviceWorker.register(SW_PATH);
}

export async function requestNotificationPermission() {
  if (!isPushSupported()) return "unsupported" as const;
  return Notification.requestPermission();
}

export async function subscribeToPush() {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidKey) return null;

  const registration = await registerServiceWorker();
  if (!registration) return null;

  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
  const subscription = await registration?.pushManager.getSubscription();
  await subscription?.unsubscribe();
}

export async function showLocalNotification(title: string, options?: NotificationOptions) {
  if (!isPushSupported() || Notification.permission !== "granted") return false;
  const registration = await registerServiceWorker();
  if (!registration) return false;
  await registration.showNotification(title, {
    icon: "/logo.svg",
    badge: "/logo.svg",
    ...options,
  });
  return true;
}
