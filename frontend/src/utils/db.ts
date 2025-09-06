import { openDB } from 'idb';

import {
  getCachedObjectURL,
  setCachedObjectURL,
  hasCachedObjectURL,
  revokeObjectURLAndCleanCache,
  revokeMultipleObjectURLsAndCleanCache,
} from './imageCache';

const DB_NAME = 'BoardGamePrototype';
const STORE_NAME = 'images';
const IMAGE_DELETE_GRACE_DAYS = 3;

type IndexedDbImageResult = {
  imageBlob: Blob;
  objectURL: string;
};

// IndexedDBの初期化関数
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

// IndexedDBに画像を保存する関数
export const saveImageToIndexedDb = async (
  id: string,
  imageBlob: Blob
): Promise<IndexedDbImageResult | null> => {
  try {
    // IndexedDBに保存
    const db = await getIndexedDb();
    await db.put(STORE_NAME, {
      id,
      imageBlob,
      deletedAt: null,
      isDeleted: false,
    });

    // 既存のオブジェクトURLがある場合はクリーンアップ
    if (hasCachedObjectURL(id)) {
      revokeObjectURLAndCleanCache(id);
    }

    // 新しいオブジェクトURLを作成してキャッシュに保存
    const objectURL = URL.createObjectURL(imageBlob);
    setCachedObjectURL(id, objectURL);

    return {
      imageBlob,
      objectURL: objectURL,
    };
  } catch (error) {
    // TODO: エラーハンドリングを追加
    // 例えば、IndexedDBのストレージが逼迫している場合など
    // その場合は、ローカルストレージやセッションストレージに保存するなどの処理を検討する
    // ここでは、エラーをコンソールに出力するだけにしています
    console.error(`ID: ${id}の画像をIndexedDBに保存できませんでした:`, error);
    return null;
  }
};

// IndexedDBから画像を取得する関数
// 画像が存在しない場合はnullを返す
export const getImageFromIndexedDb = async (
  id: string
): Promise<IndexedDbImageResult | null> => {
  try {
    const db = await getIndexedDb();
    const record = await db.get(STORE_NAME, id);
    if (record && record.imageBlob) {
      const objectURL = getCachedObjectURL(id);
      if (objectURL) {
        return { imageBlob: record.imageBlob, objectURL };
      }
      const newObjectURL = URL.createObjectURL(record.imageBlob);
      setCachedObjectURL(id, newObjectURL);
      return { imageBlob: record.imageBlob, objectURL: newObjectURL };
    }

    return null; // 画像が存在しない場合はnullを返す
  } catch (error) {
    console.error(`ID: ${id}の画像をIndexedDBから取得できませんでした:`, error);
    return null; // エラー時はnullを返す
  }
};

// IndexedDBの画像の削除フラグ、削除日時を更新する関数
export const updateImageParamsInIndexedDb = async (
  id: string,
  isDeleted: boolean = false,
  deletedAt: Date | null = null
): Promise<void> => {
  try {
    const db = await getIndexedDb();
    const record = await db.get(STORE_NAME, id);
    if (record) {
      record.isDeleted = isDeleted;
      record.deletedAt = deletedAt;
      await db.put(STORE_NAME, record);
    }
  } catch (error) {
    console.error(`ID: ${id}の画像をIndexedDBで更新できませんでした:`, error);
    // エラー時は何もしない
    // ここでは、エラーをコンソールに出力するだけにしています
  }
};

//以下の条件を満たす画像を全てIndexedDBから削除する
// 1. 削除フラグがオン
// 2. 削除日時が設定されており、かつ削除日時が現在日時-削除猶予期間（日数）以上前の画像
export const deleteExpiredImagesFromIndexedDb = async (): Promise<void> => {
  try {
    const db = await getIndexedDb();
    const records = await db.getAll(STORE_NAME);

    const now = new Date();
    const threshold = new Date(
      now.getTime() - IMAGE_DELETE_GRACE_DAYS * 24 * 60 * 60 * 1000
    );

    const expiredRecords = records.filter(
      (record) =>
        record.isDeleted === true &&
        record.deletedAt &&
        new Date(record.deletedAt) < threshold
    );

    // 期限切れレコードのURLとキャッシュをクリーンアップ
    const expiredIds = expiredRecords.map((record) => record.id);
    revokeMultipleObjectURLsAndCleanCache(expiredIds);

    // IndexedDBからレコードを削除
    for (const record of expiredRecords) {
      await db.delete(STORE_NAME, record.id);
    }
  } catch (error) {
    console.error('期限切れ画像のIndexedDB削除に失敗:', error);
  }
};

// IndexedDBの削除日時、削除フラグをリセットする関数
// 画像が複数のパーツから参照されていた場合に、
// あるパーツAでは画像が削除され、他のパーツBでは画像が使用されている場合は
// パーツBの画像を再度取得したタイミングで前述の項目をリセットする
// 本関数を呼び出してから、getImageFromIndexedDb(id)を呼び出すこと
export const resetImageParamsInIndexedDb = async (
  id: string
): Promise<void> => {
  try {
    const db = await getIndexedDb();
    const record = await db.get(STORE_NAME, id);
    if (record && record.isDeleted) {
      record.isDeleted = false;
      record.deletedAt = null;
      await db.put(STORE_NAME, record);
    }
  } catch (error) {
    console.error('resetImageParamsInIndexedDb failed', error);
  }
};
