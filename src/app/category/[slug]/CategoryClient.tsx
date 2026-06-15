'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Download, Monitor, Apple, Star, TrendingUp, Clock, ArrowUpDown } from 'lucide-react';
import type { Software } from '@/lib/types';
import { CATEGORIES, SITE_NAME } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';

const ITEMS_PER_PAGE = 30;
const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const pIcons: Record<string, any> = { windows: Monitor, mac: Apple };

export function CategoryClient({ category, software }: { category: typeof CATEGORIES[0]; software: Software[] }) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'downloads'|'rating'|'date'|'name'>('downloads');
  const [platform, setPlatform] = useState<string>('all');
  const [letterFilter, setLetterFilter] = useState<string>('');

  const filtered = useMemo(() => {
    let list = [...software];
    if (platform !== 'all') list = list.filter(s => s.platform.includes(platform));
    if (letterFilter === '#') list = list.filter(s => /^[0-9]/.test(s.name));
    else if (letterFilter) list = list.filter(s => s.name.toUpperCase().startsWith(letterFilter));
    list.sort((a,b) => sortBy === 'downloads' ? b.downloads - a.downloads : sortBy === 'rating' ? b.rating - a.rating : sortBy === 'date' ? b.updateDate.localeCompare(a.updateDate) : a.name.localeCompare(b.name));
    return list;
  }, [software, platform, letterFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageItems = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  // Get top 10 by downloads for sidebar
  const top10 = [...software].sort((a,b) => b.downloads - a.downloads).slice(0,10);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-blue-600">Home</Link><ChevronRight className="h-3 w-3" />
        <span className="text-gray-700 font-medium">{category.icon} {category.name}</span>
        <span className="text-gray-400 ml-2">({filtered.length} apps)</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr_280px]">
        {/* Left Sidebar — Other Categories */}
        <aside className="hidden lg:block">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-20">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">All Categories</h3>
            <nav className="space-y-0.5">
              {CATEGORIES.map(c => (
                <Link key={c.id} href={`/category/${c.slug}`}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${c.slug === category.slug ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`}>
                  <span className="text-base">{c.icon}</span><span className="truncate">{c.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Center — Software List */}
        <div>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-gray-100">
            <span className="text-sm text-gray-500">Sort:</span>
            {[{k:'downloads',l:'Popular'},{k:'rating',l:'Rating'},{k:'date',l:'Latest'},{k:'name',l:'A-Z'}].map(s => (
              <button key={s.k} onClick={()=>{setSortBy(s.k as any);setPage(1)}}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${sortBy===s.k?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s.l}</button>
            ))}
            <span className="text-sm text-gray-400 ml-2">|</span>
            <span className="text-sm text-gray-500">Platform:</span>
            {[{k:'all',l:'All'},{k:'windows',l:'Win'},{k:'mac',l:'Mac'},{k:'linux',l:'Linux'},{k:'android',l:'Android'}].map(p => (
              <button key={p.k} onClick={()=>{setPlatform(p.k);setPage(1)}}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${platform===p.k?'bg-green-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p.l}</button>
            ))}
          </div>

          {/* A-Z Quick Nav */}
          <div className="flex flex-wrap gap-0.5 mb-4">
            {ALPHABET.map(l => {
              const count = software.filter(s => l==='#' ? /^[0-9]/.test(s.name) : s.name.toUpperCase().startsWith(l)).length;
              return (
                <button key={l} onClick={()=>{setLetterFilter(letterFilter===l?'':l);setPage(1)}}
                  className={`w-7 h-7 text-xs rounded flex items-center justify-center transition-colors ${letterFilter===l ? 'bg-blue-600 text-white' : count>0 ? 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border' : 'text-gray-300 cursor-default'}`}
                  disabled={count===0}>{l}</button>
              );
            })}
          </div>

          {/* Items */}
          {pageItems.length > 0 ? (
            <div className="space-y-2">
              {pageItems.map((sw, i) => (
                <Link key={sw.id} href={`/software/${sw.slug}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group">
                  <span className="text-xs text-gray-300 w-8 text-right font-mono">{(page-1)*ITEMS_PER_PAGE + i + 1}</span>
                  <span className="text-2xl">{sw.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 text-sm">{sw.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>v{sw.version}</span><span>{sw.size}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" />{sw.rating}</span>
                      <span className="flex items-center gap-0.5">{sw.platform.map(p=>{const I=pIcons[p]||Monitor;return <I key={p} className="h-3 w-3"/>;})}</span>
                      <span className="text-gray-300">{sw.updateDate}</span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-medium group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Download className="h-3 w-3" /> Download
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">No software found matching the filters.</div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-6">
              {Array.from({length:totalPages}, (_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<3).map((p,i,arr)=>(
                <span key={p}>
                  {i>0 && arr[i-1]!==p-1 && <span className="px-1 text-gray-300">...</span>}
                  <button onClick={()=>setPage(p)} className={`w-9 h-9 text-sm rounded-lg ${p===page?'bg-blue-600 text-white':'bg-white border text-gray-600 hover:bg-gray-50'}`}>{p}</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar — Top Downloads */}
        <aside className="hidden lg:block space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-20">
            <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-red-500"/> Top Downloads</h3>
            <ol className="space-y-1">
              {top10.map((sw,i) => (
                <li key={sw.id}>
                  <Link href={`/software/${sw.slug}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-gray-50 transition-colors">
                    <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${i<3?'bg-red-500 text-white':'bg-gray-100 text-gray-500'}`}>{i+1}</span>
                    <span className="truncate flex-1 text-gray-700 hover:text-blue-600">{sw.name}</span>
                    <span className="text-xs text-gray-400">{formatNumber(sw.downloads)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
