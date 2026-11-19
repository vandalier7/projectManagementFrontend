import { Check, X } from 'lucide-react';
import type { TaskStatus } from '@/types';
import { PRIORITY_LABEL, STATUS_CHIP, STATUS_LABEL, priorityStyle, type PriorityPalette } from '../lib/display';

const CHIP = 'font-mono text-xs tracking-wide px-2 py-0.5 rounded self-start';

export function StatusChip({ status }: { status: TaskStatus }) {
	return <span className={`${CHIP} ${STATUS_CHIP[status] ?? 'bg-gray-100 text-muted'}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export function PriorityChip({ priority, palette }: { priority: string; palette: PriorityPalette }) {
	return (
		<span className={`${CHIP} ${priorityStyle(priority, palette).chip}`}>
			{PRIORITY_LABEL[priority as keyof typeof PRIORITY_LABEL] ?? priority}
		</span>
	);
}

const BADGE = 'inline-flex shrink-0 items-center gap-1 text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-full border select-none whitespace-nowrap';
const BADGE_ON = 'bg-green-50 text-green-700 border-green-200';
const BADGE_OFF = 'bg-gray-100 text-muted border-gray-200';

/** "Submission Required / Not Required" pill. Becomes a toggle when onToggle is given. */
export function SubmissionBadge({
	required,
	onToggle,
	frozen = false,
	title,
	labels = { on: 'Submission Required', off: 'Submission Not Required' },
}: {
	required: boolean;
	onToggle?: () => void;
	frozen?: boolean;
	title?: string;
	labels?: { on: string; off: string };
}) {
	const content = required
		? <><Check size={10} strokeWidth={2.5} /> {labels.on}</>
		: <><X size={10} strokeWidth={2.5} /> {labels.off}</>;
	const className = `${BADGE} ${required ? BADGE_ON : BADGE_OFF}`;

	if (!onToggle) {
		return <span className={`${className} cursor-default`} title={title}>{content}</span>;
	}

	return (
		<button
			type="button"
			className={`${className} ${frozen ? 'cursor-default' : 'cursor-pointer'}`}
			onClick={() => !frozen && onToggle()}
			title={title}
			aria-pressed={required}
		>
			{content}
		</button>
	);
}
