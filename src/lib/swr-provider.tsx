'use client';

import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/fetcher';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
        shouldRetryOnError: true,
        errorRetryCount: 2,
        onError: (error) => {
          console.error('SWR fetch error:', error.message);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}