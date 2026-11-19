'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronRight, FolderKanban } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { TaskDetailModal, taskKeys } from '@/features/tasks';
import type { DashboardTask } from '@/types';
import { topPriorityTasks } from '../lib/sorting';
import DashboardTaskCard from './DashboardTaskCard';
import DashboardWidget from './DashboardWidget';

/**
 * The current user's three most pressing open tasks across all their
 * projects (excluding the system project, which has its own widget).
 */
export default function MyPriorityTasks() {
	const user = useCurrentUser();
	const { data, error, isLoading, mutate } = useSWR<DashboardTask[]>(user ? taskKeys.mine : null);
	const [selected, setSelected] = useState<DashboardTask | null>(null);

	const tasks = useMemo(() => topPriorityTasks(data ?? []), [data]);

	return (
		<>
			<DashboardWidget
				title="Prioritized Tasks"
				action={
					// The full "My Tasks" page (/tasks) isn't built yet.
					<button
						disabled
						title="Coming soon"
						className="flex items-center gap-1 text-xs font-medium text-accent opacity-60 cursor-default"
					>
						View All
						<ChevronRight size={14} />
					</button>
				}
				// Fixed height: exactly 3 rows (3×56px + 2×8px gaps + 16px padding).
				bodyClassName="h-[200px]"
				isLoading={isLoading}
				error={error}
				onRetry={() => mutate()}
				errorMessage="Couldn't load your tasks."
				isEmpty={tasks.length === 0}
				empty={{ title: "You're all caught up!", subtitle: 'No active tasks assigned to you.' }}
			>
				{tasks.map(task => (
					<DashboardTaskCard
						key={task.id}
						task={task}
						onClick={() => setSelected(task)}
						footer={
							<>
								<FolderKanban size={12} />
								<span className="truncate">{task.project?.name}</span>
							</>
						}
					/>
				))}
			</DashboardWidget>

			{selected && user && (
				<TaskDetailModal
					key={selected.id}
					task={selected}
					currentUser={user}
					projectLeadId={selected.project_lead_id}
					historySource="fetch"
					manage="none"
					palette="theme"
					onClose={() => setSelected(null)}
					onChanged={() => mutate()}
					subtitle={task => task.project && <ProjectLink project={task.project} />}
					editElsewhere={
						selected.project && (
							<>
								To update the contents of this task, open the{' '}
								<Link href={`/projects/${selected.project.id}`} className="text-accent underline font-medium">
									project
								</Link>{' '}
								itself.
							</>
						)
					}
				/>
			)}
		</>
	);
}

function ProjectLink({ project }: { project: { id: number; name: string } }) {
	return (
		<Link
			href={`/projects/${project.id}`}
			className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors w-fit no-underline"
			title="Go to project"
		>
			<FolderKanban size={12} />
			<span className="hover:underline">{project.name}</span>
		</Link>
	);
}
