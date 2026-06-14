import type { PostSummary, TimezoneMode } from '@/lib/types';
import { PostCard } from './PostCard';

interface RelatedPostsProps {
  posts: PostSummary[];
  timezone: TimezoneMode;
}

export function RelatedPosts({ posts, timezone }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-5 w-1 rounded-full bg-red-600" />
        <h2 className="text-xl font-bold text-gray-900">相關文章</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} timezone={timezone} variant="default" />
        ))}
      </div>
    </section>
  );
}
