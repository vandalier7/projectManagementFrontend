'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import type { User } from '@/lib/auth';
import RichTextEditor from '@/components/RichTextEditor';
import { Check, X, User as UserIcon } from 'lucide-react';

interface Member {
	id: number;
	user: {
		id: number;
		full_name: string;
		system_role: 'admin' | 'team_member';
		profile_completed: boolean;
	};
}

interface Task {
	id: number;
	title: string;
	description: string | null;
	priority: string;
	due_date: string | null;
	requires_submission: boolean;
	assignee: { id: number; full_name: string } | null;
}

interface Props {
	task: Task;
	members: Member[];
	currentUser: User;
	onClose: () => void;
	onMutate: (updatedTask?: any) => void;
}

export default function TaskEditModal({
	task,
	members,
	currentUser,
	onClose,
	onMutate,
}: Props) {
	const [title, setTitle] = useState(task.title);
	const [description, setDescription] = useState(task.description ?? '');
	const [assignedTo, setAssignedTo] = useState(String(task.assignee?.id ?? ''));
	const [priority, setPriority] = useState(task.priority);
	const [dueDate, setDueDate] = useState(task.due_date ?? '');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Assignee type-in combobox — same pattern as TaskCreateModal.
	const [assigneeQuery, setAssigneeQuery] = useState(task.assignee?.full_name ?? '');
	const [assigneeOpen, setAssigneeOpen] = useState(false);
	const [highlightIndex, setHighlightIndex] = useState(0);
	const assigneeBoxRef = useRef<HTMLDivElement>(null);

	const selectedMember = members.find(m => String(m.user.id) === assignedTo);

	const filteredMembers = members.filter(
	m =>
		m.user.profile_completed &&
		m.user.system_role !== 'admin' &&
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

	const handleSave = async () => {
		setLoading(true);
		setError(null);

		try {
			const updated = await apiClient(`/tasks/${task.id}`, {
				method: 'PUT',
				body: JSON.stringify({
					acting_as_user_id: currentUser.id,
					title,
					description: description || null,
					assigned_to: assignedTo || null,
					priority,
					due_date: dueDate || null,
				}),
			});
			// Same reasoning as TaskCreateModal: the PUT response doesn't
			// carry a loaded `assignee` relation, so it's reattached here
			// from the already-selected member so the caller can splice
			// this straight into its list without refetching.
			const updatedWithAssignee = {
				...task,
				...updated,
				assignee: selectedMember
					? { id: selectedMember.user.id, full_name: selectedMember.user.full_name }
					: null,
			};
			onMutate(updatedWithAssignee);
			onClose();
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110]" onClick={onClose}>
			<div className="bg-surface border border-border rounded-xl shadow-md w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

				<div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border gap-4">
					<div className="flex items-center gap-2.5 min-w-0 shrink-0">
						<h2 className="text-base font-semibold text-text m-0 whitespace-nowrap">Edit Task</h2>

						<span
							title="Submission requirement cannot be changed after task creation"
							className={`inline-flex items-center gap-1 text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-full border cursor-default select-none whitespace-nowrap ${
								task.requires_submission
									? 'bg-green-50 text-green-700 border-green-200'
									: 'bg-gray-100 text-muted border-gray-200'
							}`}
						>
							{task.requires_submission
								? <><Check size={10} strokeWidth={2.5} /> Submission Required</>
								: <><X size={10} strokeWidth={2.5} /> Submission Not Required</>
							}
						</span>
					</div>

					<div className="relative flex items-center gap-1.5 flex-1 min-w-0 max-w-[200px] border border-border rounded bg-bg px-2.5 py-1.5" ref={assigneeBoxRef}>
						<UserIcon size={14} className="text-muted shrink-0" />
						<input
							className="text-sm text-text bg-transparent border-none outline-none min-w-0 w-full"
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
							<div className="absolute top-[calc(100%+4px)] left-0 right-0 min-w-[180px] max-h-[180px] overflow-y-auto bg-surface border border-border rounded shadow-md z-10">
								{comboOptions.length === 0 ? (
									<div className="text-sm text-muted px-2.5 py-2">No matches</div>
								) : (
									comboOptions.map((opt, i) => (
										<div
											key={opt.id || 'unassigned'}
											className={`text-sm text-text px-2.5 py-2 cursor-pointer ${i === highlightIndex ? 'bg-bg' : ''}`}
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

					<button className="text-sm text-muted bg-transparent border-none cursor-pointer hover:text-text p-0 leading-none shrink-0" onClick={onClose}>✕</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-muted uppercase tracking-wide">Title</label>
						<input
							className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors"
							value={title}
							onChange={e => setTitle(e.target.value)}
							autoFocus
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-muted uppercase tracking-wide">Description</label>
						<RichTextEditor
							value={description}
							onChange={setDescription}
							placeholder="Optional description"
							minHeight={100}
						/>
					</div>

					<div className="flex gap-4">
						<div className="flex flex-col gap-1.5 flex-1">
							<label className="text-xs text-muted uppercase tracking-wide">Priority</label>
							<select
								className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors cursor-pointer"
								value={priority}
								onChange={e => setPriority(e.target.value)}
							>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>
						</div>

						<div className="flex flex-col gap-1.5 flex-1">
							<label className="text-xs text-muted uppercase tracking-wide">Due Date</label>
							<input
								type="date"
								className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors"
								value={dueDate}
								onChange={e => setDueDate(e.target.value)}
							/>
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
						className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={handleSave}
						disabled={loading || !title.trim()}
					>
						{loading ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</div>
		</div>
	);
}