import { openDB } from 'idb';

const DB_NAME = 'BoardGamePrototype';
const STORE_NAME = 'images';

export const getIndexedDb = async () => {
  try {
    return await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`IndexedDBの初期化に失敗しました: ${error.message}`);
    } else {
      throw new Error('予期しないエラーが発生しました');
    }
  }
};

export const saveImageToIndexedDb = async (id: string, imageBlob: Blob) => {
  try {
    const db = await getIndexedDb();
    await db.put(STORE_NAME, { id, imageBlob });
  } catch (error) {
    // TODO: エラーハンドリングを追加
    // 例えば、IndexedDBのストレージが逼迫している場合など
    // その場合は、ローカルストレージやセッションストレージに保存するなどの処理を検討する
    // ここでは、エラーをコンソールに出力するだけにしています
    console.error(`ID: ${id}の画像をIndexedDBに保存できませんでした:`, error);
  }
};

export const getImageFromIndexedDb = async (
  id: string
): Promise<Blob | null> => {
  try {
    const db = await getIndexedDb();
    const record = await db.get(STORE_NAME, id);
    return record ? record.imageBlob : null;
  } catch (error) {
    console.error(`ID: ${id}の画像をIndexedDBから取得できませんでした:`, error);
    return null; // エラー時はnullを返す
  }
};
