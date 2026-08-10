'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { User } from '@/lib/auth';
import RichTextEditor from '@/components/RichTextEditor';
import RichTextDisplay from '@/components/RichTextDisplay';
import { Check, X } from 'lucide-react';

interface Assignee {
	id: number;
	full_name: string;
}

interface Task {
	id: number;
	title: string;
	description: string | null;
	status: 'todo' | 'in_progress' | 'submitted' | 'done' | 'closed';
	priority: string;
	requires_submission: boolean;
	due_date: string | null;
	assignee: Assignee | null;
	submission_link: string | null;
	submission_notes: string | null;
	submitted_at: string | null;
	review_comment: string | null;
	reviewed_at: string | null;
	completed_date: string | null;
	previous_task: Task | null;
	sort_order: number;
}

interface Props {
	task: Task;
	projectLeadId: number;
	currentUser: User;
	onClose: () => void;
	onMutate: () => void;
	onReject: (task: Task) => void;
	onEdit: (task: Task) => void;
	// Board's parent already knows which project it's rendering (same way
	// it already knows projectLeadId), so this is passed down rather than
	// carried per-task. When true and a task is unassigned + in_progress,
	// anyone can mark it done, which claims it for them in the same action.
	isSystemProject?: boolean;
}

const statusChip: Record<string, string> = {
	todo: 'bg-gray-100 text-muted',
	in_progress: 'bg-blue-50 text-blue-800',
	submitted: 'bg-yellow-50 text-yellow-800',
	done: 'bg-green-100 text-green-800',
	closed: 'bg-gray-100 text-muted',
};

// Keep in sync with the flag of the same name in the board page (page.tsx).
// true = theme-derived accent colors, false = fixed Green/Yellow/Red-Orange.
const inheritPriorityColors = false;

const priorityChip: Record<string, string> = inheritPriorityColors
  ? {
		high: 'bg-surface text-accent border border-accent',
		medium: 'bg-surface text-accent-hover border border-accent-hover',
		low: 'bg-surface text-muted border border-muted',
	}
	: {
		high: 'bg-black/1 text-[#ff4d1c] border border-[#ff4d1c]',
		medium: 'bg-black/1 text-[#f5c518] border border-[#f5c518]',
		low: 'bg-black/1 text-[#2e9e44] border border-[#2e9e44]',
	};

const statusLabel: Record<string, string> = {
	todo: 'To Do',
	in_progress: 'In Progress',
	submitted: 'Submitted',
	done: 'Done',
	closed: 'Closed',
};

const priorityLabel: Record<string, string> = {
	high: 'High',
	medium: 'Medium',
	low: 'Low',
};

function formatDueDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});
}

