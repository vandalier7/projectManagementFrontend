'use client';

import { useMemo, useState } from 'react';
import { ListFilter } from 'lucide-react';
import { useSetAppBarActions } from '@/components/layout/AppBarActionsContext';
import Button from '@/components/ui/Button';
import { RejectTaskModal, TaskCreateModal, TaskDetailModal, TaskEditModal } from '@/features/tasks';
import type { Project, Task, User } from '@/types';
import { useBoardTasks } from '../hooks/useBoardTasks';
import BoardColumn, { type ColumnDef } from './BoardColumn';

/** Done and closed tasks leave the board; the timeline shows them. */
const COLUMNS: ColumnDef[] = [
	{ key: 'todo', label: 'To Do' },
	{ key: 'in_progress', label: 'In Progress' },
	{ key: 'submitted', label: 'Submitted' },
];

type ModalState =
	| { kind: 'none' }
	| { kind: 'details'; task: Task }
	| { kind: 'edit'; task: Task }
	| { kind: 'reject'; task: Task }
	| { kind: 'create' };

/**
 * Kanban board for one project: columns, the filter/new-task actions in the
 * app bar, and the task modals.
 */
export default function ProjectBoard({
	project,
	currentUser,
	refresh,
	initialTask = null,
}: {
	project: Project;
	currentUser: User;
	refresh: () => void;
	/** Task to open on load, e.g. from a notification link (?task=123). */
	initialTask?: Task | null;
}) {
	const [modal, setModal] = useState<ModalState>(initialTask ? { kind: 'details', task: initialTask } : { kind: 'none' });
	const close = () => setModal({ kind: 'none' });
	const board = useBoardTasks(project.tasks, currentUser.id, refresh);

	const canManage = currentUser.system_role === 'admin' || currentUser.id === project.lead_id;

	useSetAppBarActions(
		useMemo(
			() => (
				<div className="flex items-center gap-2">
					<button
						onClick={board.toggleMineOnly}
						aria-pressed={board.showMineOnly}
						className={`flex items-center gap-1.5 text-sm font-medium rounded px-3 py-2 border cursor-pointer transition-colors ${
							board.showMineOnly ? 'bg-accent/10 border-accent text-accent' : 'bg-transparent border-border text-muted hover:text-text'
						}`}
						title="Show only unassigned tasks and tasks assigned to me"
					>
						<ListFilter className="h-4 w-4" />
						{board.showMineOnly ? 'My Tasks' : 'All Tasks'}
					</button>

					{canManage && (
						<Button variant="primary" className="text-accent-foreground" onClick={() => setModal({ kind: 'create' })}>
							New Task
						</Button>
					)}
				</div>
			),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[canManage, board.showMineOnly]
		)
	);

	return (
		<div className="flex gap-4 overflow-x-auto items-start">
			{COLUMNS.map(column => (
				<BoardColumn
					key={column.key}
					column={column}
					tasks={board.byStatus(column.key)}
					canReorder={canManage}
					onReorder={board.reorder}
					onTaskClick={task => setModal({ kind: 'details', task })}
				/>
			))}

			{modal.kind === 'details' && (
				<TaskDetailModal
					key={modal.task.id}
					task={modal.task}
					currentUser={currentUser}
					projectLeadId={project.lead_id}
					onClose={close}
					onChanged={refresh}
					onEdit={task => setModal({ kind: 'edit', task })}
					onReject={task => setModal({ kind: 'reject', task })}
					subtitle={task => <span className="text-xs text-muted">{task.assignee?.full_name ?? 'Unassigned'}</span>}
				/>
			)}

			{modal.kind === 'edit' && (
				<TaskEditModal task={modal.task} members={project.members} onClose={close} onSaved={refresh} />
			)}

			{modal.kind === 'reject' && (
				<RejectTaskModal task={modal.task} members={project.members} onClose={close} onRejected={refresh} />
			)}

			{modal.kind === 'create' && (
				<TaskCreateModal
					projectId={project.id}
					projectLeadId={project.lead_id}
					members={project.members}
					defaultRequiresSubmission={project.task_default_submission_mode !== 'no_require'}
					onClose={close}
					onCreated={refresh}
				/>
			)}
		</div>
	);
}
