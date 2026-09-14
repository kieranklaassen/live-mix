// Where saved versions live (U30): an async key-value contract small enough
// to implement over anything, with three adapters — memory (tests, SSR),
// a synchronous `StorageLike` (localStorage), and IndexedDB for browsers.
// `VersionHistory` keeps its own in-memory index and writes through, so
// adapters never need to be fast or ordered.
//
// Import-safe under SSR: `indexedDB` is only read inside `open`.

import { type StorageLike } from '../core/control/serialize'

/** The persisted shape; `VersionHistory` owns the fields, storage treats it as opaque JSON. */
export interface StoredVersionRecord {
  id: string
  atMs: number
  [key: string]: unknown
}

export interface VersionStorage {
  /** Every stored record, any order. */
  list(): Promise<StoredVersionRecord[]>
  get(id: string): Promise<StoredVersionRecord | undefined>
  put(record: StoredVersionRecord): Promise<void>
  remove(id: string): Promise<void>
  clear(): Promise<void>
}

/** In-memory storage: what tests and server renders use. */
export function memoryVersionStorage(): VersionStorage & {
  readonly size: number
  /** Serialized bytes held, for budget assertions. */
  readonly bytes: number
} {
  const records = new Map<string, string>()
  return {
    get size() {
      return records.size
    },
    get bytes() {
      let total = 0
      for (const json of records.values()) total += byteLength(json)
      return total
    },
    list: async () => [...records.values()].map((json) => JSON.parse(json) as StoredVersionRecord),
    get: async (id) => {
      const json = records.get(id)
      return json === undefined ? undefined : (JSON.parse(json) as StoredVersionRecord)
    },
    put: async (record) => {
      records.set(record.id, JSON.stringify(record))
    },
    remove: async (id) => {
      records.delete(id)
    },
    clear: async () => {
      records.clear()
    },
  }
}

export const VERSION_STORAGE_KEY = 'live-mix:versions'

/**
 * Versions in a `localStorage`-like store: an index of ids under `key` and
 * one item per version under `${key}:${id}`. Synchronous underneath; the
 * promises resolve immediately.
 */
export function webStorageVersionStorage(
  storage: StorageLike,
  options: { key?: string } = {},
): VersionStorage {
  const key = options.key ?? VERSION_STORAGE_KEY
  const readIndex = (): string[] => {
    try {
      const raw = storage.getItem(key)
      const parsed: unknown = raw === null ? [] : JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
    } catch {
      return []
    }
  }
  const writeIndex = (ids: string[]): void => {
    storage.setItem(key, JSON.stringify(ids))
  }
  const read = (id: string): StoredVersionRecord | undefined => {
    const raw = storage.getItem(`${key}:${id}`)
    if (raw === null) return undefined
    try {
      const parsed: unknown = JSON.parse(raw)
      return isRecord(parsed) ? parsed : undefined
    } catch {
      return undefined
    }
  }
  return {
    list: async () =>
      readIndex()
        .map(read)
        .filter((record): record is StoredVersionRecord => record !== undefined),
    get: async (id) => read(id),
    put: async (record) => {
      storage.setItem(`${key}:${record.id}`, JSON.stringify(record))
      const ids = readIndex()
      if (!ids.includes(record.id)) writeIndex([...ids, record.id])
    },
    remove: async (id) => {
      storage.removeItem(`${key}:${id}`)
      writeIndex(readIndex().filter((candidate) => candidate !== id))
    },
    clear: async () => {
      for (const id of readIndex()) storage.removeItem(`${key}:${id}`)
      storage.removeItem(key)
    },
  }
}

export interface IndexedDbVersionStorageOptions {
  /** Default `'live-mix'`. */
  dbName?: string
  /** Default `'versions'`. */
  storeName?: string
  /** The factory to use; defaults to the global `indexedDB` (throws inside the promises when absent). */
  indexedDB?: IDBFactory
}

/** Versions in IndexedDB, one object store keyed by id. The database opens lazily on first use. */
export function indexedDbVersionStorage(
  options: IndexedDbVersionStorageOptions = {},
): VersionStorage {
  const dbName = options.dbName ?? 'live-mix'
  const storeName = options.storeName ?? 'versions'
  let opening: Promise<IDBDatabase> | null = null

  const open = (): Promise<IDBDatabase> => {
    if (opening) return opening
    const factory = options.indexedDB ?? (globalThis as { indexedDB?: IDBFactory }).indexedDB
    if (!factory) {
      return Promise.reject(new Error('live-mix: IndexedDB is not available in this environment'))
    }
    opening = new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(dbName, 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: 'id' })
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('live-mix: IndexedDB open failed'))
      request.onblocked = () => reject(new Error('live-mix: IndexedDB open blocked'))
    })
    opening.catch(() => {
      opening = null
    })
    return opening
  }

  const transact = async <T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> => {
    const db = await open()
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode)
      const request = run(transaction.objectStore(storeName))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('live-mix: IndexedDB request failed'))
      transaction.onabort = () =>
        reject(transaction.error ?? new Error('live-mix: IndexedDB transaction aborted'))
    })
  }

  return {
    list: async () => {
      const all = await transact<unknown[]>('readonly', (store) => store.getAll())
      return all.filter(isRecord)
    },
    get: async (id) => {
      const record = await transact<unknown>('readonly', (store) => store.get(id))
      return isRecord(record) ? record : undefined
    },
    put: async (record) => {
      await transact('readwrite', (store) => store.put(record))
    },
    remove: async (id) => {
      await transact('readwrite', (store) => store.delete(id))
    },
    clear: async () => {
      await transact('readwrite', (store) => store.clear())
    },
  }
}

function isRecord(value: unknown): value is StoredVersionRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string' &&
    typeof (value as { atMs?: unknown }).atMs === 'number'
  )
}

const encoder = typeof TextEncoder === 'undefined' ? null : new TextEncoder()

/** UTF-8 size of a string (what a storage quota counts). */
export function byteLength(text: string): number {
  return encoder ? encoder.encode(text).length : text.length
}
