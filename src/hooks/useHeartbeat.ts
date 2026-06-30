import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

interface HeartbeatResponse {
	last_updated: string;
}

interface UseHeartbeatResult {
	syncStatus: 'up_to_date' | 'syncing' | 'idle';
}

export function useHeartbeat(
	projectId: number | string | null,
	onUpdate: () => void
): UseHeartbeatResult {
	const [syncStatus, setSyncStatus] = useState<'up_to_date' | 'syncing' | 'idle'>('idle');
	const lastSeenRef = useRef<string | null>(null);

	const { data } = useSWR<HeartbeatResponse>(
		projectId ? `/projects/${projectId}/heartbeat` : null,
		{ refreshInterval: 1000, revalidateOnFocus: false }
	);

	useEffect(() => {
		if (!data?.last_updated) return;

		// First load — just store the timestamp, don't trigger a sync.
		if (lastSeenRef.current === null) {
			lastSeenRef.current = data.last_updated;
			setSyncStatus('up_to_date');
			return;
		}

		// If timestamp changed, trigger a full refetch.
		if (data.last_updated !== lastSeenRef.current) {
			lastSeenRef.current = data.last_updated;
			setSyncStatus('syncing');
			onUpdate();

			// After a short delay, mark as up to date.
			const t = setTimeout(() => setSyncStatus('up_to_date'), 800);
			return () => clearTimeout(t);
		}
	}, [data, onUpdate]);

	return { syncStatus };
}