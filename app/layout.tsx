import type React from 'react';
import '@/app/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: appConfig.title,
  description: appConfig.description,
  icons: {
    icon: '/favicon32.png',
  },
  // openGraph: {
  //   title: appConfig.title,
  //   description: appConfig.description,
  //   // url: appConfig.url,
  //   siteName: appConfig.title,
  //   images: '/blue-pilot-cover.png',
  //   locale: 'en_US',
  //   type: 'website',
  // },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: appConfig.title,
  //   description: appConfig.description,
  //   images: ['/blue-pilot-cover.png'],
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

import './globals.css';
import { appConfig } from '@/src/config';
