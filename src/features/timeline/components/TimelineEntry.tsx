import { forwardRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { flattenRevisionChain } from '@/features/tasks';
import type { Task } from '@/types';
import { TIMELINE_STATUS, formatShortDate } from '../lib/status';

/**
 * One finished task on the timeline. If it went through rejections, it can be
 * expanded to show each earlier revision with the reviewer's comment.
 */
const TimelineEntry = forwardRef<
	HTMLDivElement,
	{
		task: Task;
		expanded: boolean;
		selectedId: number | null;
		onActivate: (task: Task, hasRevisions: boolean) => void;
		onSelectRevision: (task: Task) => void;
	}
>(function TimelineEntry({ task, expanded, selectedId, onActivate, onSelectRevision }, ref) {
	const meta = TIMELINE_STATUS[task.status];
	const revisions = flattenRevisionChain(task);
	const hasRevisions = revisions.length > 0;
	const activate = () => onActivate(task, hasRevisions);

	return (
		<div ref={ref} className="relative flex gap-4 scroll-mt-4 pb-1">
			<div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center">
				<div className={`h-3.5 w-3.5 rounded-full ${meta.dot}`} />
			</div>

			<div className="min-w-0 flex-1 pt-1.5">
				<div
					role="button"
					tabIndex={0}
					aria-expanded={hasRevisions ? expanded : undefined}
					onClick={activate}
					onKeyDown={e => {
						if (e.key === 'Enter' || e.key === ' ') activate();
					}}
					className={`flex w-full flex-col gap-1 rounded-lg border bg-surface px-4 py-3 text-left transition-colors hover:border-accent cursor-pointer ${
						selectedId === task.id ? 'border-accent' : 'border-border'
					}`}
				>
					<div className="flex items-center justify-between gap-3">
						<span className="text-sm font-medium text-text truncate">{task.title}</span>
						<span className={`flex shrink-0 items-center gap-1 text-xs font-medium ${meta.text}`}>
							{hasRevisions && (
								<>
									<span>{revisions.length} revision{revisions.length !== 1 ? 's' : ''}</span>
									{expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
								</>
							)}
						</span>
					</div>

					<div className="flex items-center gap-3 text-xs text-muted">
						{task.assignee && <span>{task.assignee.full_name}</span>}
						{task.completed_date && <span className="ml-auto">{formatShortDate(task.completed_date)}</span>}
					</div>
				</div>

				{expanded && hasRevisions && (
					<div className="relative mt-3 pl-6">
						<div className="absolute left-0 top-[-1.25rem] h-6 w-4 rounded-bl-2xl border-b-2 border-l-2 border-border" />
						<div className="absolute left-4 top-1 bottom-2 w-1 rounded-full bg-border/70" />

						<div className="flex flex-col gap-3">
							{revisions.map((revision, index) => (
								<div key={revision.id} className="relative flex gap-2">
									<div className="relative z-10 flex h-8 w-3 shrink-0 items-center justify-center">
										<div className={`h-2.5 w-2.5 rounded-full ${TIMELINE_STATUS[revision.status].dot}`} />
									</div>

									<button
										type="button"
										onClick={() => onSelectRevision(revision)}
										className={`min-w-0 flex-1 rounded-md border bg-bg px-3 py-2 text-left text-xs transition-colors hover:border-accent cursor-pointer ${
											selectedId === revision.id ? 'border-accent' : 'border-border/70'
										}`}
									>
										<div className="flex items-center justify-between gap-2">
											<span className="font-medium text-text truncate">
												Revision {revisions.length - index} — {revision.title}
											</span>
											{revision.reviewed_at && <span className="shrink-0 text-muted">{formatShortDate(revision.reviewed_at)}</span>}
										</div>
										{revision.review_comment && <p className="mt-1 text-muted">{revision.review_comment}</p>}
									</button>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
});

export default TimelineEntry;
