/**
 * Advanced Segmented Range Download Manager & IndexedDB Offline Storage.
 *
 * Capabilities:
 * - RFC 7233 HTTP Range Requests for segmented chunks (e.g. 2MB - 4MB chunks)
 * - Persistent storage of offline anime episodes in browser IndexedDB
 * - Pausable and Resumable downloads (saves completed chunks in IndexedDB)
 * - Real-time speed (MB/s), ETA, and chunk progress calculations
 * - Offline playback support with Blob URLs
 * - Storage quota estimation and cleanup
 */

export interface OfflineEpisode {
  id: string; // e.g. "episodeId_quality"
  episodeId: string;
  animeId?: string;
  animeTitle: string;
  episodeTitle: string;
  episodeNumber: number;
  poster: string;
  quality: string;
  sizeBytes: number;
  mimeType: string;
  blob: Blob;
  downloadedAt: number;
}

export interface DownloadTask {
  id: string;
  episodeId: string;
  animeId?: string;
  animeTitle: string;
  episodeTitle: string;
  episodeNumber: number;
  poster: string;
  quality: string;
  sourceUrl: string;
  totalBytes: number;
  downloadedBytes: number;
  chunksCount: number;
  completedChunks: number;
  status: "idle" | "probing" | "downloading" | "paused" | "completed" | "error";
  errorMessage?: string;
  speedBps: number;
  etaSec: number;
  startedAt: number;
}

export interface StorageEstimateInfo {
  usageBytes: number;
  quotaBytes: number;
  usagePercent: number;
  offlineEpisodesCount: number;
}

const DB_NAME = "nontonime-downloads-v1";
const STORE_OFFLINE = "offline_episodes";
const STORE_CHUNKS = "task_chunks";
const STORE_TASKS = "active_tasks";
const DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB per Range segment

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in browser"));
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: Offline Episodes (Completed blobs with metadata)
        if (!db.objectStoreNames.contains(STORE_OFFLINE)) {
          const store = db.createObjectStore(STORE_OFFLINE, { keyPath: "id" });
          store.createIndex("episodeId", "episodeId", { unique: false });
          store.createIndex("animeId", "animeId", { unique: false });
          store.createIndex("downloadedAt", "downloadedAt", { unique: false });
        }

        // Store 2: Active or Paused Tasks metadata
        if (!db.objectStoreNames.contains(STORE_TASKS)) {
          db.createObjectStore(STORE_TASKS, { keyPath: "id" });
        }

        // Store 3: Segmented Chunks (compound key [taskId, chunkIndex])
        if (!db.objectStoreNames.contains(STORE_CHUNKS)) {
          db.createObjectStore(STORE_CHUNKS, { keyPath: ["taskId", "chunkIndex"] });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

/* ========================================================================== */
/*                           IndexedDB CRUD Operations                        */
/* ========================================================================== */

export async function saveOfflineEpisode(episode: OfflineEpisode): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_OFFLINE, STORE_TASKS, STORE_CHUNKS], "readwrite");
    const offlineStore = tx.objectStore(STORE_OFFLINE);
    const taskStore = tx.objectStore(STORE_TASKS);

    offlineStore.put(episode);
    taskStore.delete(episode.id);

    // Delete chunks for this task to reclaim space
    const chunksStore = tx.objectStore(STORE_CHUNKS);
    const range = IDBKeyRange.bound([episode.id, 0], [episode.id, Infinity]);
    chunksStore.delete(range);

    tx.oncomplete = () => {
      notifyDownloadsChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineEpisodes(): Promise<OfflineEpisode[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OFFLINE, "readonly");
    const store = tx.objectStore(STORE_OFFLINE);
    const request = store.getAll();

    request.onsuccess = () => {
      const list = (request.result as OfflineEpisode[]) || [];
      list.sort((a, b) => b.downloadedAt - a.downloadedAt);
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineEpisode(id: string): Promise<OfflineEpisode | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OFFLINE, "readonly");
    const store = tx.objectStore(STORE_OFFLINE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOfflineEpisode(id: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OFFLINE, "readwrite");
    const store = tx.objectStore(STORE_OFFLINE);
    store.delete(id);

    tx.oncomplete = () => {
      notifyDownloadsChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllOfflineEpisodes(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_OFFLINE, STORE_TASKS, STORE_CHUNKS], "readwrite");
    tx.objectStore(STORE_OFFLINE).clear();
    tx.objectStore(STORE_TASKS).clear();
    tx.objectStore(STORE_CHUNKS).clear();

    tx.oncomplete = () => {
      notifyDownloadsChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getStorageEstimate(): Promise<StorageEstimateInfo> {
  let usageBytes = 0;
  let quotaBytes = 0;

  if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    } catch {
      // no-op
    }
  }

  const episodes = await getOfflineEpisodes().catch(() => []);
  const usagePercent = quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : 0;

  return {
    usageBytes,
    quotaBytes,
    usagePercent,
    offlineEpisodesCount: episodes.length,
  };
}

/* ========================================================================== */
/*                      Task State & Chunks Management                        */
/* ========================================================================== */

async function saveTaskRecord(task: DownloadTask): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TASKS, "readwrite");
    tx.objectStore(STORE_TASKS).put(task);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSavedTasks(): Promise<DownloadTask[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TASKS, "readonly");
    const request = tx.objectStore(STORE_TASKS).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function saveChunk(taskId: string, chunkIndex: number, data: ArrayBuffer): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHUNKS, "readwrite");
    tx.objectStore(STORE_CHUNKS).put({ taskId, chunkIndex, data });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getCompletedChunkIndices(taskId: string): Promise<Set<number>> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHUNKS, "readonly");
    const store = tx.objectStore(STORE_CHUNKS);
    const range = IDBKeyRange.bound([taskId, 0], [taskId, Infinity]);
    const request = store.getAllKeys(range);

    request.onsuccess = () => {
      const keys = (request.result as Array<[string, number]>) || [];
      const set = new Set<number>();
      for (const key of keys) {
        if (key && key[0] === taskId) {
          set.add(key[1]);
        }
      }
      resolve(set);
    };
    request.onerror = () => reject(request.error);
  });
}

