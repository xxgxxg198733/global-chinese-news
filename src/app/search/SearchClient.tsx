'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Download, Monitor, Apple, X } from 'lucide-react';
import { searchSoftware, SOFTWARE_LIST, getSoftwareByCategory, getSoftwareByPlatform } from '@/lib/data';

const pIcons: Record<string, any> = { windows: Monitor, mac: Apple };
const catNames: Record<string, string> = { system:'系统工具', office:'办公软件', dev:'开发工具', security:'安全防护', media:'多媒体', network:'网络工具' };

export function SearchClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(params.get('q') || '');
  const [results, setResults] = useState(query ? searchSoftware(query) : []);

  useEffect(() => {
    const q = params.get('q') || '';
    setQuery(q);
    setResults(q ? searchSoftware(q) : []);
  }, [params]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">搜索软件</h1>

      <form onSubmit={handleSearch} className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索软件名称、功能或分类..." autoFocus
          className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        {query && (
          <button type="button" onClick={() => { setQuery(''); router.push('/search'); }}
            className="absolute right-16 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
        <button type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm">
          搜索
        </button>
      </form>

      {params.get('q') && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            搜索 &quot;{params.get('q')}&quot; — 找到 {results.length} 款软件
          </p>
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((sw) => (
                <Link key={sw.id} href={`/software/${sw.slug}`}
                  className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all">
                  <span className="text-2xl">{sw.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{sw.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{sw.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>v{sw.version}</span><span>{sw.size}</span>
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{catNames[sw.category] || sw.category}</span>
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-blue-600" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Search className="h-12 w-12 mx-auto mb-3" />
              <p>未找到匹配的软件</p>
              <p className="text-sm mt-1">尝试其他关键词搜索</p>
            </div>
          )}
        </div>
      )}

      {!params.get('q') && (
        <div className="grid gap-3 md:grid-cols-2">
          {SOFTWARE_LIST.map((sw) => (
            <Link key={sw.id} href={`/software/${sw.slug}`}
              className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-100 hover:bg-blue-50/30 transition-all">
              <span className="text-xl">{sw.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900">{sw.name}</span>
                <span className="ml-2 text-xs text-gray-400">v{sw.version}</span>
              </div>
              <span className="text-xs text-gray-400">{catNames[sw.category] || sw.category}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
