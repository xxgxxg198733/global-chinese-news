'use client';

import { useState } from 'react';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { NewsGrid } from '@/components/home/NewsGrid';
import { PopularRanking } from '@/components/home/PopularRanking';
import { Pagination } from '@/components/ui/Pagination';
import { useTimezone } from '@/hooks/useTimezone';
import type { PostSummary } from '@/lib/types';
import { POSTS_PER_PAGE } from '@/lib/constants';

interface HomeClientProps {
  featuredPosts: PostSummary[];
  latestPosts: PostSummary[];
  popularPosts: PostSummary[];
  totalPosts: number;
  hasMorePosts: boolean;
  endCursor: string;
}

export function HomeClient({
  featuredPosts,
  latestPosts,
  popularPosts,
  totalPosts,
}: HomeClientProps) {
  const { timezone } = useTimezone();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  return (
    <>
      {/* 置頂輪播大圖 */}
      <HeroCarousel posts={featuredPosts} timezone={timezone} />

      {/* 主內容區域：新聞流 + 熱門排行側欄 */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* 左側：新聞流 */}
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">最新新聞</h2>
            {totalPosts > 0 && (
              <span className="text-sm text-gray-400">
                共 {totalPosts.toLocaleString()} 篇
              </span>
            )}
          </div>

          <NewsGrid posts={latestPosts} timezone={timezone} />

          {/* 分頁 */}
          {totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {/* 右側：熱門排行 */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <PopularRanking posts={popularPosts} timezone={timezone} />
          </div>
        </div>
      </div>
    </>
  );
}
