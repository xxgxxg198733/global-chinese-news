'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, Clock, Globe } from 'lucide-react';
import { NAV_ITEMS, SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useTimezone } from '@/hooks/useTimezone';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { timezone, toggleTimezone, label } = useTimezone();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* 頂欄：站點名稱 + 時區切換 */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <span className="text-xs text-gray-500">
            📰 全球視野 · 華人聲音
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTimezone}
              className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-red-600"
              title={`目前顯示${label}，點擊切換`}
            >
              <Clock className="h-3 w-3" />
              <span>{label}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 主導航欄 */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-red-600" />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              {SITE_NAME}
            </span>
          </Link>

          {/* 桌面導航 */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'nav-link rounded-md px-3 py-2',
                    isActive && 'active'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 搜尋 + 手機漢堡選單 */}
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title="搜尋新聞"
            >
              <Search className="h-5 w-5" />
            </Link>

            {/* 手機選單按鈕 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 lg:hidden"
              aria-label="選單"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 手機導航選單 */}
      {mobileMenuOpen && (
        <nav className="border-t border-gray-200 bg-white lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block rounded-md px-4 py-3 text-base font-medium transition-colors',
                    isActive
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
