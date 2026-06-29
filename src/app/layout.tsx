  import type { Metadata } from "next";
  import { Geist, Geist_Mono } from "next/font/google";
  import "./globals.css";
  import { SWRProvider } from '@/lib/swr-provider';
  // import '@/styles/tokens.css';

  const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
  });

  const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
  });

  export const metadata: Metadata = {
    title: 'ProjectDashboard',
    description: 'Project and task management',
  };

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="en">
        <body>
          <SWRProvider>{children}</SWRProvider>
        </body>
      </html>
    );
  }
  
