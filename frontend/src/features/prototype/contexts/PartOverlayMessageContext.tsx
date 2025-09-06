import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

type PartOverlayMessageMap = Map<number, string | null>;

type PartOverlayMessageContextType = {
  messages: PartOverlayMessageMap;
  setMessage: (partId: number, message: string | null) => void;
  clearMessage: (partId: number) => void;
  /** Show a two-step shuffle message like the deck: "shuffling..." then "shuffled!" and hide. */
  runShuffleEffect: (partIds: number[]) => void;
};

const PartOverlayMessageContext = createContext<
  PartOverlayMessageContextType | undefined
>(undefined);

export const PartOverlayMessageProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [messages, setMessages] = useState<PartOverlayMessageMap>(new Map());
  const timersRef = useRef<
    Map<number, { hide?: ReturnType<typeof setTimeout> }>
  >(new Map());

  const setMessage = useCallback((partId: number, message: string | null) => {
    setMessages((prev) => {
      const next = new Map(prev);
      next.set(partId, message);
      return next;
    });
  }, []);

  const clearMessage = useCallback(
    (partId: number) => {
      const timers = timersRef.current.get(partId);
      if (timers?.hide) clearTimeout(timers.hide);
      timersRef.current.delete(partId);
      setMessage(partId, null);
    },
    [setMessage]
  );

  const runShuffleEffect = useCallback(
    (partIds: number[]) => {
      // Show completion message per id and schedule per-id hide
      partIds.forEach((id) => {
        setMessage(id, 'シャッフルしました');
        const current = timersRef.current.get(id) || {};
        if (current.hide) clearTimeout(current.hide);
        const hide = setTimeout(() => clearMessage(id), 1000);
        timersRef.current.set(id, { hide });
      });
    },
    [clearMessage, setMessage]
  );

  const value = useMemo(
    () => ({ messages, setMessage, clearMessage, runShuffleEffect }),
    [messages, setMessage, clearMessage, runShuffleEffect]
  );

  return (
    <PartOverlayMessageContext.Provider value={value}>
      {children}
    </PartOverlayMessageContext.Provider>
  );
};

export const usePartOverlayMessage = (): PartOverlayMessageContextType => {
  const ctx = useContext(PartOverlayMessageContext);
  if (!ctx)
    throw new Error(
      'usePartOverlayMessage は PartOverlayMessageProvider の内部でのみ使用できます'
    );
  return ctx;
};
