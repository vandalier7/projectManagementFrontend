'use client';

import useSWR from 'swr';
import type { ApiError } from '@/lib/api';
import type { Project, ProjectSummary } from '@/types';

/** SWR cache keys for project data — import these instead of retyping paths. */
export const projectKeys = {
	list: '/projects',
	detail: (id: number | string) => `/projects/${id}`,
	heartbeat: (id: number | string) => `/projects/${id}/heartbeat`,
	members: (id: number | string) => `/projects/${id}/members`,
};

/**
 * One project with its tasks (incl. revision chains) and members.
 *
 * Every board page (board, timeline, members, dashboard, settings) uses this
 * same hook and therefore the same cache entry, so switching tabs doesn't
 * refetch the project.
 */
export function useProject(id: number | string | null | undefined) {
	return useSWR<Project, ApiError>(id != null ? projectKeys.detail(id) : null);
}

/** Projects the current user can see (admins: all; members: their own). */
export function useProjects(enabled = true) {
	return useSWR<ProjectSummary[], ApiError>(enabled ? projectKeys.list : null);
}
