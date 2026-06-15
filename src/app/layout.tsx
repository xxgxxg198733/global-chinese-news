import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SITE_NAME, SITE_DESC, SITE_URL, DISCLAIMER } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} - Free Software Downloads`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESC,
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        {/* Site-wide disclaimer banner */}
        <div className="bg-amber-50 border-b border-amber-200 text-center py-2 px-4 text-xs text-amber-700">
          {DISCLAIMER}
        </div>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
