'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import {
	DndContext,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core';
import {
	SortableContext,
	verticalListSortingStrategy,
	useSortable,
	arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getToken, getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import TaskModal from '@/components/TaskModal';
import TaskCreateModal from '@/components/TaskCreateModal';
import RejectModal from '@/components/RejectModal';
import AddMemberPanel from '@/components/AddMemberPanel';
import { formatDueDate } from '@/lib/formatDueDate';
import TaskEditModal from '@/components/TaskEditModal';

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
	sort_order: number;
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

interface Member {
    id: number;
    user: {
        id: number;
        full_name: string;
        system_role: 'admin' | 'team_member';
    };
}

interface Project {
	id: number;
	name: string;
	status: string;
	lead_id: number;
	lead: { full_name: string } | null;
	tasks: Task[];
	members: Member[];
	task_default_submission_mode: 'require' | 'no_require' | 'match_last';
}

interface AllUser {
	id: number;
	full_name: string;
}

const COLUMNS: { key: Task['status']; label: string }[] = [
	{ key: 'todo', label: 'To Do' },
	{ key: 'in_progress', label: 'In Progress' },
	{ key: 'submitted', label: 'Submitted' },
	{ key: 'done', label: 'Done' },
];

const priorityStyles: Record<string, string> = {
	high: 'bg-red-50 text-red-800',
	medium: 'bg-yellow-50 text-yellow-800',
	low: 'bg-gray-100 text-muted',
};

const chipStyles: Record<string, string> = {
	active: 'bg-green-100 text-green-800',
	inactive: 'bg-gray-100 text-muted',
	archived: 'bg-gray-100 text-muted',
};

// --- Sortable task card ---
function SortableTaskCard({
	task,
	onClick,
}: {
	task: Task;
	onClick: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: task.id });

	const style = {
		transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
		transition,
		opacity: isDragging ? 0.4 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="bg-surface border border-border rounded shadow-sm p-3 flex flex-col gap-2 cursor-pointer transition-shadow hover:shadow-md"
			onClick={onClick}
		>
			<div className="flex items-start justify-between gap-2">
				<span className="text-sm font-medium text-text leading-snug">{task.title}</span>
				<div className="flex items-center gap-1.5">
					{task.requires_submission && (
						<span className="w-2 h-2 min-w-2 rounded-full bg-accent mt-1" title="Requires submission" />
					)}
					<span
						className="text-muted cursor-grab active:cursor-grabbing select-none px-0.5 hover:text-text"
						{...attributes}
						{...listeners}
						onClick={e => e.stopPropagation()}
						title="Drag to reorder"
					>
						⠿
					</span>
				</div>
			</div>

			<div className="flex items-center justify-between gap-2">
				<span className={`font-mono text-xs tracking-wide px-1.5 py-0.5 rounded lowercase ${priorityStyles[task.priority] ?? 'bg-gray-100 text-muted'}`}>
					{task.priority}
				</span>
				{task.assignee && (
					<span className="text-xs text-muted">{task.assignee.full_name}</span>
				)}
			</div>

			{task.due_date && task.status !== 'submitted' && task.status !== 'done' && (() => {
				const { label, urgent } = formatDueDate(task.due_date!);
				return (
					<span className={`font-mono text-xs ${urgent ? 'text-danger' : 'text-muted'}`}>
						{label}
					</span>
				);
			})()}
		</div>
	);
}

