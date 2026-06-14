'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFormProps {
  /** 初始搜尋關鍵字 */
  initialQuery?: string;
  /** 搜尋框大小 */
  size?: 'default' | 'large';
}

export function SearchForm({ initialQuery = '', size = 'default' }: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;

      const params = new URLSearchParams();
      params.set('q', trimmed);
      router.push(`/search?${params.toString()}`);
    },
    [query, router]
  );

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <Search
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 text-gray-400',
            size === 'large' ? 'h-5 w-5' : 'h-4 w-4'
          )}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋新聞..."
          className={cn(
            'w-full rounded-full border border-gray-300 bg-white pr-12 text-gray-900 placeholder-gray-400 transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100',
            size === 'large'
              ? 'py-3.5 pl-12 text-base'
              : 'py-2.5 pl-10 text-sm'
          )}
          autoComplete="off"
          autoFocus={size === 'large'}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-red-600 p-2 text-white transition-colors hover:bg-red-700"
          aria-label="搜尋"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
