import type { Playlist, StoredAudioRecord, Track } from '../types/music';

const DB_NAME = 'nocturne_gothic_vault_v1';
const DB_VERSION = 1;

const STORES = {
  TRACKS: 'tracks',
  AUDIO_BLOBS: 'audioBlobs',
  PLAYLISTS: 'playlists',
  SETTINGS: 'settings',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openVaultDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.TRACKS)) {
        const trackStore = db.createObjectStore(STORES.TRACKS, { keyPath: 'id' });
        trackStore.createIndex('addedAt', 'addedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.AUDIO_BLOBS)) {
        db.createObjectStore(STORES.AUDIO_BLOBS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.PLAYLISTS)) {
        db.createObjectStore(STORES.PLAYLISTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error('Failed to open IndexedDB vault.'));
    };
  });

  return dbPromise;
}

function runTx<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  executor: (tx: IDBTransaction) => IDBRequest<T> | void
): Promise<T> {
  return openVaultDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeNames, mode);
        let reqResult: T | undefined;
        let hasRequest = false;

        try {
          const maybeReq = executor(tx);
          if (maybeReq) {
            hasRequest = true;
            maybeReq.onsuccess = () => {
              reqResult = maybeReq.result;
            };
          }
        } catch (err) {
          reject(err);
          return;
        }

        tx.oncomplete = () => resolve((hasRequest ? reqResult : undefined) as T);
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction error'));
        tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
      })
  );
}

export async function getAllTracks(): Promise<Track[]> {
  const tracks = await runTx<Track[]>(STORES.TRACKS, 'readonly', (tx) =>
    tx.objectStore(STORES.TRACKS).getAll()
  );
  return (tracks ?? []).sort((a, b) => b.addedAt - a.addedAt);
}

export async function getTrackAudioBlob(id: string): Promise<StoredAudioRecord | undefined> {
  return runTx<StoredAudioRecord | undefined>(STORES.AUDIO_BLOBS, 'readonly', (tx) =>
    tx.objectStore(STORES.AUDIO_BLOBS).get(id)
  );
}

export async function saveTrackWithAudio(track: Track, blob: Blob, mimeType: string): Promise<void> {
  await runTx<void>([STORES.TRACKS, STORES.AUDIO_BLOBS], 'readwrite', (tx) => {
    tx.objectStore(STORES.TRACKS).put(track);
    tx.objectStore(STORES.AUDIO_BLOBS).put({ id: track.id, blob, mimeType });
  });
}

export async function updateTrackRecord(track: Track): Promise<void> {
  await runTx<IDBValidKey>(STORES.TRACKS, 'readwrite', (tx) =>
    tx.objectStore(STORES.TRACKS).put(track)
  );
}

export async function deleteTrackRecord(id: string): Promise<void> {
  await runTx<void>([STORES.TRACKS, STORES.AUDIO_BLOBS], 'readwrite', (tx) => {
    tx.objectStore(STORES.TRACKS).delete(id);
    tx.objectStore(STORES.AUDIO_BLOBS).delete(id);
  });
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const playlists = await runTx<Playlist[]>(STORES.PLAYLISTS, 'readonly', (tx) =>
    tx.objectStore(STORES.PLAYLISTS).getAll()
  );
  return (playlists ?? []).sort((a, b) => a.createdAt - b.createdAt);
}

export async function savePlaylistRecord(playlist: Playlist): Promise<void> {
  await runTx<IDBValidKey>(STORES.PLAYLISTS, 'readwrite', (tx) =>
    tx.objectStore(STORES.PLAYLISTS).put(playlist)
  );
}

export async function deletePlaylistRecord(id: string): Promise<void> {
  await runTx<undefined>(STORES.PLAYLISTS, 'readwrite', (tx) =>
    tx.objectStore(STORES.PLAYLISTS).delete(id)
  );
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const record = await runTx<{ key: string; value: T } | undefined>(
    STORES.SETTINGS,
    'readonly',
    (tx) => tx.objectStore(STORES.SETTINGS).get(key)
  );
  return record ? record.value : fallback;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await runTx<IDBValidKey>(STORES.SETTINGS, 'readwrite', (tx) =>
    tx.objectStore(STORES.SETTINGS).put({ key, value })
  );
}
