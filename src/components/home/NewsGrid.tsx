import type { PostSummary, TimezoneMode } from '@/lib/types';
import { PostCard } from '@/components/post/PostCard';

interface NewsGridProps {
  posts: PostSummary[];
  timezone: TimezoneMode;
}

export function NewsGrid({ posts, timezone }: NewsGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <p className="text-sm">暫無新聞</p>
      </div>
    );
  }

  // 第一篇文章使用較大的佈局（橫向 + 大圖）
  const firstPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <div className="space-y-8">
      {/* 頭條文章 — 大尺寸展示 */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
        <PostCard post={firstPost} timezone={timezone} variant="horizontal" priority />
      </div>

      {/* 其餘文章 — 三欄網格 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {remainingPosts.map((post) => (
          <div
            key={post.id}
            className="overflow-hidden rounded-xl border border-gray-100 bg-white p-0 shadow-sm transition-shadow hover:shadow-md"
          >
            <PostCard post={post} timezone={timezone} variant="default" />
          </div>
        ))}
      </div>
    </div>
  );
}
