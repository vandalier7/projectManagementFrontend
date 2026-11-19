import { daysUntil } from '@/lib/dates';
import type { DashboardTask, TaskPriority, TaskStatus } from '@/types';

/**
 * "Prioritized Tasks" ranking — lower comes first:
 *   0 overdue, 1 due today, 2 high priority, 3 due within a week,
 *   4 medium priority, 5 everything else, 6 no due date.
 */
export function priorityRank(task: DashboardTask): number {
	if (!task.due_date) return 6;

	const diff = daysUntil(task.due_date);
	if (diff < 0) return 0;
	if (diff === 0) return 1;
	if (task.priority === 'high') return 2;
	if (diff <= 7) return 3;
	if (task.priority === 'medium') return 4;
	return 5;
}

/** Top N active tasks by priorityRank, then by due date. */
export function topPriorityTasks(tasks: DashboardTask[], limit = 3): DashboardTask[] {
	return tasks
		.filter(t => t.status === 'todo' || t.status === 'in_progress')
		.sort((a, b) => {
			const rankDiff = priorityRank(a) - priorityRank(b);
			if (rankDiff !== 0) return rankDiff;
			if (!a.due_date || !b.due_date) return 0;
			return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
		})
		.slice(0, limit);
}

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
const STATUS_ORDER: Record<TaskStatus, number> = { todo: 0, in_progress: 1, submitted: 2, closed: 3, done: 4 };

/** Done tasks stay visible (greyed out) for this long after completion. */
export const DONE_RETENTION_MS = 96 * 60 * 60 * 1000;

export function isExpiredDone(task: DashboardTask, now = Date.now()): boolean {
	return task.status === 'done' && task.completed_date != null && now - new Date(task.completed_date).getTime() > DONE_RETENTION_MS;
}

/** General (system project) list: done last, then by priority, then status. */
export function sortGeneralTasks(tasks: DashboardTask[]): DashboardTask[] {
	return tasks
		.filter(t => !isExpiredDone(t))
		.sort((a, b) => {
			if (a.status === 'done' && b.status !== 'done') return 1;
			if (b.status === 'done' && a.status !== 'done') return -1;
			const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
			return byPriority !== 0 ? byPriority : STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
		});
}
