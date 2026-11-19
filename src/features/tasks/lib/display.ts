import type { TaskPriority, TaskStatus } from '@/types';

/**
 * Presentation constants for tasks — one place for labels and colours that
 * used to be copied into every component.
 */

export const STATUS_LABEL: Record<TaskStatus, string> = {
	todo: 'To Do',
	in_progress: 'In Progress',
	submitted: 'Submitted',
	done: 'Done',
	closed: 'Closed',
};

export const STATUS_CHIP: Record<TaskStatus, string> = {
	todo: 'bg-gray-100 text-muted',
	in_progress: 'bg-blue-50 text-blue-800',
	submitted: 'bg-yellow-50 text-yellow-800',
	done: 'bg-green-100 text-green-800',
	closed: 'bg-gray-100 text-muted',
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
	high: 'High',
	medium: 'Medium',
	low: 'Low',
};

export const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high'];

/** Statuses after which a task is no longer active work. */
export const FINISHED_STATUSES: TaskStatus[] = ['done', 'closed'];

/** Statuses in which a lead can no longer edit details (admins still can). */
export const LOCKED_STATUSES: TaskStatus[] = ['submitted', 'done', 'closed'];

/**
 * Two colour schemes for priority:
 *  - 'fixed': Red-orange / Yellow / Green, independent of project theme (board)
 *  - 'theme': derived from the project's accent colour (dashboard widgets)
 */
export type PriorityPalette = 'fixed' | 'theme';

interface PriorityStyle {
	/** Left border colour for cards. */
	bar: string;
	/** Text colour for icons. */
	text: string;
	/** Outlined chip. */
	chip: string;
}

const PRIORITY_STYLES: Record<PriorityPalette, Record<TaskPriority, PriorityStyle>> = {
	fixed: {
		high: { bar: 'border-l-[#ff4d1c]', text: 'text-[#ff4d1c]', chip: 'bg-black/1 text-[#ff4d1c] border border-[#ff4d1c]' },
		medium: { bar: 'border-l-[#f5c518]', text: 'text-[#f5c518]', chip: 'bg-black/1 text-[#f5c518] border border-[#f5c518]' },
		low: { bar: 'border-l-[#2e9e44]', text: 'text-[#2e9e44]', chip: 'bg-black/1 text-[#2e9e44] border border-[#2e9e44]' },
	},
	theme: {
		high: { bar: 'border-l-accent', text: 'text-accent', chip: 'bg-surface text-accent border border-accent' },
		medium: { bar: 'border-l-accent-hover', text: 'text-accent-hover', chip: 'bg-surface text-accent-hover border border-accent-hover' },
		low: { bar: 'border-l-muted', text: 'text-muted', chip: 'bg-surface text-muted border border-muted' },
	},
};

const FALLBACK_STYLE: PriorityStyle = { bar: 'border-l-border', text: 'text-muted', chip: 'bg-gray-100 text-muted' };

export function priorityStyle(priority: string, palette: PriorityPalette): PriorityStyle {
	return PRIORITY_STYLES[palette][priority as TaskPriority] ?? FALLBACK_STYLE;
}
