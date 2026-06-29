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
	priority: string;
	assignee: Assignee | null;
}

interface Member {
	id: number;
	user: {
		id: number;
		full_name: string;
	};
}

interface Props {
	task: Task;
	members: Member[];
	currentUser: User;
	onClose: () => void;
	onMutate: () => void;
}

export default function RejectModal({
	task,
	members,
	currentUser,
	onClose,
	onMutate,
}: Props) {
	const [reviewComment, setReviewComment] = useState('');
	const [newTitle, setNewTitle] = useState(task.title);
	const [newDescription, setNewDescription] = useState(task.description ?? '');
	const [newAssignedTo, setNewAssignedTo] = useState(String(task.assignee?.id ?? ''));
	const [newPriority, setNewPriority] = useState(task.priority);
	const [newDueDate, setNewDueDate] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const canSubmit = reviewComment.trim() && newTitle.trim();

	const handleReject = async () => {
		setLoading(true);
		setError(null);

		try {
			await apiClient(`/tasks/${task.id}`, {
				method: 'PUT',
				body: JSON.stringify({
					acting_as_user_id: currentUser.id,
					status: 'closed',
					review_comment: reviewComment,
					new_title: newTitle,
					new_description: newDescription || null,
					new_assigned_to: newAssignedTo || null,
					new_priority: newPriority,
					new_due_date: newDueDate || null,
				}),
			});

			onMutate();
			onClose();
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110]" onClick={onClose}>
			<div className="bg-surface border border-border rounded-xl shadow-md w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
				<div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
					<h2 className="text-base font-semibold text-text m-0">Reject Task</h2>
					<button className="text-sm text-muted bg-transparent border-none cursor-pointer hover:text-text p-0" onClick={onClose}>✕</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
					{/* Review comment */}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-muted uppercase tracking-wide">Review Comment <span className="text-danger">*</span></label>
						<textarea
							className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors resize-none min-h-20"
							placeholder="Explain what needs to be revised"
							value={reviewComment}
							onChange={e => setReviewComment(e.target.value)}
							autoFocus
						/>
					</div>

					<div className="border-t border-border pt-4">
						<p className="text-xs text-muted uppercase tracking-wide mb-3">Replacement Task</p>

						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs text-muted uppercase tracking-wide">Title <span className="text-danger">*</span></label>
								<input
									className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors"
									placeholder="Replacement task title"
									value={newTitle}
									onChange={e => setNewTitle(e.target.value)}
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs text-muted uppercase tracking-wide">Description</label>
								<textarea
									className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors resize-none min-h-16"
									placeholder="Optional"
									value={newDescription}
									onChange={e => setNewDescription(e.target.value)}
								/>
							</div>

							<div className="flex gap-4">
								<div className="flex flex-col gap-1.5 flex-1">
									<label className="text-xs text-muted uppercase tracking-wide">Assign to</label>
									<select
										className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors cursor-pointer"
										value={newAssignedTo}
										onChange={e => setNewAssignedTo(e.target.value)}
									>
										<option value="">Unassigned</option>
										{members.map(m => (
											<option key={m.user.id} value={m.user.id}>
												{m.user.full_name}
											</option>
										))}
									</select>
								</div>

								<div className="flex flex-col gap-1.5 flex-1">
									<label className="text-xs text-muted uppercase tracking-wide">Priority</label>
									<select
										className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors cursor-pointer"
										value={newPriority}
										onChange={e => setNewPriority(e.target.value)}
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
									</select>
								</div>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs text-muted uppercase tracking-wide">Due Date</label>
								<input
									type="date"
									className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors"
									value={newDueDate}
									onChange={e => setNewDueDate(e.target.value)}
								/>
							</div>
						</div>
					</div>

					{error && <p className="text-sm text-danger m-0">{error}</p>}
				</div>

				<div className="px-6 py-4 border-t border-border flex justify-end gap-2">
					<button
						className="text-sm font-medium text-text bg-surface border border-border rounded px-4 py-2 cursor-pointer transition-colors hover:bg-bg"
						onClick={onClose}
						disabled={loading}
					>
						Cancel
					</button>
					<button
						className="text-sm font-medium text-white bg-danger border-none rounded px-4 py-2 cursor-pointer transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={handleReject}
						disabled={loading || !canSubmit}
					>
						{loading ? 'Rejecting...' : 'Reject & Create Revision'}
					</button>
				</div>
			</div>
		</div>
	);
}