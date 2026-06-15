'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { SearchForm } from '@/components/search/SearchForm';
import { PostCard } from '@/components/post/PostCard';
import { useTimezone } from '@/hooks/useTimezone';
import type { PostSummary, PageInfo } from '@/lib/types';
import { POSTS_PER_PAGE } from '@/lib/constants';

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { timezone } = useTimezone();

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setPosts([]);
      setPageInfo(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&first=${POSTS_PER_PAGE}`
      );

      if (!response.ok) throw new Error('搜尋失敗');

      const data = await response.json();
      setPosts(data.posts?.nodes || []);
      setPageInfo(data.posts?.pageInfo || null);
    } catch (err) {
      setError('搜尋時發生錯誤，請稍後再試');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 搜尋標題 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">搜尋新聞</h1>
        <p className="mt-2 text-gray-500">輸入關鍵字，搜尋您感興趣的新聞</p>
      </div>

      {/* 搜尋框 */}
      <div className="mb-8">
        <SearchForm initialQuery={query} size="large" />
      </div>

      {/* 搜尋結果 */}
      {query.trim() && (
        <div>
          {/* 結果統計 */}
          <div className="mb-6 flex items-center gap-2">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                搜尋中...
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                搜尋「<span className="font-medium text-gray-800">{query}</span>」
                {pageInfo && (
                  <span> — 搜尋結果</span>
                )}
              </p>
            )}
          </div>

          {/* 錯誤提示 */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 結果列表 */}
          {!loading && posts.length > 0 && (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <PostCard post={post} timezone={timezone} variant="horizontal" />
                </div>
              ))}
            </div>
          )}

          {/* 無結果 */}
          {!loading && !error && posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <svg
                className="mb-4 h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-sm">未找到相關文章</p>
              <p className="mt-1 text-xs text-gray-400">
                請嘗試使用不同的關鍵字搜尋
              </p>
              <Link
                href="/"
                className="mt-4 text-sm font-medium text-red-600 hover:text-red-700"
              >
                返回首頁
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 未搜尋時的提示 */}
      {!query.trim() && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg
            className="mb-4 h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-sm">請在上方輸入關鍵字開始搜尋</p>
        </div>
      )}
    </div>
  );
}
