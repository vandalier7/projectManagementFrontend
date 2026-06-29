'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import type { User } from '@/lib/auth';

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
}

interface Props {
	task: Task;
	projectLeadId: number;
	currentUser: User;
	onClose: () => void;
	onMutate: () => void;
	onReject: (task: Task) => void;
}

const statusChip: Record<string, string> = {
	todo: 'bg-gray-100 text-muted',
	in_progress: 'bg-blue-50 text-blue-800',
	submitted: 'bg-yellow-50 text-yellow-800',
	done: 'bg-green-100 text-green-800',
	closed: 'bg-gray-100 text-muted',
};

const priorityChip: Record<string, string> = {
	high: 'bg-red-50 text-red-800',
	medium: 'bg-yellow-50 text-yellow-800',
	low: 'bg-gray-100 text-muted',
};

export default function TaskModal({
	task,
	projectLeadId,
	currentUser,
	onClose,
	onMutate,
	onReject,
}: Props) {
	const [submissionLink, setSubmissionLink] = useState(task.submission_link ?? '');
	const [submissionNotes, setSubmissionNotes] = useState(task.submission_notes ?? '');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isAdmin = currentUser.system_role === 'admin';
	const isLead = currentUser.id === projectLeadId;
	const isAssignee = task.assignee?.id === currentUser.id;
	const canEdit = isAdmin || isLead;

	const canSubmit =
		isAssignee &&
		task.status === 'in_progress' &&
		task.requires_submission &&
		!isLead;

	const canTakeback =
		isAssignee &&
		task.status === 'submitted';

	const canSelfComplete =
		isAssignee &&
		task.status === 'in_progress' &&
		(!task.requires_submission || isLead);

	const canReview =
		(isAdmin || isLead) &&
		task.status === 'submitted';

	const patch = async (body: Record<string, any>) => {
		setLoading(true);
		setError(null);
		try {
			await apiClient(`/tasks/${task.id}`, {
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

	return (
		<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]" onClick={onClose}>
			<div className="bg-surface border border-border rounded-xl shadow-md w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

				{/* Header */}
				<div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border gap-3">
					<div className="flex items-center gap-2">
						<h2 className="text-base font-semibold text-text m-0">{task.title}</h2>
						{task.requires_submission && (
							<span className="w-2 h-2 min-w-2 rounded-full bg-accent" title="Requires submission" />
						)}
					</div>
					<button className="text-sm text-muted bg-transparent border-none cursor-pointer hover:text-text p-0 leading-none" onClick={onClose}>✕</button>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
					{/* Meta grid */}
					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1">
							<span className="text-xs text-muted uppercase tracking-wide">Status</span>
							<span className={`font-mono text-xs tracking-wide px-2 py-0.5 rounded lowercase self-start ${statusChip[task.status] ?? 'bg-gray-100 text-muted'}`}>
								{task.status}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs text-muted uppercase tracking-wide">Priority</span>
							<span className={`font-mono text-xs tracking-wide px-2 py-0.5 rounded lowercase self-start ${priorityChip[task.priority] ?? 'bg-gray-100 text-muted'}`}>
								{task.priority}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs text-muted uppercase tracking-wide">Assignee</span>
							<span className="text-sm text-text">{task.assignee?.full_name ?? '—'}</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs text-muted uppercase tracking-wide">Due</span>
							<span className="text-sm text-text">{task.due_date ?? '—'}</span>
						</div>
					</div>

					{/* Description */}
					{task.description && (
						<div className="flex flex-col gap-1.5">
							<span className="text-xs text-muted uppercase tracking-wide">Description</span>
							<p className="text-sm text-text m-0 leading-relaxed">{task.description}</p>
						</div>
					)}

					{/* Review comment */}
					{task.review_comment && (
						<div className="flex flex-col gap-1.5 bg-yellow-50 border border-yellow-200 rounded p-3">
							<span className="text-xs text-muted uppercase tracking-wide">Review Comment</span>
							<p className="text-sm text-text m-0 leading-relaxed">{task.review_comment}</p>
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
							<textarea
								className="text-sm text-text bg-bg border border-border rounded px-3 py-2 outline-none focus:border-accent transition-colors resize-none min-h-20"
								placeholder="Submission notes (optional)"
								value={submissionNotes}
								onChange={e => setSubmissionNotes(e.target.value)}
							/>
						</div>
					)}

					{/* Submitted info */}
					{task.submission_link && task.status === 'submitted' && (
						<div className="flex flex-col gap-1.5">
							<span className="text-xs text-muted uppercase tracking-wide">Submitted</span>
							<a className="font-mono text-xs text-accent break-all no-underline hover:underline" href={task.submission_link} target="_blank" rel="noreferrer">
								{task.submission_link}
							</a>
							{task.submission_notes && (
								<p className="text-sm text-text m-0 leading-relaxed">{task.submission_notes}</p>
							)}
						</div>
					)}

					{/* Revision chain */}
					{chain.length > 0 && (
						<div className="flex flex-col gap-2">
							<span className="text-xs text-muted uppercase tracking-wide">Revision History</span>
							<div className="flex flex-col gap-2">
								{chain.map((prev, i) => (
									<div key={prev.id} className="flex flex-col gap-0.5 bg-bg border border-border rounded px-3 py-2">
										<span className="font-mono text-xs text-muted">#{chain.length - i}</span>
										<span className="text-xs font-medium text-text">{prev.title}</span>
										{prev.review_comment && (
											<span className="text-xs text-muted italic">{prev.review_comment}</span>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{error && <p className="text-sm text-danger m-0">{error}</p>}
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
					{canEdit && (
						<button
							className="text-sm font-medium text-danger bg-surface border border-danger rounded px-4 py-2 cursor-pointer transition-colors hover:bg-red-50 disabled:opacity-50 mr-auto"
							disabled={loading}
							onClick={async () => {
								if (confirm('Delete this task?')) {
									await apiClient(`/tasks/${task.id}`, {
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

					{canReview && (
						<>
							<button
								className="text-sm font-medium text-text bg-surface border border-border rounded px-4 py-2 cursor-pointer transition-colors hover:bg-bg disabled:opacity-50"
								disabled={loading}
								onClick={() => onReject(task)}
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
							onClick={() => patch({ status: 'submitted', submission_link: submissionLink, submission_notes: submissionNotes })}
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

					{isAssignee && task.status === 'todo' && (
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
	);
}