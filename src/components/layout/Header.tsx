'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, Download } from 'lucide-react';
import { NAV_ITEMS, SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-16">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
          <Download className="h-6 w-6" />
          {SITE_NAME}
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn('px-3 py-2 rounded-md text-sm font-medium transition-colors', active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50')}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/search" className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100" title="搜索软件">
            <Search className="h-5 w-5" />
          </Link>
          <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t bg-white px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={cn('block px-4 py-2.5 rounded-md text-sm font-medium', pathname === item.href ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50')}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
