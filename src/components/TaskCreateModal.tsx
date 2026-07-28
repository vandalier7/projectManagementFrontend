'use client';

import { useState, useRef } from 'react';
import { apiClient } from '@/lib/api';
import type { User } from '@/lib/auth';
import { useEffect } from 'react';
import RichTextEditor from '@/components/RichTextEditor';
import { Check, X, User as UserIcon } from 'lucide-react';

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
	onMutate: (createdTask?: any) => void;
	projectLeadId: number;
	// System project tasks never require submission — the toggle is frozen
	// off entirely here, same as the lead/admin-assignee freeze below, just
	// project-wide instead of per-assignee.
	isSystemProject?: boolean;
}

export default function TaskCreateModal({
	projectId,
	members,
	currentUser,
	defaultRequiresSubmission,
	onClose,
	onMutate,
	projectLeadId,
	isSystemProject = false,
}: Props) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [assignedTo, setAssignedTo] = useState<string>('');
	const [assigneeQuery, setAssigneeQuery] = useState('');
	const [assigneeOpen, setAssigneeOpen] = useState(false);
	const [highlightIndex, setHighlightIndex] = useState(0);
	const assigneeBoxRef = useRef<HTMLDivElement>(null);
	const [priority, setPriority] = useState('medium');
	const [requiresSubmission, setRequiresSubmission] = useState(isSystemProject ? false : defaultRequiresSubmission);
	const [dueDate, setDueDate] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const selectedMember = members.find(m => String(m.user.id) === assignedTo);
	const assigneeIsLead = selectedMember?.user.id === projectLeadId;
	const assigneeIsAdmin = selectedMember?.user.system_role === 'admin';
	const submissionFrozen = isSystemProject || assigneeIsLead || assigneeIsAdmin;

	useEffect(() => {
		if (submissionFrozen) setRequiresSubmission(false);
	}, [submissionFrozen]);

	// Combobox options: "Unassigned" always first, then members filtered by
	// the typed query (case-insensitive substring match on full_name).
	const filteredMembers = members.filter(m =>
		m.user.full_name.toLowerCase().includes(assigneeQuery.toLowerCase())
	);
	const comboOptions: { id: string; label: string }[] = [
		{ id: '', label: 'Unassigned' },
		...filteredMembers.map(m => ({ id: String(m.user.id), label: m.user.full_name })),
	];

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (assigneeBoxRef.current && !assigneeBoxRef.current.contains(e.target as Node)) {
				setAssigneeOpen(false);
				// Snap the visible text back to the actual selection if the
				// user typed something then clicked away without picking.
				setAssigneeQuery(selectedMember?.user.full_name ?? '');
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [selectedMember]);

	const selectAssignee = (id: string, label: string) => {
		setAssignedTo(id);
		setAssigneeQuery(id === '' ? '' : label);
		setAssigneeOpen(false);
	};

	const handleAssigneeKeyDown = (e: React.KeyboardEvent) => {
		if (!assigneeOpen) {
			if (e.key === 'ArrowDown' || e.key === 'Enter') {
				setAssigneeOpen(true);
				setHighlightIndex(0);
			}
			return;
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setHighlightIndex(i => Math.min(i + 1, comboOptions.length - 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setHighlightIndex(i => Math.max(i - 1, 0));
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const opt = comboOptions[highlightIndex];
			if (opt) selectAssignee(opt.id, opt.label);
		} else if (e.key === 'Escape') {
			setAssigneeOpen(false);
			setAssigneeQuery(selectedMember?.user.full_name ?? '');
		}
	};

	const handleCreate = async () => {
		setLoading(true);
		setError(null);

		try {
			const created = await apiClient('/tasks', {
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
			// The backend's store() returns the bare Task model — no
			// `assignee` relation loaded — so it's attached here from the
			// already-selected member, letting the caller render the new
			// task instantly without a second round-trip to refetch it.
			const createdWithAssignee = {
				...created,
				assignee: selectedMember
					? { id: selectedMember.user.id, full_name: selectedMember.user.full_name }
					: null,
			};
			onMutate(createdWithAssignee);
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
							title={isSystemProject ? 'Submission is never required for system project tasks' : submissionFrozen ? 'Submission not required for leads and admins' : 'Toggle submission requirement'}
						>
							{requiresSubmission
								? <><Check size={10} strokeWidth={2.5} /> Require Submission</>
								: <><X size={10} strokeWidth={2.5} /> Require Submission</>
							}
						</button>
					</div>

					<div className="headerAssignee" ref={assigneeBoxRef}>
						<UserIcon size={14} className="headerAssigneeIcon" />
						<input
							className="headerAssigneeInput"
							placeholder="Unassigned"
							value={assigneeQuery}
							onChange={e => {
								setAssigneeQuery(e.target.value);
								setAssigneeOpen(true);
								setHighlightIndex(0);
							}}
							onFocus={() => setAssigneeOpen(true)}
							onKeyDown={handleAssigneeKeyDown}
						/>
						{assigneeOpen && (
							<div className="comboList comboList--header">
								{comboOptions.length === 0 ? (
									<div className="comboEmpty">No matches</div>
								) : (
									comboOptions.map((opt, i) => (
										<div
											key={opt.id || 'unassigned'}
											className={`comboOption ${i === highlightIndex ? 'comboOption--active' : ''}`}
											onMouseDown={e => {
												e.preventDefault();
												selectAssignee(opt.id, opt.label);
											}}
											onMouseEnter={() => setHighlightIndex(i)}
										>
											{opt.label}
										</div>
									))
								)}
							</div>
						)}
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
					max-width: 620px;
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
					gap: 16px;
				}

				.headerAssignee {
					position: relative;
					display: flex;
					align-items: center;
					gap: 6px;
					flex: 1;
					min-width: 0;
					max-width: 200px;
					border: 1px solid var(--border);
					border-radius: var(--radius);
					padding: 6px 10px;
					background: var(--bg);
				}

				.headerAssigneeIcon {
					color: var(--muted);
					flex-shrink: 0;
				}

				.headerAssigneeInput {
					font-family: var(--font-ui);
					font-size: 13px;
					color: var(--text);
					background: transparent;
					border: none;
					outline: none;
					min-width: 0;
					width: 100%;
				}

				.comboList--header {
					top: calc(100% + 4px);
					left: 0;
					right: 0;
					min-width: 180px;
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
					cursor: default;
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

				.comboList {
					position: absolute;
					top: calc(100% + 4px);
					left: 0;
					right: 0;
					max-height: 180px;
					overflow-y: auto;
					background: var(--surface);
					border: 1px solid var(--border);
					border-radius: var(--radius);
					box-shadow: var(--shadow-md);
					z-index: 10;
				}

				.comboOption {
					font-family: var(--font-ui);
					font-size: 13px;
					color: var(--text);
					padding: 8px 10px;
					cursor: pointer;
				}

				.comboOption--active {
					background: var(--bg);
				}

				.comboEmpty {
					font-family: var(--font-ui);
					font-size: 13px;
					color: var(--muted);
					padding: 8px 10px;
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