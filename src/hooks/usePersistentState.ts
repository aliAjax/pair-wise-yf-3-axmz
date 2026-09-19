import { useEffect, useState } from 'react';

/**
 * 与浏览器 localStorage 同步的 state：
 * 读取时优先取已存储的值，写入时同步到浏览器存储，刷新后保留。
 */
export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {
      // 存储不可用或解析失败时回退到初始值
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 忽略写入失败（隐私模式等）
    }
  }, [key, value]);

  return [value, setValue] as const;
}
