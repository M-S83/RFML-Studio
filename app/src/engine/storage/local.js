// IndexedDB storage adapter. This is the Phase 2 persistence layer; the
// store API in ../store.js is the only consumer, so a Supabase (or other
// remote) adapter can replace this file without touching the app.

const DB_NAME = 'rfml-studio'
const DB_VERSION = 1

let dbPromise = null

function open() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('assets')) db.createObjectStore('assets', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'k' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(db, store, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode)
    const s = t.objectStore(store)
    const req = fn(s)
    t.oncomplete = () => resolve(req?.result)
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  })
}

export async function put(store, value) {
  const db = await open()
  return tx(db, store, 'readwrite', (s) => s.put(value))
}

export async function get(store, key) {
  const db = await open()
  const result = await tx(db, store, 'readonly', (s) => s.get(key))
  return result ?? null
}

export async function getAll(store) {
  const db = await open()
  return (await tx(db, store, 'readonly', (s) => s.getAll())) ?? []
}

export async function del(store, key) {
  const db = await open()
  return tx(db, store, 'readwrite', (s) => s.delete(key))
}
