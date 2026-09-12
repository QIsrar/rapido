import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/bottom-nav';
import { OfflineManager } from '@/components/offline-manager';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://rapido-henna.vercel.app'),
  title: 'Rapido — Construction Job-Costing & Expense Tracker',
  description:
    'Track project budgets, log construction expenses, snap receipts, and audit site costs in PKR. Engineered by QI Tyrix.',
  openGraph: {
    title: 'Rapido — Construction Job-Costing & Expense Tracker',
    description:
      'Track project budgets, log construction expenses, snap receipts, and audit site costs in PKR. Engineered by QI Tyrix.',
    url: 'https://rapido-henna.vercel.app',
    siteName: 'Rapido Construction',
    images: [
      {
        url: '/og-image.jpg',
        width: 1024,
        height: 1024,
        alt: 'Rapido Construction Logo',
      },
    ],
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rapido — Construction Job-Costing & Expense Tracker',
    description:
      'Track project budgets, log construction expenses, snap receipts, and audit site costs in PKR. Engineered by QI Tyrix.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Rapido',
  },
};

export const viewport: Viewport = {
  themeColor: '#F97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <OfflineManager />
        {/* Main scrollable area with bottom padding for nav */}
        <main className="flex-1 pb-20">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
