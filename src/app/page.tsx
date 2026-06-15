import { Suspense } from 'react';
import { getStickyOrLatestPosts, getPostsByCategory, getPopularPosts } from '@/lib/wordpress';
import { INDEX_REVALIDATE } from '@/lib/constants';
import { HomeClient } from './HomeClient';

export const revalidate = INDEX_REVALIDATE;

export default async function HomePage() {
  const [featuredPosts, worldCup, world, crossStrait, lifestyle, immigration, popularPosts] =
    await Promise.all([
      getStickyOrLatestPosts(5),
      getPostsByCategory('world-cup', 4),
      getPostsByCategory('world', 4),
      getPostsByCategory('cross-strait', 4),
      getPostsByCategory('lifestyle', 4),
      getPostsByCategory('immigration-study', 4),
      getPopularPosts(10),
    ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeClient
          featuredPosts={featuredPosts}
          worldCupPosts={worldCup.nodes}
          worldPosts={world.nodes}
          crossStraitPosts={crossStrait.nodes}
          lifestylePosts={lifestyle.nodes}
          immigrationPosts={immigration.nodes}
          popularPosts={popularPosts}
        />
      </Suspense>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="aspect-[21/9] min-h-[360px] rounded-xl bg-gray-200" />
      <div className="h-64 rounded-xl bg-gray-100" />
      <div className="h-64 rounded-xl bg-gray-100" />
    </div>
  );
}
