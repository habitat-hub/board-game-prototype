const objectUrlCache = new Map<string, string>();

export const getCachedObjectURL = (id: string): string | undefined =>
  objectUrlCache.get(id);

export const setCachedObjectURL = (id: string, url: string): void => {
  objectUrlCache.set(id, url);
};

export const hasCachedObjectURL = (id: string): boolean =>
  objectUrlCache.has(id);

export const revokeObjectURLAndCleanCache = (id: string): void => {
  const objectURL = objectUrlCache.get(id);
  if (objectURL) {
    URL.revokeObjectURL(objectURL);
    objectUrlCache.delete(id);
  }
};

export const revokeMultipleObjectURLsAndCleanCache = (ids: string[]): void => {
  ids.forEach((id) => revokeObjectURLAndCleanCache(id));
};

