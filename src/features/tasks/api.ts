import { apiClient } from '@/lib/api';
import type { DashboardTask, TaskBase, TaskPriority, TaskStatus } from '@/types';

/**
 * Typed wrappers for every /tasks endpoint.
 *
 * None of these send a user id: the API acts as whoever owns the auth token.
 */

export const taskKeys = {
	mine: '/tasks/mine',
	system: '/projects/system/tasks',
	history: (id: number) => `/tasks/${id}/history`,
};

/** The raw task row returned by create/update (no relations loaded). */
export interface TaskRecord extends Omit<TaskBase, 'assignee'> {
	project_id: number;
	assigned_to: number | null;
	previous_task_id: number | null;
}

export interface CreateTaskInput {
	project_id: number;
	title: string;
	description: string | null;
	assigned_to: number | null;
	priority: TaskPriority;
	requires_submission: boolean;
	due_date: string | null;
	notify_all: boolean;
}

export interface EditTaskInput {
	title: string;
	description: string | null;
	assigned_to: number | null;
	priority: TaskPriority;
	due_date: string | null;
}

export interface RejectTaskInput {
	review_comment: string;
	new_title: string;
	new_description: string | null;
	new_assigned_to: number | null;
	new_priority: TaskPriority;
	new_due_date: string | null;
}

/** Status changes — the lifecycle engine on the server decides if they're allowed. */
export type TransitionInput =
	| { status: Extract<TaskStatus, 'in_progress' | 'done'> }
	| { status: 'submitted'; submission_link: string; submission_notes: string | null };

const put = <T>(id: number, body: object) =>
	apiClient<T>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const taskApi = {
	create: (input: CreateTaskInput) =>
		apiClient<TaskRecord>('/tasks', { method: 'POST', body: JSON.stringify(input) }),

	edit: (id: number, input: EditTaskInput) => put<TaskRecord>(id, input),

	transition: (id: number, input: TransitionInput) => put<TaskRecord>(id, input),

	/** Closes the submitted task and creates a linked revision. */
	reject: (id: number, input: RejectTaskInput) =>
		put<{ closed_task: TaskRecord; revision_task: TaskRecord }>(id, { status: 'closed', ...input }),

	remove: (id: number) => apiClient<null>(`/tasks/${id}`, { method: 'DELETE' }),

	reorder: (orderedIds: number[]) =>
		apiClient<{ message: string }>('/tasks/reorder', {
			method: 'POST',
			body: JSON.stringify({ ordered_ids: orderedIds }),
		}),

	/** The revision chain behind a task, newest first. */
	history: (id: number) =>
		apiClient<{ history: Omit<DashboardTask, 'project' | 'project_lead_id' | 'previous_task'>[] }>(
			taskKeys.history(id)
		),
};
