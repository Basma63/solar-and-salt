import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'إدارة السولار ومغسلة الملح',
  description: 'نظام إدارة السولار ومغسلة الملح',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-[Tajawal] antialiased">{children}</body>
    </html>
  );
}
