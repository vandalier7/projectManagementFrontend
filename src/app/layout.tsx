import type { Metadata } from "next";
import "./globals.css";
import { SWRProvider } from '@/lib/api/swr-provider';
import ThemeInit from '@/components/layout/ThemeInit';


// import '@/styles/tokens.css';

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
          <ThemeInit />
          <SWRProvider>{children}</SWRProvider>
      </body>
  </html>
  );
}

