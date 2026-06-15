'use client';

import { HeroCarousel } from '@/components/home/HeroCarousel';
import { SectionRow } from '@/components/home/SectionRow';
import { PopularRanking } from '@/components/home/PopularRanking';
import { useTimezone } from '@/hooks/useTimezone';
import type { PostSummary } from '@/lib/types';

interface HomeClientProps {
  featuredPosts: PostSummary[];
  worldCupPosts: PostSummary[];
  worldPosts: PostSummary[];
  crossStraitPosts: PostSummary[];
  lifestylePosts: PostSummary[];
  immigrationPosts: PostSummary[];
  popularPosts: PostSummary[];
}

const SECTIONS = [
  { title: '世界盃', slug: 'world-cup', color: '#2e7d32' },
  { title: '國際', slug: 'world', color: '#1565c0' },
  { title: '兩岸', slug: 'cross-strait', color: '#c62828' },
  { title: '華人生活', slug: 'lifestyle', color: '#e65100' },
  { title: '移民留學', slug: 'immigration-study', color: '#6a1b9a' },
] as const;

export function HomeClient({
  featuredPosts,
  worldCupPosts,
  worldPosts,
  crossStraitPosts,
  lifestylePosts,
  immigrationPosts,
  popularPosts,
}: HomeClientProps) {
  const { timezone } = useTimezone();

  const sectionPosts = [
    worldCupPosts,
    worldPosts,
    crossStraitPosts,
    lifestylePosts,
    immigrationPosts,
  ];

  return (
    <>
      <HeroCarousel posts={featuredPosts} timezone={timezone} />

      <div className="mt-10 grid gap-0 lg:grid-cols-[1fr_320px] lg:gap-10">
        {/* 左侧：各分区 */}
        <div>
          {SECTIONS.map((section, i) => (
            <SectionRow
              key={section.slug}
              title={section.title}
              slug={section.slug}
              posts={sectionPosts[i]}
              timezone={timezone}
              color={section.color}
            />
          ))}
        </div>

        {/* 右侧：热门排行 */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <PopularRanking posts={popularPosts} timezone={timezone} />
          </div>
        </aside>
      </div>
    </>
  );
}
