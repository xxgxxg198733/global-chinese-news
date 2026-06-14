'use client';

import { useEffect, useRef } from 'react';

/**
 * 文章瀏覽量追蹤元件
 *
 * 在文章頁面渲染後，POST /api/views 記錄一次瀏覽。
 * 使用 IntersectionObserver 確保只在文章區塊進入視口時才計數，
 * 避免頁面載入但使用者根本沒看到內容的虛高計數。
 *
 * 用法：在 PostDetailClient 中放置 <ViewTracker slug={post.slug} />
 */

interface Props {
  slug: string;
}

export function ViewTracker({ slug }: Props) {
  const sentRef = useRef(false);

  useEffect(() => {
    // 用 ref 防止 React Strict Mode 雙重執行
    if (sentRef.current) return;

    const el = document.getElementById('article-content');
    if (!el) {
      // 找不到 article-content 元素，直接發送
      sendView(slug, sentRef);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          sendView(slug, sentRef);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [slug]);

  // 此元件不渲染任何 UI
  return null;
}

function sendView(slug: string, ref: React.MutableRefObject<boolean>) {
  if (ref.current) return;
  ref.current = true;

  fetch('/api/views', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
    // keepalive 確保頁面關閉時請求仍能發出
    keepalive: true,
  }).catch(() => {
    // 靜默失敗，不影響使用者體驗
  });
}
