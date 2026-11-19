import type { UserSummary } from './user';

export type TaskStatus = 'todo' | 'in_progress' | 'submitted' | 'done' | 'closed';
export type TaskPriority = 'high' | 'medium' | 'low';

/** Fields every task payload carries, regardless of endpoint. */
export interface TaskBase {
	id: number;
	title: string;
	description: string | null;
	status: TaskStatus;
	priority: TaskPriority;
	requires_submission: boolean;
	sort_order: number;
	due_date: string | null;
	assignee: UserSummary | null;
	submission_link: string | null;
	submission_notes: string | null;
	submitted_at: string | null;
	review_comment: string | null;
	reviewed_at: string | null;
	completed_date: string | null;
}

/**
 * A task as it appears on a project board (GET /projects/{id}). The revision
 * chain is nested: previous_task → previous_task → … until null.
 */
export interface Task extends TaskBase {
	previous_task: Task | null;
}

/**
 * A task on the cross-project dashboard widgets (/tasks/mine,
 * /projects/system/tasks). Carries its own project, since each row can come
 * from a different one. The revision chain is fetched on demand instead.
 */
export interface DashboardTask extends TaskBase {
	previous_task: null;
	project: { id: number; name: string } | null;
	project_lead_id: number | null;
}

/** Any task the detail modal can show. */
export type AnyTask = Task | DashboardTask;
