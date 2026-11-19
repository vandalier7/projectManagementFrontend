import type { ReactNode } from 'react';
import { Check, Circle, Stars } from 'lucide-react';
import { priorityStyle } from '@/features/tasks';
import { formatDueShort } from '@/lib/dates';
import type { DashboardTask } from '@/types';

/** Dashboard widgets use the theme-derived priority colours. */
const DASHBOARD_PALETTE = 'theme' as const;

function StatusIcon({ status, className }: { status: DashboardTask['status']; className: string }) {
	switch (status) {
		case 'todo':
			return <Stars size={14} className={className} fill="currentColor" />;
		case 'in_progress':
			return <Circle size={14} className={className} fill="currentColor" />;
		case 'done':
			return <Check size={14} className={className} />;
		default:
			return null;
	}
}

/**
 * Compact task row for dashboard widgets: title, short due label, a status
 * icon, and a caller-provided footer (project name or assignee).
 *
 * The left bar uses the priority colour, or red when due today/overdue. Done
 * tasks are greyed out and never show as urgent.
 */
export default function DashboardTaskCard({
	task,
	footer,
	onClick,
}: {
	task: DashboardTask;
	footer: ReactNode;
	onClick: () => void;
}) {
	const isDone = task.status === 'done';
	const priority = priorityStyle(task.priority, DASHBOARD_PALETTE);
	const due = formatDueShort(task.due_date);
	const urgent = due.urgent && !isDone;

	return (
		<div
			onClick={onClick}
			className={`${urgent ? 'border border-l-4 border-danger' : `border border-border border-l-4 ${priority.bar}`} relative flex h-14 shrink-0 cursor-pointer flex-col gap-1.5 rounded p-2.5 shadow-sm transition-all duration-150 hover:border-accent/40 hover:shadow-md ${
				isDone ? 'grayscale opacity-90' : ''
			}`}
		>
			<div className="flex items-start justify-between gap-2">
				<span className="truncate text-sm font-medium leading-tight text-text">{task.title}</span>
				<div className="flex shrink-0 items-center gap-1.5">
					{!isDone && (
						<span className={`whitespace-nowrap font-mono text-xs ${urgent ? 'text-danger' : 'text-muted'}`}>{due.label}</span>
					)}
					{/* The icon follows the bar colour, including the red override. */}
					<StatusIcon status={task.status} className={urgent ? 'text-danger' : priority.text} />
				</div>
			</div>

			<div className="flex items-center gap-1.5 text-xs text-muted">{footer}</div>
		</div>
	);
}
