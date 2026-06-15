'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Search, Download, ChevronDown } from 'lucide-react';
import { NAV_ITEMS, SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Header() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-16">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600 shrink-0">
          <Download className="h-6 w-6" />
          {SITE_NAME}
        </Link>

        {/* Search Bar — center */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={query} onChange={e=>setQuery(e.target.value)}
              placeholder="Search 3,800+ apps..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
          </div>
        </form>

        {/* A-Z Dropdown */}
        <div className="hidden lg:flex items-center gap-0.5 mr-2 group relative">
          <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-md hover:bg-gray-50">
            A-Z <ChevronDown className="h-3 w-3" />
          </button>
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 hidden group-hover:block hover:block w-[420px] z-50">
            <div className="grid grid-cols-9 gap-1">
              {ALPHABET.map(l => (
                <Link key={l} href={`/search?q=&letter=${l}`}
                  className="w-10 h-10 flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors">
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.slice(0,6).map((item) => (
            <Link key={item.href} href={item.href}
              className="px-2.5 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors">{item.label}</Link>
          ))}
          <Link href="/tips" className="px-2.5 py-2 rounded-md text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors">Tips</Link>
          <Link href="/guides" className="px-2.5 py-2 rounded-md text-sm font-medium text-green-600 hover:bg-green-50 transition-colors">Guides</Link>
          <Link href="/reviews" className="px-2.5 py-2 rounded-md text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors">Reviews</Link>
        </nav>

        <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile search */}
      <form onSubmit={handleSearch} className="md:hidden px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Search 3,800+ apps..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full" />
        </div>
      </form>

      {open && (
        <nav className="lg:hidden border-t bg-white px-4 py-3 space-y-1">
          {[...NAV_ITEMS, {label:'Reviews',href:'/reviews'}].map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50">{item.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
