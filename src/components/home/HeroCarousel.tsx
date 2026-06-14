'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PostSummary, TimezoneMode } from '@/lib/types';
import { formatDateByTimezone, stripHtml, cn } from '@/lib/utils';

interface HeroCarouselProps {
  posts: PostSummary[];
  timezone: TimezoneMode;
}

export function HeroCarousel({ posts, timezone }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const total = posts.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + total) % total);
    },
    [total]
  );

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  // 自動輪播（6 秒）
  useEffect(() => {
    if (!isAutoPlaying || total <= 1) return;
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, goNext, total]);

  if (total === 0) return null;

  const post = posts[current];
  const imageUrl = post?.featuredImage?.node?.sourceUrl || '/images/placeholder.jpg';
  const category = post?.categories?.nodes?.[0];

  return (
    <section
      className="relative overflow-hidden rounded-xl bg-gray-900"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* 輪播主體 */}
      <div className="relative aspect-[21/9] min-h-[360px] md:aspect-[21/9]">
        {/* 背景圖片 */}
        <Image
          src={imageUrl}
          alt={stripHtml(post.title)}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* 漸層遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* 文字內容 */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          {category && (
            <Link
              href={`/category/${category.slug}`}
              className="mb-3 inline-block rounded-full bg-red-600/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-red-700"
            >
              {category.name}
            </Link>
          )}

          <Link href={`/posts/${post.slug}`}>
            <h2 className="mb-2 text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
              {stripHtml(post.title)}
            </h2>
          </Link>

          <p className="mb-3 max-w-2xl text-sm leading-relaxed text-gray-200 text-clamp-2 md:text-base">
            {stripHtml(post.excerpt)}
          </p>

          <time
            dateTime={post.date}
            className="text-xs text-gray-400"
          >
            {formatDateByTimezone(post.date, timezone, 'yyyy 年 MM 月 dd 日 HH:mm')}
          </time>
        </div>
      </div>

      {/* 導航箭頭 */}
      {total > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
            aria-label="上一則"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
            aria-label="下一則"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* 底部指示器 */}
      {total > 1 && (
        <div className="absolute bottom-4 right-6 flex gap-2 md:bottom-10 md:right-10">
          {posts.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === current
                  ? 'w-8 bg-red-500'
                  : 'w-2 bg-white/50 hover:bg-white/70'
              )}
              aria-label={`第 ${index + 1} 則`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
