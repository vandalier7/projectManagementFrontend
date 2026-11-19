import type { TaskStatus } from '@/types';
import { STATUS_LABEL } from '@/features/tasks';

/** Timeline node styles per status: the dot on the line and the label colour. */
export const TIMELINE_STATUS: Record<TaskStatus, { label: string; dot: string; text: string }> = {
	todo: { label: STATUS_LABEL.todo, dot: 'bg-surface border-2 border-muted', text: 'text-muted' },
	in_progress: { label: STATUS_LABEL.in_progress, dot: 'bg-surface border-2 border-blue-600', text: 'text-blue-600' },
	submitted: { label: STATUS_LABEL.submitted, dot: 'bg-surface border-2 border-yellow-600', text: 'text-yellow-600' },
	done: { label: STATUS_LABEL.done, dot: 'bg-accent border-2 border-accent', text: 'text-accent' },
	closed: { label: STATUS_LABEL.closed, dot: 'bg-danger border-2 border-danger', text: 'text-danger' },
};

/** "Mar 4" */
export function formatShortDate(value: string | null): string | null {
	return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
}
