import Link from 'next/link';
import Image from 'next/image';
import type { PostSummary } from '@/lib/types';
import { formatDateByTimezone, stripHtml, cn } from '@/lib/utils';
import type { TimezoneMode } from '@/lib/types';
import { Clock } from 'lucide-react';

interface PostCardProps {
  post: PostSummary;
  timezone: TimezoneMode;
  /** 卡片樣式變體 */
  variant?: 'default' | 'horizontal' | 'compact';
  /** 圖片優先加載（首屏用） */
  priority?: boolean;
}

export function PostCard({ post, timezone, variant = 'default', priority = false }: PostCardProps) {
  const imageUrl = post.featuredImage?.node?.sourceUrl || '/images/placeholder.jpg';
  const imageAlt = post.featuredImage?.node?.altText || stripHtml(post.title);
  const category = post.categories?.nodes?.[0];

  const cardStyles = {
    default: 'flex flex-col',
    horizontal: 'flex flex-row gap-4',
    compact: 'flex flex-row items-start gap-3',
  };

  const imageStyles = {
    default: 'aspect-[16/9] w-full rounded-lg',
    horizontal: 'aspect-[16/9] w-48 shrink-0 rounded-lg',
    compact: 'aspect-square w-20 shrink-0 rounded-md',
  };

  return (
    <article className={cn('news-card group', cardStyles[variant])}>
      <Link href={`/posts/${post.slug}`} className="block overflow-hidden">
        <div className={cn('relative overflow-hidden', imageStyles[variant])}>
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes={
              variant === 'compact'
                ? '80px'
                : variant === 'horizontal'
                  ? '192px'
                  : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            }
            className="news-card-image object-cover"
            priority={priority}
          />
        </div>
      </Link>

      <div className={cn('flex flex-col', variant !== 'compact' && 'mt-3', variant === 'compact' && 'flex-1')}>
        {/* 分類標籤 */}
        {category && variant !== 'compact' && (
          <Link
            href={`/category/${category.slug}`}
            className="mb-1.5 self-start rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            {category.name}
          </Link>
        )}

        {/* 標題 */}
        <Link href={`/posts/${post.slug}`}>
          <h3
            className={cn(
              'font-semibold leading-snug text-gray-900 transition-colors group-hover:text-red-600',
              variant === 'default' && 'text-lg',
              variant === 'horizontal' && 'text-base',
              variant === 'compact' && 'text-sm'
            )}
          >
            {stripHtml(post.title)}
          </h3>
        </Link>

        {/* 摘要（非 compact 模式） */}
        {variant !== 'compact' && post.excerpt && (
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500 text-clamp-2">
            {stripHtml(post.excerpt)}
          </p>
        )}

        {/* 時間 */}
        <div className="mt-auto flex items-center gap-1 pt-2 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          <time dateTime={post.date}>
            {formatDateByTimezone(post.date, timezone, 'yyyy/MM/dd HH:mm')}
          </time>
        </div>
      </div>
    </article>
  );
}
