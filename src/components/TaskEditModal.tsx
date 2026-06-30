'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { User } from '@/lib/auth';


interface Member {
	id: number;
	user: {
		id: number;
		full_name: string;
		system_role: 'admin' | 'team_member';
	};
}

interface Task {
	id: number;
	title: string;
	description: string | null;
	priority: string;
	due_date: string | null;
	assignee: { id: number; full_name: string } | null;
}

interface Props {
	task: Task;
	members: Member[];
	currentUser: User;
	onClose: () => void;
	onMutate: () => void;
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

	const handleSave = async () => {
		setLoading(true);
		setError(null);

		try {
			await apiClient(`/tasks/${task.id}`, {
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
					<h2 className="text-base font-semibold text-text m-0">Edit Task</h2>
					<button className="text-sm text-muted bg-transparent border-none cursor-pointer hover:text-text p-0 leading-none" onClick={onClose}>✕</button>
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
						<textarea
							className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors resize-none min-h-20"
							value={description}
							onChange={e => setDescription(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-muted uppercase tracking-wide">Assign to</label>
						<select
							className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors cursor-pointer"
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