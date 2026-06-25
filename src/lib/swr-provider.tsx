'use client';

import { SWRConfig } from 'swr';
import { Cache } from 'swr';
import { fetcher } from '@/lib/fetcher';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
  value={{
        provider: localStorageProvider,
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

function localStorageProvider(): Cache {
	if (typeof window === 'undefined') return new Map();

	const map = new Map<string, any>(
		JSON.parse(localStorage.getItem('swr-cache') || '[]')
	);

	window.addEventListener('beforeunload', () => {
		localStorage.setItem('swr-cache', JSON.stringify(Array.from(map.entries())));
	});

	return map;
}