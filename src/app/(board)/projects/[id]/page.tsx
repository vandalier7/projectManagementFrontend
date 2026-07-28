'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
	DndContext,
	DragOverlay,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
	DragStartEvent,
} from '@dnd-kit/core';
import {
	SortableContext,
	verticalListSortingStrategy,
	useSortable,
	arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import TaskModal from '@/components/TaskModal';
import TaskCreateModal from '@/components/TaskCreateModal';
import RejectModal from '@/components/RejectModal';
import TaskEditModal from '@/components/TaskEditModal';
import { formatDueDate } from '@/lib/formatDueDate';
import {
	useSetAppBarActions,
	useSetBoardTitle,
	useSetBoardTitleAdornment,
	useSetBoardLogo,    
	useSetBoardState
} from '@/components/layout/AppBarActionsContext';
import ProjectGuard from '@/components/feedback/ProjectGuard';
import PageNotice from '@/components/feedback/PageNotice';
import PageLoading from '@/components/feedback/PageLoading';
import { FolderLock, FolderSearch, FolderX, ListFilter, GripVertical } from 'lucide-react';

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
	is_system: boolean;
	logo_url: string | null;
}

const COLUMNS: { key: Task['status']; label: string }[] = [
	{ key: 'todo', label: 'To Do' },
	{ key: 'in_progress', label: 'In Progress' },
	{ key: 'submitted', label: 'Submitted' },
];

// Priority accent — pulled from the maroon-ish theme palette itself
// (accent = deep maroon, accent-hover = warm coral, muted = soft brown)
// rather than generic red/green/blue, so priority coloring stays
// consistent with the rest of the UI.
function getPriorityCardClasses(priority: string): { bg: string; border: string; accent: string } {
	switch (priority) {
		case 'high':
			return { bg: 'bg-surface', border: 'border-border', accent: 'border-l-accent' };
		case 'medium':
			return { bg: 'bg-surface', border: 'border-border', accent: 'border-l-accent-hover' };
		case 'low':
			return { bg: 'bg-surface', border: 'border-border', accent: 'border-l-muted' };
		default:
			return { bg: 'bg-surface', border: 'border-border', accent: 'border-l-border' };
	}
}

function getDueInfo(task: Task) {
	if (!task.due_date || task.status === 'submitted' || task.status === 'done') return null;
	return formatDueDate(task.due_date);
}

function TaskCardBody({ task }: { task: Task }) {
	if (!task.assignee) return null;

	return (
		<div className="flex items-center justify-end">
			<span className="text-xs text-muted">{task.assignee.full_name}</span>
		</div>
	);
}

function TaskCardVisual({
	task,
	dragHandleProps,
	showHandle = false,
}: {
	task: Task;
	dragHandleProps?: { attributes?: any; listeners?: any };
	showHandle?: boolean;
}) {
	const dueInfo = getDueInfo(task);
	const priorityClasses = getPriorityCardClasses(task.priority);
	const cardBorderClasses = dueInfo?.urgent
		? 'border border-l-4 border-danger'
		: `border ${priorityClasses.border} border-l-4 ${priorityClasses.accent}`;

	return (
		<div
			className={`${priorityClasses.bg} ${cardBorderClasses} relative rounded shadow-sm p-3 ${showHandle ? 'pr-7' : ''} flex flex-col gap-2`}
		>
			<div className="flex items-start justify-between gap-2">
				<span className="text-sm font-medium text-text leading-snug">{task.title}</span>
				{dueInfo && (
					<span className={`font-mono text-xs whitespace-nowrap shrink-0 ${dueInfo.urgent ? 'text-danger' : 'text-muted'}`}>
						{dueInfo.label}
					</span>
				)}
			</div>

			<TaskCardBody task={task} />

			{showHandle && (
				<span
					className="absolute right-1 top-1/2 -translate-y-1/2 text-muted cursor-grab active:cursor-grabbing select-none hover:text-text"
					{...(dragHandleProps?.attributes ?? {})}
					{...(dragHandleProps?.listeners ?? {})}
					onClick={e => e.stopPropagation()}
					title="Drag to reorder"
				>
					<GripVertical className="h-4 w-4" />
				</span>
			)}
		</div>
	);
}

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
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`cursor-pointer transition-shadow hover:shadow-md ${isDragging ? 'opacity-0' : ''}`}
			onClick={onClick}
		>
			<TaskCardVisual task={task} dragHandleProps={{ attributes, listeners }} showHandle />
		</div>
	);
}

