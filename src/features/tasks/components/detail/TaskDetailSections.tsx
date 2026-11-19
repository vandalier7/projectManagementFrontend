import RichTextDisplay from '@/components/ui/RichTextDisplay';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { FieldLabel, TextInput } from '@/components/ui/Field';
import { formatLongDate } from '@/lib/dates';
import type { AnyTask } from '@/types';
import { type PriorityPalette } from '../../lib/display';
import { PriorityChip, StatusChip } from '../TaskChips';

/** The read-only sections of the task detail panel. */

function isOverdue(task: AnyTask): boolean {
	return (
		task.due_date != null &&
		!['submitted', 'done', 'closed'].includes(task.status) &&
		new Date(task.due_date) < new Date(new Date().toDateString())
	);
}

/** Status, priority, and due/completed date. */
export function TaskMetaGrid({ task, palette }: { task: AnyTask; palette: PriorityPalette }) {
	const showCompleted = task.status === 'done' && task.completed_date;
	const showDue = !showCompleted && task.status !== 'done' && task.due_date;
	const overdue = isOverdue(task);

	return (
		<div className={`grid gap-3 ${showCompleted || showDue ? 'grid-cols-3' : 'grid-cols-2'}`}>
			<div className="flex flex-col gap-1">
				<FieldLabel>Status</FieldLabel>
				<StatusChip status={task.status} />
			</div>

			<div className="flex flex-col gap-1">
				<FieldLabel>Priority</FieldLabel>
				<PriorityChip priority={task.priority} palette={palette} />
			</div>

			{showCompleted && (
				<div className="flex flex-col gap-1">
					<FieldLabel>Completed</FieldLabel>
					<span className="text-sm text-text">{formatLongDate(task.completed_date!)}</span>
				</div>
			)}

			{showDue && (
				<div className="flex flex-col gap-1">
					<FieldLabel className={overdue ? 'text-danger font-semibold' : 'text-muted'}>{overdue ? 'Overdue' : 'Due'}</FieldLabel>
					<span className={`text-sm ${overdue ? 'text-danger font-medium' : 'text-text'}`}>{formatLongDate(task.due_date!)}</span>
				</div>
			)}
		</div>
	);
}

export function TaskDescription({ html }: { html: string | null }) {
	if (!html) return null;

	return (
		<div className="flex flex-col gap-1.5">
			<FieldLabel>Description</FieldLabel>
			<div className="bg-bg border border-border rounded px-3 py-2">
				<RichTextDisplay html={html} />
			</div>
		</div>
	);
}

export function ReviewComment({ comment }: { comment: string | null }) {
	if (!comment) return null;

	return (
		<div className="flex flex-col gap-1.5 bg-yellow-50 border border-yellow-200 rounded p-3">
			<FieldLabel>Review Comment</FieldLabel>
			<p className="text-sm text-text m-0 leading-relaxed">{comment}</p>
		</div>
	);
}

/** What the assignee submitted for review. */
export function SubmissionDetails({ task }: { task: AnyTask }) {
	if (!task.submission_link) return null;

	return (
		<div className="flex flex-col gap-1.5">
			<FieldLabel>Submitted{task.submitted_at ? ` on ${formatLongDate(task.submitted_at)}` : ''}</FieldLabel>
			<a
				className="font-mono text-xs text-accent break-all no-underline hover:underline"
				href={task.submission_link}
				target="_blank"
				rel="noreferrer"
			>
				{task.submission_link}
			</a>
			{task.submission_notes && <RichTextDisplay html={task.submission_notes} />}
		</div>
	);
}

/** Link + notes inputs shown to the assignee when they can submit. */
export function SubmissionForm({
	link,
	notes,
	onLinkChange,
	onNotesChange,
}: {
	link: string;
	notes: string;
	onLinkChange: (value: string) => void;
	onNotesChange: (value: string) => void;
}) {
	return (
		<div className="flex flex-col gap-2">
			<FieldLabel>Submission</FieldLabel>
			<TextInput className="py-2" placeholder="Submission link" value={link} onChange={e => onLinkChange(e.target.value)} />
			<RichTextEditor value={notes} onChange={onNotesChange} placeholder="Submission notes (optional)" minHeight={80} />
		</div>
	);
}
