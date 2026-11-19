'use client';

import { useMemo } from 'react';
import { useSetBoardTitleAdornment } from '@/components/layout/AppBarActionsContext';
import { useHeartbeat } from './useHeartbeat';

/**
 * Polls the project's heartbeat, refreshes when something changed, and shows
 * a "Syncing… / Up to date" indicator beside the board title.
 */
export function useProjectSyncIndicator(projectId: number | null, refresh: () => void, hidden = false) {
	const { syncStatus } = useHeartbeat(projectId, refresh);

	const indicator = useMemo(
		() => (
			<span className={`font-mono text-xs ${syncStatus === 'syncing' ? 'text-accent' : 'text-muted'}`}>
				{syncStatus === 'syncing' ? 'Syncing...' : 'Up to date'}
			</span>
		),
		[syncStatus]
	);

	useSetBoardTitleAdornment(hidden ? null : indicator);
}
