import { Metadata } from 'next';
import Link from 'next/link';
import { Eye, ChevronRight, Gamepad2 } from 'lucide-react';
import { SITE_NAME } from '@/lib/constants';
import guides from '@/app/api/guides-data.json';

export const metadata: Metadata = { title: `Game Guides & Walkthroughs | ${SITE_NAME}` };

export default function GuidesPage() {
  const cats = [...new Set(guides.map((g:any)=>g.category))] as string[];
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Game Guides & Walkthroughs</h1>
      <p className="text-gray-500 mb-6">200 game tips and strategy guides. No spoilers, just useful tactics.</p>
      {cats.map(cat => (
        <div key={cat} className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2"><Gamepad2 className="h-5 w-5 text-green-500"/>{cat}</h2>
          <div className="space-y-1.5">
            {guides.filter((g:any)=>g.category===cat).map((g:any) => (
              <Link key={g.id} href={`/guides/${g.id}`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group">
                <span className="text-xs text-gray-400 w-12 shrink-0">{g.date}</span>
                <span className="flex-1 text-sm text-gray-700 group-hover:text-green-600 truncate">{g.title}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1"><Eye className="h-3 w-3"/>{g.views.toLocaleString()}</span>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-green-500 shrink-0"/>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
