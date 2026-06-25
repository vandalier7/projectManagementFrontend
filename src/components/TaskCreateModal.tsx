'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import type { User } from '@/lib/auth';

interface Member {
	id: number;
	user: {
		id: number;
		full_name: string;
	};
}

interface Props {
	projectId: number;
	members: Member[];
	currentUser: User;
	defaultRequiresSubmission: boolean;
	onClose: () => void;
	onMutate: () => void;
}

export default function TaskCreateModal({
	projectId,
	members,
	currentUser,
	defaultRequiresSubmission,
	onClose,
	onMutate,
}: Props) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [assignedTo, setAssignedTo] = useState<string>('');
	const [priority, setPriority] = useState('medium');
	const [requiresSubmission, setRequiresSubmission] = useState(defaultRequiresSubmission);
	const [dueDate, setDueDate] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
		<div className="overlay" onClick={onClose}>
			<div className="modal" onClick={e => e.stopPropagation()}>
				<div className="modalHeader">
					<h2 className="modalTitle">New Task</h2>
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
						<textarea
							className="textarea"
							placeholder="Optional description"
							value={description}
							onChange={e => setDescription(e.target.value)}
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

					<div className="toggleRow">
						<span className="fieldLabel">Requires Submission</span>
						<button
							className={`toggle ${requiresSubmission ? 'toggle--on' : 'toggle--off'}`}
							onClick={() => setRequiresSubmission(v => !v)}
						>
							<span className="toggleKnob" />
						</button>
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
				}

				.modalTitle {
					font-family: var(--font-ui);
					font-size: 16px;
					font-weight: 600;
					color: var(--text);
					margin: 0;
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

				.toggleRow {
					display: flex;
					align-items: center;
					justify-content: space-between;
				}

				.toggle {
					width: 36px;
					height: 20px;
					border-radius: 10px;
					border: none;
					cursor: pointer;
					position: relative;
					transition: background 150ms ease;
					padding: 0;
				}

				.toggle--on {
					background: var(--accent);
				}

				.toggle--off {
					background: var(--border);
				}

				.toggleKnob {
					position: absolute;
					top: 3px;
					width: 14px;
					height: 14px;
					border-radius: 50%;
					background: #FFFFFF;
					transition: left 150ms ease;
				}

				.toggle--on .toggleKnob {
					left: 19px;
				}

				.toggle--off .toggleKnob {
					left: 3px;
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
			`}</style>
		</div>
	);
}