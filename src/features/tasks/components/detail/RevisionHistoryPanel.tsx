import { Loader2 } from 'lucide-react';
import type { AnyTask } from '@/types';

/**
 * Side panel listing a task and its earlier revisions. Clicking an entry
 * shows that revision in the detail panel (read-only).
 */
export default function RevisionHistoryPanel({
	current,
	revisions,
	selectedId,
	onSelect,
	loading = false,
	error = null,
}: {
	current: AnyTask;
	/** Older revisions, newest first. */
	revisions: AnyTask[];
	selectedId: number;
	onSelect: (task: AnyTask) => void;
	loading?: boolean;
	error?: string | null;
}) {
	const entries = [
		{ label: 'Current', task: current },
		...revisions.map((task, i) => ({ label: `#${revisions.length - i}`, task })),
	];

	return (
		<div className="bg-surface border border-border rounded-xl shadow-md w-64 shrink-0 max-h-[88vh] flex flex-col overflow-hidden">
			<div className="px-4 pt-5 pb-3 border-b border-border">
				<h3 className="text-sm font-semibold text-text m-0">Revision History</h3>
			</div>

			<div className="flex-1 overflow-y-auto p-3">
				{loading ? (
					<div className="flex items-center justify-center gap-2 text-xs text-muted py-6">
						<Loader2 size={14} className="animate-spin" />
						Loading history…
					</div>
				) : error ? (
					<p className="text-xs text-danger px-1 py-2 m-0">Couldn&apos;t load history: {error}</p>
				) : revisions.length === 0 ? (
					<p className="text-xs text-muted px-1 py-2 m-0">No previous revisions.</p>
				) : (
					// rtl/ltr pair puts the scrollbar on the left, away from the detail panel.
					<div dir="rtl">
						<div className="flex flex-col gap-2" dir="ltr">
							{entries.map(({ label, task }) => {
								const active = task.id === selectedId;
								return (
									<button
										key={task.id}
										type="button"
										onClick={() => onSelect(task)}
										className={`flex items-center gap-2 text-left rounded px-3 py-2 border transition-colors cursor-pointer ${
											active ? 'bg-accent text-white border-accent' : 'bg-bg border-border text-text hover:bg-surface'
										}`}
									>
										<span className={`font-mono text-xs shrink-0 ${active ? 'text-white/80' : 'text-muted'}`}>{label}</span>
										<span className="text-xs font-medium truncate">{task.title}</span>
									</button>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
