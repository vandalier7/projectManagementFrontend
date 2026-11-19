'use client';

import useSWR from 'swr';
import type { ApiError } from '@/lib/api';
import type { AnyTask, DashboardTask, Task } from '@/types';
import { taskApi, taskKeys } from '../api';
import { flattenRevisionChain } from '../lib/revisions';

/**
 * Where a task's revision history comes from:
 *  - 'nested': already on the task (board payload has previous_task chains)
 *  - 'fetch':  loaded on demand from /tasks/{id}/history (dashboard payloads omit it)
 *  - 'none':   the task can't have history (e.g. system project tasks)
 */
export type HistorySource = 'nested' | 'fetch' | 'none';

export interface TaskHistory {
	/** Older revisions, newest first. Excludes the task itself. */
	revisions: AnyTask[];
	loading: boolean;
	error: string | null;
}

export function useTaskHistory(task: AnyTask, source: HistorySource): TaskHistory {
	const { data, error, isLoading } = useSWR<AnyTask[], ApiError>(
		source === 'fetch' ? taskKeys.history(task.id) : null,
		async () => {
			const { history } = await taskApi.history(task.id);
			const project = 'project' in task ? task.project : null;
			const projectLeadId = 'project_lead_id' in task ? task.project_lead_id : null;
			return history.map<DashboardTask>(entry => ({
				...entry,
				previous_task: null,
				project,
				project_lead_id: projectLeadId,
			}));
		},
		{ refreshInterval: 0 }
	);

	if (source === 'nested') {
		return { revisions: flattenRevisionChain(task as Task), loading: false, error: null };
	}

	if (source === 'fetch') {
		return { revisions: data ?? [], loading: isLoading, error: error?.message ?? null };
	}

	return { revisions: [], loading: false, error: null };
}
