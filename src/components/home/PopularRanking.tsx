import Link from 'next/link';
import type { PostSummary, TimezoneMode } from '@/lib/types';
import { formatDateByTimezone, stripHtml, cn } from '@/lib/utils';
import { TrendingUp, Eye } from 'lucide-react';

interface PopularRankingProps {
  posts: PostSummary[];
  timezone: TimezoneMode;
}

export function PopularRanking({ posts, timezone }: PopularRankingProps) {
  if (posts.length === 0) return null;

  return (
    <aside className="rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* 標題 */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        <TrendingUp className="h-5 w-5 text-red-500" />
        <h2 className="text-lg font-bold text-gray-900">熱門排行</h2>
      </div>

      {/* 排行列表 */}
      <ol className="divide-y divide-gray-50">
        {posts.map((post, index) => (
          <li key={post.id}>
            <Link
              href={`/posts/${post.slug}`}
              className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-red-50/50"
            >
              {/* 排名數字 */}
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  index === 0 && 'bg-red-600 text-white',
                  index === 1 && 'bg-red-500 text-white',
                  index === 2 && 'bg-orange-400 text-white',
                  index > 2 && 'bg-gray-100 text-gray-500'
                )}
              >
                {index + 1}
              </span>

              {/* 文章資訊 */}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium leading-snug text-gray-800 text-clamp-2 transition-colors hover:text-red-600">
                  {stripHtml(post.title)}
                </h3>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
                  <time dateTime={post.date}>
                    {formatDateByTimezone(post.date, timezone, 'MM/dd HH:mm')}
                  </time>
                  {post.categories?.nodes?.[0] && (
                    <>
                      <span>·</span>
                      <span>{post.categories.nodes[0].name}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