export default function TaskModal({
	task,
	projectLeadId,
	currentUser,
	onClose,
	onMutate,
	onReject,
	onEdit,
	isSystemProject = false,
}: Props) {
	const [submissionLink, setSubmissionLink] = useState(task.submission_link ?? '');
	const [submissionNotes, setSubmissionNotes] = useState(task.submission_notes ?? '');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedTask, setSelectedTask] = useState<Task>(task);

	useEffect(() => {
		setSelectedTask(task);
	}, [task.id]);

	const isViewingPast = selectedTask.id !== task.id;

	const isAdmin = currentUser.system_role === 'admin';
	const isLead = currentUser.id === projectLeadId;
	const isAssignee = selectedTask.assignee?.id === currentUser.id;
	const assigneeIsLead = selectedTask.assignee?.id === projectLeadId;

	const canEditBase = (isAdmin || isLead) && !(['done', 'closed', 'submitted'].includes(selectedTask.status) && !isAdmin);
	const canDeleteBase = (isAdmin || isLead) && !(['done', 'closed'].includes(selectedTask.status) && !isAdmin);

	const canEdit = isViewingPast ? isAdmin : canEditBase;
	const canDelete = isViewingPast ? isAdmin : canDeleteBase;

	const canSubmit =
		!isViewingPast &&
		isAssignee &&
		selectedTask.status === 'in_progress' &&
		selectedTask.requires_submission &&
		!isLead &&
		!isAdmin &&
		!assigneeIsLead;

	const canTakeback =
		!isViewingPast &&
		isAssignee &&
		selectedTask.status === 'submitted';

	const canSelfComplete =
		!isViewingPast &&
		isAssignee &&
		selectedTask.status === 'in_progress' &&
		(!selectedTask.requires_submission || isLead || isAdmin || assigneeIsLead);

	// System-project-only: an unassigned in_progress task can be claimed
	// and completed in one action by anyone, since system tasks skip the
	// normal assignment flow entirely.
	const canClaimAndComplete =
		!isViewingPast &&
		isSystemProject &&
		!selectedTask.assignee &&
		selectedTask.status === 'in_progress';

	const canReview =
		!isViewingPast &&
		(isAdmin || isLead) &&
		selectedTask.status === 'submitted';

	const patch = async (body: Record<string, any>) => {
		setLoading(true);
		setError(null);
		try {
			await apiClient(`/tasks/${selectedTask.id}`, {
				method: 'PUT',
				body: JSON.stringify({ acting_as_user_id: currentUser.id, ...body }),
			});
			onMutate();
			onClose();
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const chain: Task[] = [];
	let cursor: Task | null = task.previous_task;
	while (cursor) {
		chain.push(cursor);
		cursor = cursor.previous_task;
	}

	const historyEntries: { key: number; label: string; data: Task }[] = [
		{ key: task.id, label: 'Current', data: task },
		...chain.map((prev, i) => ({ key: prev.id, label: `#${chain.length - i}`, data: prev })),
	];

	return (
		<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]" onClick={onClose}>
			<div className="flex items-start gap-4" onClick={e => e.stopPropagation()}>
				{chain.length > 0 && (
					<div className="bg-surface border border-border rounded-xl shadow-md w-64 shrink-0 max-h-[88vh] flex flex-col overflow-hidden">
						<div className="px-4 pt-5 pb-3 border-b border-border">
							<h3 className="text-sm font-semibold text-text m-0">Revision History</h3>
						</div>
						<div className="flex-1 overflow-y-auto p-3" dir="rtl">
							<div className="flex flex-col gap-2" dir="ltr">
								{historyEntries.map(entry => {
									const active = entry.key === selectedTask.id;
									return (
										<button
											key={entry.key}
											onClick={() => setSelectedTask(entry.data)}
											className={`flex items-center gap-2 text-left rounded px-3 py-2 border transition-colors cursor-pointer ${
												active
													? 'bg-accent text-white border-accent'
													: 'bg-bg border-border text-text hover:bg-surface'
											}`}
										>
											<span className={`font-mono text-xs shrink-0 ${active ? 'text-white/80' : 'text-muted'}`}>
												{entry.label}
											</span>
											<span className="text-xs font-medium truncate">{entry.data.title}</span>
										</button>
									);
								})}
							</div>
						</div>
					</div>
				)}
				<div className="bg-surface border border-border rounded-xl shadow-md w-[32rem] shrink-0 max-h-[85vh] flex flex-col overflow-hidden">

				{/* Header */}
				<div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border gap-3">
					<div className="flex flex-col gap-1 min-w-0">
						<div className="flex items-center gap-2 min-w-0">
							<h2 className="text-base font-semibold text-text m-0">{selectedTask.title}</h2>
							<span
								className={`inline-flex shrink-0 items-center gap-1 text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-full border cursor-default select-none whitespace-nowrap ${
									selectedTask.requires_submission
										? 'bg-green-50 text-green-700 border-green-200'
										: 'bg-gray-100 text-muted border-gray-200'
								}`}
							>
								{selectedTask.requires_submission
									? <><Check size={10} strokeWidth={2.5} /> Submission Required</>
									: <><X size={10} strokeWidth={2.5} /> Submission Not Required</>
								}
							</span>
						</div>
						{selectedTask.status !== 'closed' && (
							<span className="text-xs text-muted">{selectedTask.assignee?.full_name ?? 'Unassigned'}</span>
						)}
					</div>
					<button className="text-sm text-muted bg-transparent border-none cursor-pointer hover:text-text p-0 leading-none shrink-0" onClick={onClose}>✕</button>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
					{/* Meta row */}
					<div className={`grid gap-3 ${selectedTask.due_date ? 'grid-cols-3' : 'grid-cols-2'}`}>
						<div className="flex flex-col gap-1">
							<span className="text-xs text-muted uppercase tracking-wide">Status</span>
							<span className={`font-mono text-xs tracking-wide px-2 py-0.5 rounded self-start ${statusChip[selectedTask.status] ?? 'bg-gray-100 text-muted'}`}>
								{statusLabel[selectedTask.status] ?? selectedTask.status}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs text-muted uppercase tracking-wide">Priority</span>
							<span className={`font-mono text-xs tracking-wide px-2 py-0.5 rounded self-start ${priorityChip[selectedTask.priority] ?? 'bg-gray-100 text-muted'}`}>
								{priorityLabel[selectedTask.priority] ?? selectedTask.priority}
							</span>
						</div>
						{selectedTask.due_date && (() => {
							const overdue = !['submitted', 'done', 'closed'].includes(selectedTask.status) && new Date(selectedTask.due_date) < new Date(new Date().toDateString());
							return (
								<div className="flex flex-col gap-1">
									<span className={`text-xs uppercase tracking-wide ${overdue ? 'text-danger font-semibold' : 'text-muted'}`}>
										{overdue ? 'Overdue' : 'Due'}
									</span>
									<span className={`text-sm ${overdue ? 'text-danger font-medium' : 'text-text'}`}>
										{formatDueDate(selectedTask.due_date)}
									</span>
								</div>
							);
						})()}
					</div>

					{/* Description */}
					{selectedTask.description && (
						<div className="flex flex-col gap-1.5">
							<span className="text-xs text-muted uppercase tracking-wide">Description</span>
							<div className="bg-bg border border-border rounded px-3 py-2">
								<RichTextDisplay html={selectedTask.description} />
							</div>
						</div>
					)}

					{/* Review comment */}
					{selectedTask.review_comment && (
						<div className="flex flex-col gap-1.5 bg-yellow-50 border border-yellow-200 rounded p-3">
							<span className="text-xs text-muted uppercase tracking-wide">Review Comment</span>
							<p className="text-sm text-text m-0 leading-relaxed">{selectedTask.review_comment}</p>
						</div>
					)}

					{/* Submission fields */}
					{canSubmit && (
						<div className="flex flex-col gap-2">
							<span className="text-xs text-muted uppercase tracking-wide">Submission</span>
							<input
								className="text-sm text-text bg-bg border border-border rounded px-3 py-2 outline-none focus:border-accent transition-colors"
								placeholder="Submission link"
								value={submissionLink}
								onChange={e => setSubmissionLink(e.target.value)}
							/>
							<RichTextEditor
								value={submissionNotes}
								onChange={setSubmissionNotes}
								placeholder="Submission notes (optional)"
								minHeight={80}
							/>
						</div>
					)}

					{/* Submitted info */}
					{selectedTask.submission_link && (
						<div className="flex flex-col gap-1.5">
							<span className="text-xs text-muted uppercase tracking-wide">
								Submitted{selectedTask.submitted_at ? ` on ${formatDueDate(selectedTask.submitted_at)}` : ''}
							</span>
							<a className="font-mono text-xs text-accent break-all no-underline hover:underline" href={selectedTask.submission_link} target="_blank" rel="noreferrer">
								{selectedTask.submission_link}
							</a>
							{selectedTask.submission_notes && (
								<RichTextDisplay html={selectedTask.submission_notes} />
							)}
						</div>
					)}

					{error && <p className="text-sm text-danger m-0">{error}</p>}
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
					{canDelete && (
						<button
							className="text-sm font-medium text-danger bg-surface border border-danger rounded px-4 py-2 cursor-pointer transition-colors hover:bg-red-50 disabled:opacity-50 mr-auto"
							disabled={loading}
							onClick={async () => {
								if (confirm('Delete this task?')) {
									await apiClient(`/tasks/${selectedTask.id}`, {
										method: 'DELETE',
										body: JSON.stringify({ acting_as_user_id: currentUser.id }),
									});
									onMutate();
									onClose();
								}
							}}
						>
							Delete
						</button>
					)}
					{canEdit && (
						<button
							className="text-sm font-medium text-text bg-surface border border-border rounded px-4 py-2 cursor-pointer transition-colors hover:bg-bg disabled:opacity-50"
							disabled={loading}
							onClick={() => onEdit(selectedTask)}
						>
							Edit
						</button>
					)}

					{canReview && (
						<>
							<button
								className="text-sm font-medium text-text bg-surface border border-border rounded px-4 py-2 cursor-pointer transition-colors hover:bg-bg disabled:opacity-50"
								disabled={loading}
								onClick={() => onReject(selectedTask)}
							>
								Reject
							</button>
							<button
								className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-50"
								disabled={loading}
								onClick={() => patch({ status: 'done' })}
							>
								Approve
							</button>
						</>
					)}

					{canTakeback && (
						<button
							className="text-sm font-medium text-text bg-surface border border-border rounded px-4 py-2 cursor-pointer transition-colors hover:bg-bg disabled:opacity-50"
							disabled={loading}
							onClick={() => patch({ status: 'in_progress' })}
						>
							Take Back
						</button>
					)}

					{canSubmit && (
						<button
							className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={loading || !submissionLink}
							onClick={() => patch({ status: 'submitted', submission_link: submissionLink, submission_notes: submissionNotes || null })}
						>
							Submit
						</button>
					)}

					{canSelfComplete && (
						<button
							className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-50"
							disabled={loading}
							onClick={() => patch({ status: 'done' })}
						>
							Mark as Done
						</button>
					)}

					{canClaimAndComplete && (
						<button
							className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-50"
							disabled={loading}
							onClick={() => patch({ status: 'done' })}
						>
							Mark as Done
						</button>
					)}

					{!isViewingPast && (isAssignee || !selectedTask.assignee) && selectedTask.status === 'todo' && (
						<button
							className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-50"
							disabled={loading}
							onClick={() => patch({ status: 'in_progress' })}
						>
							Start Working
						</button>
					)}
					</div>
				</div>
			</div>
		</div>
	);
}