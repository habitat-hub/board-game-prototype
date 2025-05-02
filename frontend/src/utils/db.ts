import { openDB } from 'idb';

const DB_NAME = 'BoardGamePrototype';
const STORE_NAME = 'images';

export const getIndexedDb = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export const saveImageToIndexedDb = async (id: string, imageBlob: Blob) => {
  const db = await getIndexedDb();
  await db.put(STORE_NAME, { id, imageBlob });
};

export const getImageFromIndexedDb = async (
  id: string
): Promise<Blob | null> => {
  const db = await getIndexedDb();
  const record = await db.get(STORE_NAME, id);
  return record ? record.imageBlob : null;
};
