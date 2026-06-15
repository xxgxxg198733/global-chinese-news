import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SITE_NAME, SITE_DESC, SITE_URL } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} - 安全高速软件下载`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESC,
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
