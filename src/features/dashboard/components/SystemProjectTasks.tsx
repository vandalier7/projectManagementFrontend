'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Plus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { projectKeys } from '@/features/projects/hooks/useProject';
import { TaskCreateModal, TaskDetailModal, TaskEditModal, taskKeys } from '@/features/tasks';
import type { DashboardTask, Project } from '@/types';
import { sortGeneralTasks } from '../lib/sorting';
import DashboardTaskCard from './DashboardTaskCard';
import DashboardWidget from './DashboardWidget';

type ModalState = { kind: 'none' } | { kind: 'details' | 'edit'; task: DashboardTask } | { kind: 'create' };

/**
 * "General" widget — tasks in the system project, which every user belongs to.
 * Admins see and manage all of them; everyone else sees their own tasks plus
 * unassigned ones (the API does the filtering).
 */
export default function SystemProjectTasks() {
	const user = useCurrentUser();
	const isAdmin = user?.system_role === 'admin';
	const { data, error, isLoading, mutate } = useSWR<DashboardTask[]>(user ? taskKeys.system : null);
	// Members and lead are only needed by the admin-only create/edit forms.
	const { data: systemProject } = useSWR<Omit<Project, 'tasks'>>(isAdmin ? projectKeys.detail('system') : null);
	const [modal, setModal] = useState<ModalState>({ kind: 'none' });
	const close = () => setModal({ kind: 'none' });

	const tasks = useMemo(() => sortGeneralTasks(data ?? []), [data]);

	const upsert = (task: DashboardTask) =>
		mutate(prev => {
			const list = prev ?? [];
			return list.some(t => t.id === task.id) ? list.map(t => (t.id === task.id ? task : t)) : [...list, task];
		}, false);

	return (
		<>
			<DashboardWidget
				title="General"
				className="h-full"
				action={
					isAdmin && (
						<button
							onClick={() => setModal({ kind: 'create' })}
							className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover"
						>
							<Plus size={14} />
							New Task
						</button>
					)
				}
				skeletonRows={5}
				isLoading={isLoading}
				error={error}
				onRetry={() => mutate()}
				errorMessage="Couldn't load tasks."
				isEmpty={tasks.length === 0}
				empty={{ title: 'Nothing here yet.', subtitle: 'No tasks to show right now.' }}
			>
				{tasks.map(task => (
					<DashboardTaskCard
						key={task.id}
						task={task}
						onClick={() => setModal({ kind: 'details', task })}
						footer={<span className="truncate">{task.assignee?.full_name ?? 'Unassigned'}</span>}
					/>
				))}
			</DashboardWidget>

			{modal.kind === 'details' && user && (
				<TaskDetailModal
					key={modal.task.id}
					task={modal.task}
					currentUser={user}
					projectLeadId={modal.task.project_lead_id}
					// System tasks never require submission, so there's no review
					// cycle and therefore no revision history.
					historySource="none"
					showSubmissionBadge={false}
					manage="admin-only"
					palette="theme"
					onClose={close}
					onChanged={() => mutate()}
					onDeleted={taskId => mutate(prev => (prev ?? []).filter(t => t.id !== taskId), false)}
					onEdit={task => setModal({ kind: 'edit', task })}
				/>
			)}

			{modal.kind === 'edit' && systemProject && (
				<TaskEditModal task={modal.task} members={systemProject.members} onClose={close} onSaved={upsert} />
			)}

			{modal.kind === 'create' && systemProject && (
				<TaskCreateModal
					projectId={systemProject.id}
					projectLeadId={systemProject.lead_id}
					members={systemProject.members}
					defaultRequiresSubmission={false}
					isSystemProject
					onClose={close}
					onCreated={task =>
						upsert({
							...task,
							previous_task: null,
							project: { id: systemProject.id, name: 'General' },
							project_lead_id: systemProject.lead_id,
						})
					}
				/>
			)}
		</>
	);
}
