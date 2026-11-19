import { daysSince, daysUntil } from '@/lib/dates';
import type { TaskStatus } from '@/types';

interface TaskLike {
	status: TaskStatus;
	due_date: string | null;
}

export interface TaskOverview {
	active: number;
	overdue: number;
	done: number;
}

const ACTIVE: TaskStatus[] = ['todo', 'in_progress', 'submitted'];
const NOT_OVERDUE: TaskStatus[] = ['submitted', 'done', 'closed'];

export function taskOverview(tasks: TaskLike[]): TaskOverview {
	return {
		active: tasks.filter(t => ACTIVE.includes(t.status)).length,
		overdue: tasks.filter(t => t.due_date && !NOT_OVERDUE.includes(t.status) && daysUntil(t.due_date) < 0).length,
		done: tasks.filter(t => t.status === 'done').length,
	};
}

/** Spent as a percentage of budget, capped at 100. 0 when there's no budget. */
export function budgetPercent(budget: string | null, spent: string | null): number {
	const total = Number(budget ?? 0);
	if (!total) return 0;
	return Math.min(100, Math.round((Number(spent ?? 0) / total) * 100));
}

export function runningDays(startDate: string | null): number | null {
	return startDate ? daysSince(startDate) : null;
}

export function formatMoney(value: string | null): string {
	return Number(value ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
