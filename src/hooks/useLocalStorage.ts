import { useCallback, useEffect, useState } from 'react';

/**
 * 浏览器 localStorage 持久化的 state：
 * - 刷新页面后保留
 * - 同浏览器跨标签页通过 storage 事件同步
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const read = useCallback((): T => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialValue : (JSON.parse(raw) as T);
    } catch {
      return initialValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 存储不可用时静默降级为内存 state
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          setValue(e.newValue === null ? initialValue : (JSON.parse(e.newValue) as T));
        } catch {
          // ignore parse error
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setValue] as const;
}