function StaticTaskCard({
	task,
	onClick,
}: {
	task: Task;
	onClick: () => void;
}) {
	return (
		<div className="cursor-pointer transition-shadow hover:shadow-md" onClick={onClick}>
			<TaskCardVisual task={task} />
		</div>
	);
}

function BoardColumn({
	col,
	colTasks,
	sensors,
	canReorder,
	onDragEnd,
	onTaskClick,
}: {
	col: { key: Task['status']; label: string };
	colTasks: Task[];
	sensors: ReturnType<typeof useSensors>;
	canReorder: boolean;
	onDragEnd: (event: DragEndEvent, status: Task['status']) => void;
	onTaskClick: (task: Task) => void;
}) {
	const listRef = useRef<HTMLDivElement>(null);
	const [lockedHeight, setLockedHeight] = useState<number | null>(null);
	const [activeTask, setActiveTask] = useState<Task | null>(null);

	const handleDragStart = (event: DragStartEvent) => {
		if (listRef.current) {
			setLockedHeight(listRef.current.offsetHeight);
		}
		const task = colTasks.find(t => t.id === event.active.id) ?? null;
		setActiveTask(task);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setLockedHeight(null);
		setActiveTask(null);
		onDragEnd(event, col.key);
	};

	const handleDragCancel = () => {
		setLockedHeight(null);
		setActiveTask(null);
	};

	return (
		<div className="min-w-60 flex-1 flex flex-col gap-2">
			<div className="flex items-center justify-between px-1 pb-2 border-b border-border">
				<span className="text-sm font-semibold text-text">{col.label}</span>
				<span className="font-mono text-xs text-muted">{colTasks.length}</span>
			</div>

			{canReorder ? (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					onDragCancel={handleDragCancel}
				>
					<SortableContext
						items={colTasks.map(t => t.id)}
						strategy={verticalListSortingStrategy}
					>
						<div
							ref={listRef}
							className="flex flex-col gap-2"
							style={lockedHeight !== null ? { height: lockedHeight, overflow: 'hidden' } : undefined}
						>
							{colTasks.map(task => (
								<SortableTaskCard
									key={task.id}
									task={task}
									onClick={() => onTaskClick(task)}
								/>
							))}
							{colTasks.length === 0 && (
								<p className="text-xs text-muted px-1 py-2 m-0">No tasks</p>
							)}
						</div>
					</SortableContext>

					<DragOverlay>
						{activeTask && (
							<div className="shadow-lg rounded">
								<TaskCardVisual task={activeTask} showHandle />
							</div>
						)}
					</DragOverlay>
				</DndContext>
			) : (
				<div className="flex flex-col gap-2">
					{colTasks.map(task => (
						<StaticTaskCard
							key={task.id}
							task={task}
							onClick={() => onTaskClick(task)}
						/>
					))}
					{colTasks.length === 0 && (
						<p className="text-xs text-muted px-1 py-2 m-0">No tasks</p>
					)}
				</div>
			)}
		</div>
	);
}

