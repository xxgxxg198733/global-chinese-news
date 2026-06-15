import { Metadata } from 'next';
import Link from 'next/link';
import { Eye, ChevronRight, Lightbulb } from 'lucide-react';
import { SITE_NAME } from '@/lib/constants';
import tips from '@/app/api/tips-data.json';

export const metadata: Metadata = { title: `Software Tips & Tricks | ${SITE_NAME}` };

export default function TipsPage() {
  const cats = [...new Set(tips.map((t:any)=>t.category))] as string[];
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Software Tips & Tricks</h1>
      <p className="text-gray-500 mb-6">200 practical tips to use your software better. Step-by-step guides, no fluff.</p>
      {cats.map(cat => (
        <div key={cat} className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-500"/>{cat}</h2>
          <div className="space-y-1.5">
            {tips.filter((t:any)=>t.category===cat).map((t:any) => (
              <Link key={t.id} href={`/tips/${t.id}`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group">
                <span className="text-xs text-gray-400 w-12 shrink-0">{t.date}</span>
                <span className="flex-1 text-sm text-gray-700 group-hover:text-blue-600 truncate">{t.title}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1"><Eye className="h-3 w-3"/>{t.views.toLocaleString()}</span>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 shrink-0"/>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
