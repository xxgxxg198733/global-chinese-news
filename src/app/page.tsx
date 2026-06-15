import Link from 'next/link';
import { Download, Star, Monitor, Apple, AlertTriangle } from 'lucide-react';
import { CATEGORIES, SITE_NAME, DISCLAIMER } from '@/lib/constants';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Free Software Downloads</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          3,800+ applications across 28 categories. Direct download links, no bundles, no ads, no malware.
        </p>
      </div>

      {/* Disclaimer box */}
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-10 max-w-3xl mx-auto">
        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">{DISCLAIMER}</p>
      </div>

      {/* All 28 Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {CATEGORIES.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-center">
              <span className="text-xl">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-700 leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Platform quick links */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Download by Platform</h2>
        <div className="grid grid-cols-3 gap-4">
          <Link href="/platform/windows"
            className="flex items-center gap-3 p-5 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
            <Monitor className="h-8 w-8 text-blue-600" />
            <div><div className="font-semibold text-gray-900">Windows</div><div className="text-sm text-gray-500">2,800+ apps</div></div>
          </Link>
          <Link href="/platform/mac"
            className="flex items-center gap-3 p-5 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
            <Apple className="h-8 w-8 text-gray-700" />
            <div><div className="font-semibold text-gray-900">macOS</div><div className="text-sm text-gray-500">1,500+ apps</div></div>
          </Link>
          <Link href="/platform/android"
            className="flex items-center gap-3 p-5 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
            <Monitor className="h-8 w-8 text-green-600" />
            <div><div className="font-semibold text-gray-900">Android</div><div className="text-sm text-gray-500">900+ apps</div></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
