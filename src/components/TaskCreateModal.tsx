'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import type { User } from '@/lib/auth';
import { useEffect } from 'react';
import RichTextEditor from '@/components/RichTextEditor';
import { Check, X } from 'lucide-react';

interface Member {
	id: number;
	user: {
		id: number;
		full_name: string;
		system_role: 'admin' | 'team_member';
	};
}

interface Props {
	projectId: number;
	members: Member[];
	currentUser: User;
	defaultRequiresSubmission: boolean;
	onClose: () => void;
	onMutate: () => void;
	projectLeadId: number;
}

export default function TaskCreateModal({
	projectId,
	members,
	currentUser,
	defaultRequiresSubmission,
	onClose,
	onMutate,
	projectLeadId,
}: Props) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [assignedTo, setAssignedTo] = useState<string>('');
	const [priority, setPriority] = useState('medium');
	const [requiresSubmission, setRequiresSubmission] = useState(defaultRequiresSubmission);
	const [dueDate, setDueDate] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const selectedMember = members.find(m => String(m.user.id) === assignedTo);
	const assigneeIsLead = selectedMember?.user.id === projectLeadId;
	const assigneeIsAdmin = selectedMember?.user.system_role === 'admin';
	const submissionFrozen = assigneeIsLead || assigneeIsAdmin;

	useEffect(() => {
		if (submissionFrozen) setRequiresSubmission(false);
	}, [submissionFrozen]);

	const handleCreate = async () => {
		setLoading(true);
		setError(null);

		try {
			await apiClient('/tasks', {
				method: 'POST',
				body: JSON.stringify({
					title,
					description: description || null,
					project_id: projectId,
					assigned_to: assignedTo || null,
					priority,
					requires_submission: requiresSubmission,
					due_date: dueDate || null,
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
		<div className="overlay">
			<div className="modal" onClick={e => e.stopPropagation()}>
				<div className="modalHeader">
					<div className="headerLeft">
						<h2 className="modalTitle">New Task</h2>
						<button
							className={`submissionToggle ${requiresSubmission ? 'submissionToggle--on' : 'submissionToggle--off'} ${submissionFrozen ? 'submissionToggle--frozen' : ''}`}
							onClick={() => !submissionFrozen && setRequiresSubmission(v => !v)}
							title={submissionFrozen ? 'Submission not required for leads and admins' : 'Toggle submission requirement'}
						>
							{requiresSubmission
								? <><Check size={10} strokeWidth={2.5} /> Require Submission</>
								: <><X size={10} strokeWidth={2.5} /> Require Submission</>
							}
						</button>
					</div>
					<button className="closeBtn" onClick={onClose}>✕</button>
				</div>

				<div className="modalBody">
					<div className="fieldGroup">
						<label className="fieldLabel">Title</label>
						<input
							className="input"
							placeholder="Task title"
							value={title}
							onChange={e => setTitle(e.target.value)}
							autoFocus
						/>
					</div>

					<div className="fieldGroup">
						<label className="fieldLabel">Description</label>
						<RichTextEditor
							value={description}
							onChange={setDescription}
							placeholder="Optional description"
							minHeight={100}
						/>
					</div>

					<div className="fieldGroup">
						<label className="fieldLabel">Assign to</label>
						<select
							className="select"
							value={assignedTo}
							onChange={e => setAssignedTo(e.target.value)}
						>
							<option value="">Unassigned</option>
							{members.map(m => (
								<option key={m.user.id} value={m.user.id}>
									{m.user.full_name}
								</option>
							))}
						</select>
					</div>

					<div className="row">
						<div className="fieldGroup">
							<label className="fieldLabel">Priority</label>
							<select
								className="select"
								value={priority}
								onChange={e => setPriority(e.target.value)}
							>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>
						</div>

						<div className="fieldGroup">
							<label className="fieldLabel">Due Date</label>
							<input
								className="input"
								type="date"
								value={dueDate}
								onChange={e => setDueDate(e.target.value)}
							/>
						</div>
					</div>

					{error && <p className="errorMsg">{error}</p>}
				</div>

				<div className="modalFooter">
					<button className="btn secondary" onClick={onClose} disabled={loading}>
						Cancel
					</button>
					<button
						className="btn primary"
						onClick={handleCreate}
						disabled={loading || !title.trim()}
					>
						{loading ? 'Creating...' : 'Create Task'}
					</button>
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
					max-width: 480px;
					max-height: 85vh;
					display: flex;
					flex-direction: column;
					overflow: hidden;
				}

				.modalHeader {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 24px 24px 16px;
					border-bottom: 1px solid var(--border);
					gap: 12px;
				}

				.headerLeft {
					display: flex;
					align-items: center;
					gap: 10px;
					min-width: 0;
				}

				.modalTitle {
					font-family: var(--font-ui);
					font-size: 16px;
					font-weight: 600;
					color: var(--text);
					margin: 0;
					white-space: nowrap;
				}

				.submissionToggle {
					display: inline-flex;
					align-items: center;
					gap: 4px;
					font-family: var(--font-ui);
					font-size: 10px;
					font-weight: 500;
					letter-spacing: 0.04em;
					padding: 2px 7px;
					border-radius: 999px;
					border: 1px solid transparent;
					cursor: pointer;
					transition: background 150ms ease, color 150ms ease, border-color 150ms ease, opacity 150ms ease;
					white-space: nowrap;
					line-height: 1.6;
				}

				.submissionToggle--on {
					background: #dcfce7;
					color: #166534;
					border-color: #86efac;
				}

				.submissionToggle--off {
					background: #f3f4f6;
					color: #6b7280;
					border-color: #d1d5db;
				}

				.submissionToggle--frozen {
					cursor: not-allowed;
					opacity: 0.45;
				}

				.closeBtn {
					background: none;
					border: none;
					font-size: 14px;
					color: var(--muted);
					cursor: pointer;
					padding: 0;
					line-height: 1;
					flex-shrink: 0;
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
					gap: 16px;
				}

				.fieldGroup {
					display: flex;
					flex-direction: column;
					gap: 6px;
					flex: 1;
				}

				.fieldLabel {
					font-family: var(--font-ui);
					font-size: 11px;
					color: var(--muted);
					text-transform: uppercase;
					letter-spacing: 0.05em;
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

				.select {
					font-family: var(--font-ui);
					font-size: 13px;
					color: var(--text);
					background: var(--bg);
					border: 1px solid var(--border);
					border-radius: var(--radius);
					padding: 8px 10px;
					outline: none;
					cursor: pointer;
				}

				.select:focus {
					border-color: var(--accent);
				}

				.row {
					display: flex;
					gap: 12px;
				}

				.errorMsg {
					font-family: var(--font-ui);
					font-size: 13px;
					color: #d94f4f;
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
					color: #ffffff;
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
			`}</style>
		</div>
	);
}