export default function ProjectTasksPage() {
	const params = useParams();
	const router = useRouter();
	const projectId = params.id;

	const [user, setUser] = useState<User | null>(null);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [rejectTask, setRejectTask] = useState<Task | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editTask, setEditTask] = useState<Task | null>(null);

	const [showMineOnly, setShowMineOnly] = useState(false);

	const [localTasks, setLocalTasks] = useState<Task[]>([]);

	useEffect(() => {
		setUser(getUser());
	}, []);

	const { data: project, error, isLoading, mutate } = useSWR<Project>(
		user ? `/projects/${projectId}?user=${user.id}` : null
	);

	useEffect(() => {
		if (project?.tasks) {
			setLocalTasks([...project.tasks].sort((a, b) => a.sort_order - b.sort_order));
		}
	}, [project?.tasks]);

	useEffect(() => {
		if (project?.is_system) {
			router.replace('/dashboard');
		}
	}, [project?.is_system, router]);

	const handleMutate = useCallback(() => mutate(), [mutate]);
	const { syncStatus } = useHeartbeat(project?.id ?? null, handleMutate);

	const isAdmin = user?.system_role === 'admin';
	const isLead = user?.id === project?.lead_id;
	const canManage = isAdmin || isLead;

	const canReorder = canManage;

	const visibleTasks = useMemo(() => {
		if (!showMineOnly || !user) return localTasks;
		return localTasks.filter(t => !t.assignee || t.assignee.id === user.id);
	}, [localTasks, showMineOnly, user]);

	const tasksByStatus = (status: Task['status']) =>
		visibleTasks.filter(t => t.status === status);

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

		setLocalTasks(prev => {
			const others = prev.filter(t => t.status !== status);
			return [...others, ...reordered];
		});

		try {
			await apiClient('/tasks/reorder', {
				method: 'POST',
				body: JSON.stringify({ ordered_ids: reordered.map(t => t.id) }),
			});
		} catch {
			mutate();
		}
	};

	const boardTitle =
		error
			? ''
			: project?.name ?? null;
	useSetBoardTitle(boardTitle);

	const boardLogoUrl = error ? null : project?.logo_url ?? null;
	useSetBoardLogo(boardLogoUrl);

	const syncIndicator = useMemo(
		() => (
			<span className={`font-mono text-xs ${syncStatus === 'syncing' ? 'text-accent' : 'text-muted'}`}>
				{syncStatus === 'syncing' ? 'Syncing...' : 'Up to date'}
			</span>
		),
		[syncStatus]
	);

	const boardAdornment =
	error
		? null
		: syncIndicator;

	useSetBoardTitleAdornment(boardAdornment);

	const boardActions = useMemo(
		() => (
			<div className="flex items-center gap-2">
				<button
					onClick={() => setShowMineOnly(v => !v)}
					aria-pressed={showMineOnly}
					className={`flex items-center gap-1.5 text-sm font-medium rounded px-3 py-2 border cursor-pointer transition-colors ${
						showMineOnly
							? 'bg-accent/10 border-accent text-accent'
							: 'bg-transparent border-border text-muted hover:text-text'
					}`}
					title="Show only unassigned tasks and tasks assigned to me"
				>
					<ListFilter className="h-4 w-4" />
					{showMineOnly ? 'My Tasks' : 'All Tasks'}
				</button>

				{canManage && (
					<button
						className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover"
						onClick={() => setShowCreateModal(true)}
					>
						New Task
					</button>
				)}
			</div>
		),
		[canManage, showMineOnly]
	);

	useSetAppBarActions(boardActions);


	return (
		<ProjectGuard
			isLoading={isLoading}
			error={error}
		>
				<div className="flex gap-4 overflow-x-auto items-start">
				{COLUMNS.map(col => {
					const colTasks = tasksByStatus(col.key);

					return (
						<BoardColumn
							key={col.key}
							col={col}
							colTasks={colTasks}
							sensors={sensors}
							canReorder={canReorder}
							onDragEnd={handleDragEnd}
							onTaskClick={setSelectedTask}
						/>
					);
				})}

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
						onEdit={(task) => {
							setSelectedTask(null);
							setEditTask(task);
						}}
						isSystemProject={project.is_system}
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
			</div>
		</ProjectGuard>
	);
}