async function assembleAllChunksToBlob(
  taskId: string,
  chunksCount: number,
  mimeType: string,
): Promise<Blob> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHUNKS, "readonly");
    const store = tx.objectStore(STORE_CHUNKS);
    const range = IDBKeyRange.bound([taskId, 0], [taskId, Infinity]);
    const request = store.getAll(range);

    request.onsuccess = () => {
      const records = (request.result as Array<{ chunkIndex: number; data: ArrayBuffer }>) || [];
      records.sort((a, b) => a.chunkIndex - b.chunkIndex);

      if (records.length < chunksCount) {
        return reject(
          new Error(
            `Incomplete chunks: received ${records.length} of ${chunksCount} expected segments`,
          ),
        );
      }

      const buffers = records.map((r) => r.data);
      const blob = new Blob(buffers, { type: mimeType || "video/mp4" });
      resolve(blob);
    };
    request.onerror = () => reject(request.error);
  });
}

/* ========================================================================== */
/*                In-Memory Downloader Engine & Worker Pool                   */
/* ========================================================================== */

interface ActiveDownloader {
  task: DownloadTask;
  abortController: AbortController | null;
  speedSamples: Array<{ bytes: number; timestamp: number }>;
}

const activeDownloaders = new Map<string, ActiveDownloader>();

function notifyDownloadsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nonton-downloads-updated"));
  }
}

/**
 * Starts or queues a segmented download task for an episode using Range requests.
 */
