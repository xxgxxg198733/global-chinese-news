import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getSoftwareByCategory } from '@/lib/data';
import { CATEGORIES, SITE_NAME } from '@/lib/constants';
import { CategoryClient } from './CategoryClient';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cat = CATEGORIES.find(c => c.slug === params.slug);
  if (!cat) return { title: 'Category Not Found' };
  const count = getSoftwareByCategory(params.slug).length;
  return { title: `${cat.name} Software Downloads (${count} apps) | ${SITE_NAME}`, description: `Download ${cat.name.toLowerCase()} software. ${count} free apps available.` };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = CATEGORIES.find(c => c.slug === params.slug);
  if (!cat) notFound();
  const allSoftware = getSoftwareByCategory(params.slug);
  return <CategoryClient category={cat} software={allSoftware} />;
}
