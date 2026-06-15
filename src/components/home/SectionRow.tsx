import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import type { PostSummary, TimezoneMode } from '@/lib/types';
import { formatDateByTimezone, stripHtml, cn } from '@/lib/utils';

interface SectionRowProps {
  title: string;
  slug: string;
  posts: PostSummary[];
  timezone: TimezoneMode;
  color?: string;
}

export function SectionRow({ title, slug, posts, timezone, color = '#c41e3a' }: SectionRowProps) {
  if (posts.length === 0) return null;

  const [lead, ...rest] = posts;
  const grid = rest.slice(0, 3);

  return (
    <section className="mb-10">
      {/* 标题栏 */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
        <h2
          className="text-xl font-bold"
          style={{ color, borderLeft: `4px solid ${color}`, paddingLeft: 12 }}
        >
          {title}
        </h2>
        <Link
          href={`/category/${slug}`}
          className="flex items-center gap-0.5 text-sm text-gray-500 transition-colors hover:text-red-600"
        >
          更多 <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 主导文章 + 小卡片 */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
        {/* 主导文章 — 跨两列，横向布局 */}
        <div className="lg:col-span-2">
          <LeadCard post={lead} timezone={timezone} />
        </div>

        {/* 3 篇小卡片 — 纵向堆叠 */}
        <div className="flex flex-col gap-4">
          {grid.map((post) => (
            <MiniCard key={post.id} post={post} timezone={timezone} />
          ))}
          {grid.length === 0 && (
            <div className="flex items-center justify-center rounded-lg bg-gray-50 py-8 text-sm text-gray-400">
              暫無更多文章
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** 主导文章 — 大图 + 标题 + 摘要 */
function LeadCard({ post, timezone }: { post: PostSummary; timezone: TimezoneMode }) {
  const img = post.featuredImage?.node?.sourceUrl;

  return (
    <Link href={`/posts/${post.databaseId}`} className="group block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="grid sm:grid-cols-[1.4fr_1fr]">
        {img && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={img}
              alt={stripHtml(post.title)}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
        )}
        <div className="flex flex-col justify-center p-5">
          {post.categories?.nodes?.[0] && (
            <span className="mb-2 self-start rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
              {post.categories.nodes[0].name}
            </span>
          )}
          <h3 className="text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-red-600">
            {stripHtml(post.title)}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 text-clamp-2">
            {stripHtml(post.excerpt)}
          </p>
          <time className="mt-3 text-xs text-gray-400" dateTime={post.date}>
            {formatDateByTimezone(post.date, timezone, 'MM/dd HH:mm')}
          </time>
        </div>
      </div>
    </Link>
  );
}

/** 迷你卡片 — 缩略图 + 标题 */
function MiniCard({ post, timezone }: { post: PostSummary; timezone: TimezoneMode }) {
  const img = post.featuredImage?.node?.sourceUrl;

  return (
    <Link href={`/posts/${post.databaseId}`} className="group flex gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      {img && (
        <div className="relative h-[72px] w-[96px] shrink-0 overflow-hidden rounded-md">
          <Image
            src={img}
            alt={stripHtml(post.title)}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="96px"
          />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <h4 className="text-sm font-medium leading-snug text-gray-800 text-clamp-2 transition-colors group-hover:text-red-600">
          {stripHtml(post.title)}
        </h4>
        <time className="mt-1 text-xs text-gray-400" dateTime={post.date}>
          {formatDateByTimezone(post.date, timezone, 'MM/dd HH:mm')}
        </time>
      </div>
    </Link>
  );
}
