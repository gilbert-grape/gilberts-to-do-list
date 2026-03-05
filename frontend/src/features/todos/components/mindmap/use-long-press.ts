import { useCallback, useRef } from "react";

const LONG_PRESS_DELAY = 500;

export interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
}

export function useLongPress(
  callback: () => void,
  delay = LONG_PRESS_DELAY,
): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        callback();
      }, delay);
    },
    [callback, delay],
  );

  const onTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  const onTouchMove = useCallback(() => {
    clear();
  }, [clear]);

  return { onTouchStart, onTouchEnd, onTouchMove };
}