// --- Board page ---
export default function ProjectBoardPage() {
	const router = useRouter();
	const params = useParams();
	const projectId = params.id;

	const [user, setUser] = useState<User | null>(null);
	const [hasToken, setHasToken] = useState<boolean | null>(null);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [rejectTask, setRejectTask] = useState<Task | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editTask, setEditTask] = useState<Task | null>(null);

	// Local task order state — mirrors server but allows optimistic reordering.
	const [localTasks, setLocalTasks] = useState<Task[]>([]);

	useEffect(() => {
		if (!getToken()) {
			router.push('/login');
			setHasToken(false);
			return;
		}
		setUser(getUser());
		setHasToken(true);
	}, [router]);

	const { data: project, error, isLoading, mutate } = useSWR<Project>(
		hasToken && user ? `/projects/${projectId}?user=${user.id}` : null
	);

	// Sync local tasks from server data.
	useEffect(() => {
		if (project?.tasks) {
			setLocalTasks([...project.tasks].sort((a, b) => a.sort_order - b.sort_order));
		}
	}, [project?.tasks]);

	const handleMutate = useCallback(() => mutate(), [mutate]);
	const { syncStatus } = useHeartbeat(project?.id ?? null, handleMutate);

	const isAdmin = user?.system_role === 'admin';
	const isLead = user?.id === project?.lead_id;
	const canCreateTask = isAdmin || isLead;
	const canManageMembers = isAdmin || isLead;

	const { data: allUsers } = useSWR<AllUser[]>(hasToken ? '/users' : null);

	const tasksByStatus = (status: Task['status']) =>
		localTasks.filter(t => t.status === status);

	const defaultRequiresSubmission =
		project?.task_default_submission_mode === 'no_require' ? false : true;

	const sensors = useSensors(useSensor(PointerSensor, {
		activationConstraint: { distance: 5 },
	}));

	const handleDragEnd = async (event: DragEndEvent, status: Task['status']) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const columnTasks = tasksByStatus(status);
		const oldIndex = columnTasks.findIndex(t => t.id === active.id);
		const newIndex = columnTasks.findIndex(t => t.id === over.id);

		const reordered = arrayMove(columnTasks, oldIndex, newIndex);

		// Optimistically update local state.
		setLocalTasks(prev => {
			const others = prev.filter(t => t.status !== status);
			return [...others, ...reordered];
		});

		// Persist to server.
		try {
			await apiClient('/tasks/reorder', {
				method: 'POST',
				body: JSON.stringify({ ordered_ids: reordered.map(t => t.id) }),
			});
		} catch {
			// On failure, revert by resyncing from server.
			mutate();
		}
	};

	if (error?.message === 'You do not have access to this project.') {
		return (
			<main className="min-h-screen bg-bg flex items-center justify-center">
				<div className="bg-surface border border-border rounded-xl shadow-md px-10 py-12 w-full max-w-md flex flex-col gap-4">
					<h1 className="text-xl font-semibold text-text m-0">Access Denied</h1>
					<p className="text-sm text-muted m-0">You do not have access to this project.</p>
					<button
						className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover self-start"
						onClick={() => router.replace('/projects')}
					>
						Back to Projects
					</button>
				</div>
			</main>
		);
	}

	if (error && error.message !== 'You do not have access to this project.') {
		return (
			<main className="min-h-screen bg-bg flex items-center justify-center">
				<div className="bg-surface border border-border rounded-xl shadow-md px-10 py-12 w-full max-w-md flex flex-col gap-4">
					<h1 className="text-xl font-semibold text-text m-0">Project Not Found</h1>
					<p className="text-sm text-muted m-0">This project does not exist or has been removed.</p>
					<button
						className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover self-start"
						onClick={() => router.replace('/projects')}
					>
						Back to Projects
					</button>
				</div>
			</main>
		);
	}

	if (!project && isLoading) {
		return (
			<main className="min-h-screen bg-bg flex items-center justify-center">
				<p className="text-sm text-muted">Loading...</p>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-bg flex">
			{/* Sidebar */}
			<aside className="w-60 min-w-60 bg-surface border-r border-border px-6 py-8 flex flex-col gap-4">
				<button
					className="text-sm text-muted cursor-pointer hover:text-text transition-colors bg-transparent border-none p-0 self-start"
					onClick={() => router.push('/projects')}
				>
					← Projects
				</button>

				{isLoading && <p className="text-sm text-muted">Loading...</p>}
				{project && (
					<>
						<h1 className="text-lg font-semibold text-text m-0">{project.name}</h1>

						<span className={`font-mono text-xs tracking-wide px-2 py-0.5 rounded lowercase self-start ${chipStyles[project.status] ?? 'bg-gray-100 text-muted'}`}>
							{project.status}
						</span>

						<span className={`text-xs font-mono ${syncStatus === 'syncing' ? 'text-accent' : 'text-muted'}`}>
							{syncStatus === 'syncing' ? 'Syncing...' : 'Up to date'}
						</span>

						<div className="flex flex-col gap-0.5">
							<span className="text-xs text-muted uppercase tracking-wide">Lead</span>
							<span className="text-sm text-text">
								{project.lead ? project.lead.full_name : '—'}
							</span>
						</div>

						{canManageMembers ? (
							<AddMemberPanel
								projectId={project.id}
								members={project.members}
								allUsers={allUsers ?? []}
								onMutate={() => mutate()}
							/>
						) : (
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted uppercase tracking-wide">Members</span>
								{project.members.length === 0 && (
									<span className="text-sm text-muted">No members yet.</span>
								)}
								{project.members.map(m => (
									<span key={m.id} className="text-sm text-text">{m.user.full_name}</span>
								))}
							</div>
						)}

						{canCreateTask && (
							<button
								className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover mt-2"
								onClick={() => setShowCreateModal(true)}
							>
								+ New Task
							</button>
						)}
					</>
				)}
			</aside>

			{/* Board */}
			<div className="flex-1 flex gap-4 px-6 py-8 overflow-x-auto items-start">
			{COLUMNS.map(col => {
				const colTasks = tasksByStatus(col.key);
				return (
					<div key={col.key} className="min-w-60 w-60 flex flex-col gap-2">
						<div className="flex items-center justify-between px-1 pb-2 border-b border-border">
							<span className="text-sm font-semibold text-text">{col.label}</span>
							<span className="font-mono text-xs text-muted">{colTasks.length}</span>
						</div>

						{col.key === 'done' ? (
							<div className="flex flex-col gap-2">
								{colTasks.map(task => (
									<div
										key={task.id}
										className="bg-surface border border-border rounded shadow-sm p-3 flex flex-col gap-2 cursor-pointer transition-shadow hover:shadow-md"
										onClick={() => setSelectedTask(task)}
									>
										<div className="flex items-start justify-between gap-2">
											<span className="text-sm font-medium text-text leading-snug">{task.title}</span>
											{task.requires_submission && (
												<span className="w-2 h-2 min-w-2 rounded-full bg-accent mt-1" title="Requires submission" />
											)}
										</div>
										<div className="flex items-center justify-between gap-2">
											<span className={`font-mono text-xs tracking-wide px-1.5 py-0.5 rounded lowercase ${priorityStyles[task.priority] ?? 'bg-gray-100 text-muted'}`}>
												{task.priority}
											</span>
											{task.assignee && (
												<span className="text-xs text-muted">{task.assignee.full_name}</span>
											)}
										</div>
									</div>
								))}
								{colTasks.length === 0 && (
									<p className="text-xs text-muted px-1 py-2 m-0">No tasks</p>
								)}
							</div>
						) : (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={(e) => handleDragEnd(e, col.key)}
							>
								<SortableContext
									items={colTasks.map(t => t.id)}
									strategy={verticalListSortingStrategy}
								>
									<div className="flex flex-col gap-2">
										{colTasks.map(task => (
											<SortableTaskCard
												key={task.id}
												task={task}
												onClick={() => setSelectedTask(task)}
											/>
										))}
										{colTasks.length === 0 && (
											<p className="text-xs text-muted px-1 py-2 m-0">No tasks</p>
										)}
									</div>
								</SortableContext>
							</DndContext>
						)}
					</div>
				);
			})}
		</div>

			{selectedTask && user && project && (
				<TaskModal
					task={selectedTask}
					projectLeadId={project.lead_id}
					currentUser={user}
					onClose={() => setSelectedTask(null)}
					onMutate={() => mutate()}
					onReject={(task) => {
						setSelectedTask(null);
						setRejectTask(task);
					}}
					onEdit={() => {
						setSelectedTask(null);
						setEditTask(selectedTask);
					}}
				/>
			)}

			{editTask && user && project && (
				<TaskEditModal
					task={editTask}
					members={project.members}
					currentUser={user}
					onClose={() => setEditTask(null)}
					onMutate={() => mutate()}
				/>
			)}

			{rejectTask && user && project && (
				<RejectModal
					task={rejectTask}
					members={project.members}
					currentUser={user}
					onClose={() => setRejectTask(null)}
					onMutate={() => mutate()}
				/>
			)}

			{showCreateModal && user && project && (
				<TaskCreateModal
					projectId={project.id}
					members={project.members}
					currentUser={user}
					defaultRequiresSubmission={defaultRequiresSubmission}
					onClose={() => setShowCreateModal(false)}
					onMutate={() => mutate()}
					projectLeadId={project.lead_id}
				/>
			)}
		</main>
	);
}