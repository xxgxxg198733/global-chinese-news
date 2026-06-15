import { Suspense } from 'react';
import { getStickyOrLatestPosts, getLatestPosts, getPopularPosts } from '@/lib/wordpress';
import { INDEX_REVALIDATE } from '@/lib/constants';
import { HomeClient } from './HomeClient';

// ISR：每 5 分鐘重新驗證
export const revalidate = INDEX_REVALIDATE;

export default async function HomePage() {
  // 並行獲取三組資料
  const [featuredPosts, latestPosts, popularPosts] = await Promise.all([
    getStickyOrLatestPosts(5), // 輪播用：最新 5 篇
    getLatestPosts(19), // 新聞流：首篇大圖 + 18 篇網格
    getPopularPosts(10), // 熱門排行：10 篇
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeClient
          featuredPosts={featuredPosts}
          latestPosts={latestPosts.nodes}
          popularPosts={popularPosts}
          hasMorePosts={latestPosts.pageInfo.hasNextPage}
          endCursor={latestPosts.pageInfo.endCursor}
        />
      </Suspense>
    </div>
  );
}

/** 骨架屏 */
function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* 輪播骨架 */}
      <div className="aspect-[21/9] min-h-[360px] rounded-xl bg-gray-200" />
      {/* 內容骨架 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="h-48 rounded-xl bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[16/9] rounded-lg bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-96 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}
