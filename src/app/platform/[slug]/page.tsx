import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Download, Monitor, Apple, Smartphone } from 'lucide-react';
import { getSoftwareByPlatform } from '@/lib/data';
import { SITE_NAME } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';

const platInfo: Record<string, { name: string; icon: any }> = {
  windows: { name: 'Windows', icon: Monitor },
  mac: { name: 'macOS', icon: Apple },
  android: { name: 'Android', icon: Smartphone },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = platInfo[params.slug];
  if (!p) return { title: '平台不存在' };
  return { title: `${p.name} 软件下载 | ${SITE_NAME}` };
}

export default function PlatformPage({ params }: { params: { slug: string } }) {
  const p = platInfo[params.slug];
  if (!p) notFound();
  const list = getSoftwareByPlatform(params.slug);
  const Icon = p.icon;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Icon className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{p.name} 软件</h1>
          <p className="text-sm text-gray-500">共 {list.length} 款</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((sw) => (
          <Link key={sw.id} href={`/software/${sw.slug}`}
            className="group p-5 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
            <div className="flex items-start gap-4">
              <span className="text-3xl">{sw.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 truncate">{sw.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{sw.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Download className="h-3 w-3" />{formatNumber(sw.downloads)}</span>
                  <span>⭐ {sw.rating}</span>
                  <span>{sw.size}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
