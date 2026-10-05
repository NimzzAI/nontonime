interface Entry {
  value: unknown;
  expires: number;
}

const MAX_ENTRIES = 500;
const store = new Map<string, Entry>();
const inFlight = new Map<string, Promise<unknown>>();

function put(key: string, value: unknown, ttlMs: number) {
  store.delete(key);
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}

// Hasil dipakai ulang selama TTL, request kembar digabung, dan data lama dipakai kalau sumber gagal
export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) {
    store.delete(key);
    store.set(key, hit);
    return hit.value as T;
  }

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const run = (async (): Promise<T> => {
    try {
      const value = await loader();
      put(key, value, ttlMs);
      return value;
    } catch (error) {
      if (hit) {
        console.warn(`[cache] ${key} gagal diperbarui, memakai data lama`);
        return hit.value as T;
      }
      throw error;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, run);
  return run;
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} melewati batas ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
