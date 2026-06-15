import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { ReviewsClient } from './ReviewsClient';

export const metadata: Metadata = { title: `User Reviews & Ratings | ${SITE_NAME}`, description: 'Read and write reviews for software. 2000+ honest user reviews.' };

export default function ReviewsPage() {
  return <ReviewsClient />;
}
