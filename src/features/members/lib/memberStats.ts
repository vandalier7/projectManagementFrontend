import { daysUntil } from '@/lib/dates';
import type { Task } from '@/types';

export interface MemberStats {
	todo: number;
	inProgress: number;
	submitted: number;
	done: number;
	overdue: number;
}

export const EMPTY_STATS: MemberStats = { todo: 0, inProgress: 0, submitted: 0, done: 0, overdue: 0 };

/** Statuses where a past due date no longer counts as overdue. */
const NOT_OVERDUE: ReadonlySet<string> = new Set(['done', 'submitted', 'closed']);

/**
 * Task counts per assignee. Closed tasks (rejected submissions) are ignored —
 * their revision is counted instead. The project lead is excluded.
 */
export function statsByMember(tasks: Task[], leadId: number): Record<number, MemberStats> {
	const stats: Record<number, MemberStats> = {};

	for (const task of tasks) {
		if (!task.assignee || task.assignee.id === leadId || task.status === 'closed') continue;

		const s = (stats[task.assignee.id] ??= { ...EMPTY_STATS });

		if (task.status === 'todo') s.todo++;
		else if (task.status === 'in_progress') s.inProgress++;
		else if (task.status === 'submitted') s.submitted++;
		else if (task.status === 'done') s.done++;

		if (task.due_date && daysUntil(task.due_date) < 0 && !NOT_OVERDUE.has(task.status)) s.overdue++;
	}

	return stats;
}

/** Done as a percentage of all non-closed tasks, rounded. */
export function completionRate(s: MemberStats): number {
	const total = s.todo + s.inProgress + s.submitted + s.done;
	return total > 0 ? Math.round((s.done / total) * 100) : 0;
}
