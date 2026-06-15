'use client';

import { HeroCarousel } from '@/components/home/HeroCarousel';
import { NewsGrid } from '@/components/home/NewsGrid';
import { PopularRanking } from '@/components/home/PopularRanking';
import { useTimezone } from '@/hooks/useTimezone';
import type { PostSummary } from '@/lib/types';

interface HomeClientProps {
  featuredPosts: PostSummary[];
  latestPosts: PostSummary[];
  popularPosts: PostSummary[];
  hasMorePosts: boolean;
  endCursor: string;
}

export function HomeClient({
  featuredPosts,
  latestPosts,
  popularPosts,
}: HomeClientProps) {
  const { timezone } = useTimezone();

  return (
    <>
      <HeroCarousel posts={featuredPosts} timezone={timezone} />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">最新新聞</h2>
          </div>

          <NewsGrid posts={latestPosts} timezone={timezone} />
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <PopularRanking posts={popularPosts} timezone={timezone} />
          </div>
        </div>
      </div>
    </>
  );
}