export async function startOrResumeDownload(params: {
  episodeId: string;
  animeId?: string;
  animeTitle: string;
  episodeTitle: string;
  episodeNumber: number;
  poster: string;
  quality: string;
  sourceUrl: string;
}): Promise<string> {
  const taskId = `${params.episodeId}_${params.quality.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

  // Check if already completed
  const existing = await getOfflineEpisode(taskId);
  if (existing) {
    throw new Error("Episode dengan kualitas ini sudah tersimpan offline di perangkat Anda.");
  }

  // Check if already downloading
  const running = activeDownloaders.get(taskId);
  if (running && running.task.status === "downloading") {
    return taskId;
  }

  // Check if previously paused task exists
  const savedTasks = await getSavedTasks();
  let task = savedTasks.find((t) => t.id === taskId);

  if (!task) {
    task = {
      id: taskId,
      episodeId: params.episodeId,
      animeId: params.animeId,
      animeTitle: params.animeTitle,
      episodeTitle: params.episodeTitle,
      episodeNumber: params.episodeNumber,
      poster: params.poster,
      quality: params.quality,
      sourceUrl: params.sourceUrl,
      totalBytes: 0,
      downloadedBytes: 0,
      chunksCount: 0,
      completedChunks: 0,
      status: "probing",
      speedBps: 0,
      etaSec: 0,
      startedAt: Date.now(),
    };
    await saveTaskRecord(task);
  }

  executeSegmentedDownload(task);
  return taskId;
}

export function pauseDownload(taskId: string): void {
  const downloader = activeDownloaders.get(taskId);
  if (downloader) {
    downloader.task.status = "paused";
    downloader.task.speedBps = 0;
    downloader.task.etaSec = 0;
    if (downloader.abortController) {
      downloader.abortController.abort();
    }
    saveTaskRecord(downloader.task);
    notifyDownloadsChanged();
  }
}

export async function resumeDownload(taskId: string): Promise<void> {
  const savedTasks = await getSavedTasks();
  const task = savedTasks.find((t) => t.id === taskId);
  if (task && task.status !== "completed") {
    executeSegmentedDownload(task);
  }
}

export async function cancelDownload(taskId: string): Promise<void> {
  pauseDownload(taskId);
  activeDownloaders.delete(taskId);

  const db = await getDb();
  return new Promise((resolve) => {
    const tx = db.transaction([STORE_TASKS, STORE_CHUNKS], "readwrite");
    tx.objectStore(STORE_TASKS).delete(taskId);
    const chunksStore = tx.objectStore(STORE_CHUNKS);
    const range = IDBKeyRange.bound([taskId, 0], [taskId, Infinity]);
    chunksStore.delete(range);

    tx.oncomplete = () => {
      notifyDownloadsChanged();
      resolve();
    };
    tx.onerror = () => resolve();
  });
}

export function getActiveTasks(): DownloadTask[] {
  return Array.from(activeDownloaders.values()).map((d) => d.task);
}

/**
 * Core Segmented Range Downloader Execution Loop.
 */
async function executeSegmentedDownload(initialTask: DownloadTask): Promise<void> {
  const abortController = new AbortController();
  const downloader: ActiveDownloader = {
    task: { ...initialTask, status: "downloading", errorMessage: undefined },
    abortController,
    speedSamples: [],
  };
  activeDownloaders.set(initialTask.id, downloader);
  notifyDownloadsChanged();

  try {
    // STEP 1: Probe Stream to determine Total Bytes & Range support
    const proxyBase = `/api/stream-proxy?url=${encodeURIComponent(downloader.task.sourceUrl)}`;

    if (!downloader.task.totalBytes || downloader.task.totalBytes <= 0) {
      downloader.task.status = "probing";
      notifyDownloadsChanged();

      const probeRes = await fetch(proxyBase, {
        method: "GET",
        headers: { Range: "bytes=0-1" },
        signal: abortController.signal,
      });

      if (!probeRes.ok && probeRes.status !== 206) {
        throw new Error(
          `Gagal menghubungi server video: HTTP ${probeRes.status} (${probeRes.statusText})`,
        );
      }

      const contentRange = probeRes.headers.get("content-range");
      let totalBytes = 0;
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)$/);
        if (match?.[1]) {
          totalBytes = parseInt(match[1], 10);
        }
      }

      if (!totalBytes || totalBytes <= 0) {
        const cl = probeRes.headers.get("content-length");
        if (cl) totalBytes = parseInt(cl, 10);
      }

      if (!totalBytes || totalBytes <= 0) {
        // Fallback default estimation 350MB if upstream omits Content-Length
        totalBytes = 350 * 1024 * 1024;
      }

      const chunksCount = Math.ceil(totalBytes / DEFAULT_CHUNK_SIZE);
      downloader.task.totalBytes = totalBytes;
      downloader.task.chunksCount = chunksCount;
      downloader.task.status = "downloading";
      await saveTaskRecord(downloader.task);
      notifyDownloadsChanged();
    }

    // STEP 2: Identify existing chunks to enable resume capability
    const completedIndices = await getCompletedChunkIndices(downloader.task.id);
    downloader.task.completedChunks = completedIndices.size;
    downloader.task.downloadedBytes = completedIndices.size * DEFAULT_CHUNK_SIZE;
    if (downloader.task.downloadedBytes > downloader.task.totalBytes) {
      downloader.task.downloadedBytes = downloader.task.totalBytes;
    }

    const totalBytes = downloader.task.totalBytes;
    const chunksCount = downloader.task.chunksCount;

    // STEP 3: Sequential segment downloads with automatic retries
    for (let i = 0; i < chunksCount; i++) {
      if (abortController.signal.aborted || downloader.task.status === "paused") {
        return;
      }

      if (completedIndices.has(i)) {
        continue;
      }

      const start = i * DEFAULT_CHUNK_SIZE;
      const end = Math.min(start + DEFAULT_CHUNK_SIZE - 1, totalBytes - 1);

      // Retry each chunk up to 3 times before failing
      let chunkDownloaded = false;
      let lastChunkErr: unknown = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        if (abortController.signal.aborted) return;

        try {
          const chunkStartTime = Date.now();
          const chunkRes = await fetch(proxyBase, {
            method: "GET",
            headers: {
              Range: `bytes=${start}-${end}`,
            },
            signal: abortController.signal,
          });

          if (!chunkRes.ok && chunkRes.status !== 206) {
            throw new Error(`Segmen ${i} gagal: HTTP ${chunkRes.status}`);
          }

          const arrayBuffer = await chunkRes.arrayBuffer();
          await saveChunk(downloader.task.id, i, arrayBuffer);

          completedIndices.add(i);
          downloader.task.completedChunks = completedIndices.size;
          downloader.task.downloadedBytes = Math.min(
            downloader.task.downloadedBytes + arrayBuffer.byteLength,
            totalBytes,
          );

          // Calculate download speed and ETA
          const chunkElapsed = Math.max(0.1, (Date.now() - chunkStartTime) / 1000);
          const chunkSpeed = arrayBuffer.byteLength / chunkElapsed;

          downloader.speedSamples.push({
            bytes: arrayBuffer.byteLength,
            timestamp: Date.now(),
          });
          // Keep last 6 samples for rolling average
          if (downloader.speedSamples.length > 6) {
            downloader.speedSamples.shift();
          }

          const totalSampleBytes = downloader.speedSamples.reduce((acc, s) => acc + s.bytes, 0);
          const totalSampleTime = Math.max(
            0.5,
            (downloader.speedSamples[downloader.speedSamples.length - 1].timestamp -
              downloader.speedSamples[0].timestamp) /
              1000,
          );
          const avgSpeed =
            downloader.speedSamples.length > 1 ? totalSampleBytes / totalSampleTime : chunkSpeed;

          downloader.task.speedBps = avgSpeed;
          const remainingBytes = Math.max(0, totalBytes - downloader.task.downloadedBytes);
          downloader.task.etaSec = avgSpeed > 0 ? Math.ceil(remainingBytes / avgSpeed) : 0;

          chunkDownloaded = true;
          notifyDownloadsChanged();
          break;
        } catch (err) {
          lastChunkErr = err;
          if (abortController.signal.aborted) return;
          // Exponential backoff wait
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        }
      }

      if (!chunkDownloaded) {
        throw (
          lastChunkErr ||
          new Error(`Gagal mengunduh segmen ${i + 1}/${chunksCount} setelah 3 kali percobaan.`)
        );
      }
    }

    // STEP 4: Assembling all downloaded chunks into OfflineEpisode Blob
    downloader.task.status = "completed";
    downloader.task.speedBps = 0;
    downloader.task.etaSec = 0;
    notifyDownloadsChanged();

    const finalBlob = await assembleAllChunksToBlob(downloader.task.id, chunksCount, "video/mp4");

    const offlineEpisode: OfflineEpisode = {
      id: downloader.task.id,
      episodeId: downloader.task.episodeId,
      animeId: downloader.task.animeId,
      animeTitle: downloader.task.animeTitle,
      episodeTitle: downloader.task.episodeTitle,
      episodeNumber: downloader.task.episodeNumber,
      poster: downloader.task.poster,
      quality: downloader.task.quality,
      sizeBytes: finalBlob.size,
      mimeType: "video/mp4",
      blob: finalBlob,
      downloadedAt: Date.now(),
    };

    await saveOfflineEpisode(offlineEpisode);
    activeDownloaders.delete(downloader.task.id);
    notifyDownloadsChanged();
  } catch (error) {
    if (abortController.signal.aborted) {
      return;
    }
    console.error("Segmented download error:", error);
    downloader.task.status = "error";
    downloader.task.speedBps = 0;
    downloader.task.etaSec = 0;
    downloader.task.errorMessage =
      error instanceof Error ? error.message : "Kesalahan transfer data Range";
    await saveTaskRecord(downloader.task);
    notifyDownloadsChanged();
  }
}
