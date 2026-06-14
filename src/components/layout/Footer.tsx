import Link from 'next/link';
import { Globe } from 'lucide-react';
import { FOOTER_LINKS, SITE_NAME, NAV_ITEMS } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* 上層：LOGO + 連結 */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* 品牌 */}
          <div>
            <div className="flex items-center gap-2">
              <Globe className="h-6 w-6 text-red-600" />
              <span className="text-lg font-bold text-gray-900">{SITE_NAME}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              即時、客觀、全面的華人新聞報導平台。
              <br />
              涵蓋國際要聞、兩岸關係、華人社區生活與移民留學資訊。
            </p>
          </div>

          {/* 新聞分類 */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">新聞分類</h3>
            <ul className="space-y-2">
              {NAV_ITEMS.filter((item) => item.href !== '/').map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-600 transition-colors hover:text-red-600"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 法律與聯絡 */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">法律與聯絡</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 transition-colors hover:text-red-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 分隔線 */}
        <div className="mt-10 border-t border-gray-200 pt-6">
          {/* 版權聲明 + 侵權提示 */}
          <div className="text-center text-xs text-gray-500">
            <p>© {currentYear} {SITE_NAME} 版權所有。</p>
            <p className="mt-1">
              本站部分內容來源於網路，如有侵權，請透過
              <Link
                href="/takedown"
                className="mx-1 text-red-600 underline underline-offset-2 hover:text-red-700"
              >
                侵權刪除頁面
              </Link>
              與我們聯繫，我們將在 48 小時內處理。
            </p>
            <p className="mt-1">
              本網站使用 WordPress Headless CMS 與 Next.js 建置，託管於 Vercel。
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
