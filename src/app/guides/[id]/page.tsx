import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Clock, Tag, ArrowLeft } from 'lucide-react';
import { SITE_NAME } from '@/lib/constants';
import guides from '@/app/api/guides-data.json';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const g = (guides as any[]).find((x:any) => x.id === parseInt(params.id));
  if (!g) return { title: 'Guide Not Found' };
  return { title: `${g.title} | ${SITE_NAME}` };
}

export default function GuideDetail({ params }: { params: { id: string } }) {
  const g = (guides as any[]).find((x:any) => x.id === parseInt(params.id));
  if (!g) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-blue-600">Home</Link><ChevronRight className="h-3 w-3"/>
        <Link href="/guides" className="hover:text-blue-600">Guides</Link><ChevronRight className="h-3 w-3"/>
        <span className="text-gray-600 truncate">{g.title.slice(0,40)}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-4">{g.title}</h1>
      <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 pb-4 border-b">
        <span className="flex items-center gap-1"><Clock className="h-4 w-4"/>{g.date}</span>
        <span className="flex items-center gap-1"><Tag className="h-4 w-4"/>{g.category}</span>
        <span>{g.views.toLocaleString()} views</span>
      </div>

      <p className="text-gray-700 mb-6">{g.intro}</p>

      <div className="space-y-4 mb-8">
        {g.steps.map((s:string,i:number) => (
          <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">{i+1}</span>
            <p className="text-gray-700 pt-1">{s}</p>
          </div>
        ))}
      </div>

      <p className="text-gray-600 italic border-t pt-4">{g.conclusion}</p>

      <div className="mt-8 flex gap-4">
        <Link href="/guides" className="flex items-center gap-2 text-green-600 hover:underline text-sm"><ArrowLeft className="h-4 w-4"/> Back to All Guides</Link>
      </div>
    </div>
  );
}
