'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TimezoneMode } from '@/lib/types';

const STORAGE_KEY = 'news-timezone-preference';

/**
 * 時區切換 Hook
 * 支援「當地時區」與「台北時間 (UTC+8)」切換
 * 偏好設定持久化到 localStorage
 */
export function useTimezone() {
  const [timezone, setTimezone] = useState<TimezoneMode>('local');

  // 初始化：從 localStorage 讀取偏好
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'local' || saved === 'taipei') {
        setTimezone(saved);
      }
    } catch {
      // localStorage 不可用時忽略
    }
  }, []);

  // 切換時區
  const toggleTimezone = useCallback(() => {
    setTimezone((prev) => {
      const next: TimezoneMode = prev === 'local' ? 'taipei' : 'local';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // 忽略
      }
      return next;
    });
  }, []);

  return {
    timezone,
    toggleTimezone,
    isTaipei: timezone === 'taipei',
    label: timezone === 'taipei' ? '台北時間' : '當地時間',
  } as const;
}
