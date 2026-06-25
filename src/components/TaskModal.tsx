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

	// Revision chain — walk back through previous tasks
	const chain: Task[] = [];
	let cursor: Task | null = task.previous_task;
	while (cursor) {
		chain.push(cursor);
		cursor = cursor.previous_task;
	}

	return (
		<div className="overlay" onClick={onClose}>
			<div className="modal" onClick={e => e.stopPropagation()}>
				<div className="modalHeader">
					<div className="titleRow">
						<h2 className="taskTitle">{task.title}</h2>
						{task.requires_submission && (
							<span className="submissionDot" title="Requires submission" />
						)}
					</div>
					<button className="closeBtn" onClick={onClose}>✕</button>
				</div>

				<div className="modalBody">
					<div className="metaGrid">
						<div className="metaItem">
							<span className="metaLabel">Status</span>
							<span className={`chip chip--${task.status}`}>{task.status}</span>
						</div>
						<div className="metaItem">
							<span className="metaLabel">Priority</span>
							<span className={`priority priority--${task.priority}`}>{task.priority}</span>
						</div>
						<div className="metaItem">
							<span className="metaLabel">Assignee</span>
							<span className="metaValue">{task.assignee?.full_name ?? '—'}</span>
						</div>
						<div className="metaItem">
							<span className="metaLabel">Due</span>
							<span className="metaValue">{task.due_date ?? '—'}</span>
						</div>
					</div>

					{task.description && (
						<div className="section">
							<span className="sectionLabel">Description</span>
							<p className="description">{task.description}</p>
						</div>
					)}

					{task.review_comment && (
						<div className="section reviewSection">
							<span className="sectionLabel">Review Comment</span>
							<p className="description">{task.review_comment}</p>
						</div>
					)}

					{/* Submission fields for assignee */}
					{canSubmit && (
						<div className="section">
							<span className="sectionLabel">Submission</span>
							<input
								className="input"
								placeholder="Submission link"
								value={submissionLink}
								onChange={e => setSubmissionLink(e.target.value)}
							/>
							<textarea
								className="textarea"
								placeholder="Submission notes (optional)"
								value={submissionNotes}
								onChange={e => setSubmissionNotes(e.target.value)}
							/>
						</div>
					)}

					{/* Submission info if already submitted */}
					{task.submission_link && task.status === 'submitted' && (
						<div className="section">
							<span className="sectionLabel">Submitted</span>
							<a className="link" href={task.submission_link} target="_blank" rel="noreferrer">
								{task.submission_link}
							</a>
							{task.submission_notes && (
								<p className="description">{task.submission_notes}</p>
							)}
						</div>
					)}

					{/* Revision chain */}
					{chain.length > 0 && (
						<div className="section">
							<span className="sectionLabel">Revision History</span>
							<div className="chain">
								{chain.map((prev, i) => (
									<div key={prev.id} className="chainItem">
										<span className="chainIndex">#{chain.length - i}</span>
										<span className="chainTitle">{prev.title}</span>
										{prev.review_comment && (
											<span className="chainComment">{prev.review_comment}</span>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{error && <p className="errorMsg">{error}</p>}
				</div>

				<div className="modalFooter">
					{/* Admin/lead actions */}
					{canEdit && (
						<button className="btn danger" disabled={loading} onClick={async () => {
                            if (confirm('Delete this task?')) {
                                await apiClient(`/tasks/${task.id}`, {
                                    method: 'DELETE',
                                    body: JSON.stringify({ acting_as_user_id: currentUser.id }),
                                });
                                onMutate();
                                onClose();
                            }
                        }}>
							Delete
						</button>
					)}

					{canReview && (
						<>
							<button className="btn secondary" disabled={loading} onClick={() => onReject(task)}>
								Reject
							</button>
							<button className="btn primary" disabled={loading} onClick={() => patch({ status: 'done' })}>
								Approve
							</button>
						</>
					)}

					{/* Assignee actions */}
					{canTakeback && (
						<button className="btn secondary" disabled={loading} onClick={() => patch({ status: 'in_progress' })}>
							Take Back
						</button>
					)}

					{canSubmit && (
						<button
							className="btn primary"
							disabled={loading || !submissionLink}
							onClick={() => patch({ status: 'submitted', submission_link: submissionLink, submission_notes: submissionNotes })}
						>
							Submit
						</button>
					)}

					{canSelfComplete && (
						<button className="btn primary" disabled={loading} onClick={() => patch({ status: 'done' })}>
							Mark as Done
						</button>
					)}

                    {isAssignee && task.status === 'todo' && (
                        <button className="btn primary" disabled={loading} onClick={() => patch({ status: 'in_progress' })}>
                            Start Working
                        </button>
                    )}
				</div>
			</div>

			<style jsx>{`
				.overlay {
					position: fixed;
					inset: 0;
					background: rgba(0, 0, 0, 0.4);
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 100;
				}

				.modal {
					background: var(--surface);
					border: 1px solid var(--border);
					border-radius: var(--radius-lg);
					box-shadow: var(--shadow-md);
					width: 100%;
					max-width: 560px;
					max-height: 85vh;
					display: flex;
					flex-direction: column;
					overflow: hidden;
				}

				.modalHeader {
					display: flex;
					align-items: flex-start;
					justify-content: space-between;
					padding: 24px 24px 16px;
					border-bottom: 1px solid var(--border);
					gap: 12px;
				}

				.titleRow {
					display: flex;
					align-items: center;
					gap: 8px;
				}

				.taskTitle {
					font-family: var(--font-ui);
					font-size: 16px;
					font-weight: 600;
					color: var(--text);
					margin: 0;
				}

				.submissionDot {
					width: 8px;
					height: 8px;
					min-width: 8px;
					border-radius: 50%;
					background: var(--accent);
				}

				.closeBtn {
					background: none;
					border: none;
					font-size: 14px;
					color: var(--muted);
					cursor: pointer;
					padding: 0;
					line-height: 1;
				}

				.closeBtn:hover {
					color: var(--text);
				}

				.modalBody {
					flex: 1;
					overflow-y: auto;
					padding: 20px 24px;
					display: flex;
					flex-direction: column;
					gap: 20px;
				}

				.metaGrid {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 12px;
				}

				.metaItem {
					display: flex;
					flex-direction: column;
					gap: 4px;
				}

				.metaLabel {
					font-family: var(--font-ui);
					font-size: 11px;
					color: var(--muted);
					text-transform: uppercase;
					letter-spacing: 0.05em;
				}

				.metaValue {
					font-family: var(--font-ui);
					font-size: 13px;
					color: var(--text);
				}

				.chip {
					font-family: var(--font-mono);
					font-size: 11px;
					letter-spacing: 0.05em;
					padding: 3px 8px;
					border-radius: 4px;
					text-transform: lowercase;
					display: inline-block;
				}

				.chip--todo { background: #F5F5F5; color: var(--muted); }
				.chip--in_progress { background: #E3F2FD; color: #1565C0; }
				.chip--submitted { background: #FFF8E1; color: #F57F17; }
				.chip--done { background: #E8F5E9; color: #2E7D32; }
				.chip--closed { background: #F5F5F5; color: var(--muted); }

				.priority {
					font-family: var(--font-mono);
					font-size: 11px;
					letter-spacing: 0.05em;
					padding: 3px 8px;
					border-radius: 4px;
					text-transform: lowercase;
					display: inline-block;
				}

				.priority--high { background: #FDECEA; color: #C62828; }
				.priority--medium { background: #FFF8E1; color: #F57F17; }
				.priority--low { background: #F5F5F5; color: var(--muted); }

				.section {
					display: flex;
					flex-direction: column;
					gap: 8px;
				}

				.reviewSection {
					background: #FFF8E1;
					border: 1px solid #FFE082;
					border-radius: var(--radius);
					padding: 12px;
				}

				.sectionLabel {
					font-family: var(--font-ui);
					font-size: 11px;
					color: var(--muted);
					text-transform: uppercase;
					letter-spacing: 0.05em;
				}

				.description {
					font-family: var(--font-ui);
					font-size: 13px;
					color: var(--text);
					margin: 0;
					line-height: 1.6;
				}

				.input {
					font-family: var(--font-ui);
					font-size: 13px;
					color: var(--text);
					background: var(--bg);
					border: 1px solid var(--border);
					border-radius: var(--radius);
					padding: 8px 10px;
					outline: none;
					transition: border-color 150ms ease;
				}

				.input:focus {
					border-color: var(--accent);
				}

				.textarea {
					font-family: var(--font-ui);
					font-size: 13px;
					color: var(--text);
					background: var(--bg);
					border: 1px solid var(--border);
					border-radius: var(--radius);
					padding: 8px 10px;
					outline: none;
					resize: vertical;
					min-height: 80px;
					transition: border-color 150ms ease;
				}

				.textarea:focus {
					border-color: var(--accent);
				}

				.link {
					font-family: var(--font-mono);
					font-size: 12px;
					color: var(--accent);
					text-decoration: none;
					word-break: break-all;
				}

				.link:hover {
					text-decoration: underline;
				}

				.chain {
					display: flex;
					flex-direction: column;
					gap: 8px;
				}

				.chainItem {
					display: flex;
					flex-direction: column;
					gap: 2px;
					padding: 8px 12px;
					background: var(--bg);
					border-radius: var(--radius);
					border: 1px solid var(--border);
				}

				.chainIndex {
					font-family: var(--font-mono);
					font-size: 10px;
					color: var(--muted);
				}

				.chainTitle {
					font-family: var(--font-ui);
					font-size: 12px;
					color: var(--text);
					font-weight: 500;
				}

				.chainComment {
					font-family: var(--font-ui);
					font-size: 12px;
					color: var(--muted);
					font-style: italic;
				}

				.errorMsg {
					font-family: var(--font-ui);
					font-size: 13px;
					color: #D94F4F;
					margin: 0;
				}

				.modalFooter {
					padding: 16px 24px;
					border-top: 1px solid var(--border);
					display: flex;
					justify-content: flex-end;
					gap: 8px;
				}

				.btn {
					font-family: var(--font-ui);
					font-size: 13px;
					font-weight: 500;
					border-radius: var(--radius);
					padding: 8px 16px;
					cursor: pointer;
					transition: background 150ms ease;
					border: none;
				}

				.btn:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}

				.btn.primary {
					background: var(--accent);
					color: #FFFFFF;
				}

				.btn.primary:hover:not(:disabled) {
					background: var(--accent-hover);
				}

				.btn.secondary {
					background: var(--surface);
					color: var(--text);
					border: 1px solid var(--border);
				}

				.btn.secondary:hover:not(:disabled) {
					background: var(--bg);
				}

				.btn.danger {
					background: var(--surface);
					color: #D94F4F;
					border: 1px solid #D94F4F;
					margin-right: auto;
				}

				.btn.danger:hover:not(:disabled) {
					background: #FDF2F2;
				}
			`}</style>
		</div>
	);
}