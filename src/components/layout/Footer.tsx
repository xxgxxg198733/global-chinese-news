import Link from 'next/link';
import { Download } from 'lucide-react';
import { FOOTER_LINKS, SITE_NAME } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-lg font-bold text-gray-700">
            <Download className="h-5 w-5 text-blue-600" />
            {SITE_NAME}
          </div>
          <div className="flex gap-6">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-gray-500 hover:text-blue-600">
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} {SITE_NAME}. 本站不存储任何文件，所有软件均来自官方或可信源。
          </p>
        </div>
      </div>
    </footer>
  );
}
