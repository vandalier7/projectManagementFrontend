import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import RichTextDisplay from '@/components/ui/RichTextDisplay';
import type { Task } from '@/types';
import { TIMELINE_STATUS, formatShortDate } from '../lib/status';

function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex justify-between gap-2">
			<span className="text-muted">{label}</span>
			<span className="text-text">{children}</span>
		</div>
	);
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
	return (
		<div className="mt-3 border-t border-border pt-3">
			<div className="flex items-center justify-between gap-2">
				<p className="text-xs text-muted m-0">{title}</p>
				{aside && <span className="text-xs text-muted">{aside}</span>}
			</div>
			<div className="mt-1 text-xs text-text">{children}</div>
		</div>
	);
}

/** Read-only side panel for a finished task or one of its revisions. */
export default function TimelineTaskDetails({ task, onClose }: { task: Task; onClose: () => void }) {
	const meta = TIMELINE_STATUS[task.status];

	return (
		<div className="fixed top-23 right-8 z-20 w-80 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-lg border border-border bg-surface p-4">
			<div className="flex items-start justify-between gap-3">
				<h3 className="text-sm font-semibold text-text">{task.title}</h3>
				<button
					type="button"
					onClick={onClose}
					className="shrink-0 rounded p-1 text-muted hover:bg-bg hover:text-text cursor-pointer"
					aria-label="Close details"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			<span className={`mt-2 inline-block text-xs font-medium ${meta.text}`}>{meta.label}</span>

			{task.description && (
				<div className="mt-3 text-sm text-muted">
					<RichTextDisplay html={task.description} />
				</div>
			)}

			<div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 text-xs">
				{task.assignee && <Row label="Assignee">{task.assignee.full_name}</Row>}
				<Row label="Priority"><span className="capitalize">{task.priority}</span></Row>
				{task.due_date && <Row label="Due">{formatShortDate(task.due_date)}</Row>}
				{task.completed_date && <Row label="Completed">{formatShortDate(task.completed_date)}</Row>}
				{task.submitted_at && <Row label="Submitted">{formatShortDate(task.submitted_at)}</Row>}
			</div>

			{task.submission_link && (
				<Section title="Submission link">
					<a href={task.submission_link} target="_blank" rel="noreferrer" className="break-all text-accent hover:underline">
						{task.submission_link}
					</a>
				</Section>
			)}

			{task.submission_notes && (
				<Section title="Submission notes">
					<RichTextDisplay html={task.submission_notes} />
				</Section>
			)}

			{task.review_comment && (
				<Section title="Review comment" aside={formatShortDate(task.reviewed_at)}>
					<p className="m-0 whitespace-pre-wrap">{task.review_comment}</p>
				</Section>
			)}
		</div>
	);
}
