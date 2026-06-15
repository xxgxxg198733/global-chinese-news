import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { getSoftwareBySlug } from '@/lib/data';
import { DetailClient } from './DetailClient';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const sw = getSoftwareBySlug(params.slug);
  if (!sw) return { title: '软件不存在' };
  return { title: `${sw.name} v${sw.version} 下载`, description: sw.description };
}

export default function SoftwarePage({ params }: { params: { slug: string } }) {
  const sw = getSoftwareBySlug(params.slug);
  if (!sw) notFound();
  return <DetailClient sw={sw} />;
}
