import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  mutations: {
    key: string;
    value: {
      id: string;
      url: string;
      method: string;
      payload: any;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

export function getOfflineDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>('fleet-offline-db', 1, {
      upgrade(db) {
        db.createObjectStore('mutations', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function saveMutation(mutation: any) {
  const db = await getOfflineDB();
  if (!db) return;
  await db.put('mutations', {
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  });
}

export async function getPendingMutations() {
  const db = await getOfflineDB();
  if (!db) return [];
  return db.getAll('mutations');
}

export async function removeMutation(id: string) {
  const db = await getOfflineDB();
  if (!db) return;
  await db.delete('mutations', id);
}
