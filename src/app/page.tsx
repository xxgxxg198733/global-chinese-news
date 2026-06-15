import Link from 'next/link';
import { Download, Star, Monitor, Apple, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { CATEGORIES, SITE_NAME, DISCLAIMER } from '@/lib/constants';
import { SOFTWARE_LIST, getSoftwareByCategory } from '@/lib/data';
import { formatNumber } from '@/lib/utils';

function RankingsSection() {
  const top = [...SOFTWARE_LIST].sort((a,b)=>b.downloads-a.downloads).slice(0,20);
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-red-500"/> Most Downloaded</h3>
      <ol className="space-y-1.5">
        {top.map((sw,i) => (
          <li key={sw.id}>
            <Link href={`/software/${sw.slug}`}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded text-sm hover:bg-gray-50 transition-colors group">
              <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold shrink-0 ${i<3?'bg-red-500 text-white':i<10?'bg-gray-100 text-gray-500':'text-gray-400'}`}>{i+1}</span>
              <span className="text-lg shrink-0">{sw.icon}</span>
              <span className="truncate flex-1 text-gray-700 group-hover:text-blue-600 font-medium">{sw.name}</span>
              <span className="text-xs text-gray-400 shrink-0">{formatNumber(sw.downloads)}</span>
              <span className="text-amber-500 text-xs shrink-0">★{sw.rating}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

function LatestUpdatesSection() {
  const latest = [...SOFTWARE_LIST].sort((a,b)=>b.updateDate.localeCompare(a.updateDate)).slice(0,20);
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-blue-500"/> Latest Updates</h3>
      <div className="space-y-1.5">
        {latest.map((sw) => (
          <Link key={sw.id} href={`/software/${sw.slug}`}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded text-sm hover:bg-gray-50 transition-colors group">
            <span className="text-xs text-gray-400 w-16 shrink-0">{sw.updateDate}</span>
            <span className="text-lg shrink-0">{sw.icon}</span>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="truncate text-gray-700 group-hover:text-blue-600 font-medium">{sw.name}</span>
              <span className="text-xs text-gray-400 shrink-0">v{sw.version}</span>
            </div>
            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full shrink-0">New</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

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

      {/* Rankings + Latest Updates — ZOL-style two-column */}
      <div className="grid gap-6 lg:grid-cols-2 mb-12">
        <RankingsSection />
        <LatestUpdatesSection />
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
