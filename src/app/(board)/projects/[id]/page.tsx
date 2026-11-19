'use client';

import { useCallback, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ProjectGuard from '@/components/feedback/ProjectGuard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import ProjectBoard from '@/features/board/components/ProjectBoard';
import { useProject } from '@/features/projects/hooks/useProject';
import { useProjectBoardChrome } from '@/features/projects/hooks/useProjectBoardChrome';
import { useProjectSyncIndicator } from '@/features/projects/hooks/useProjectSyncIndicator';

export default function ProjectTasksPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const searchParams = useSearchParams();
	const user = useCurrentUser();
	const { data: project, error, isLoading, mutate } = useProject(user ? id : null);

	const refresh = useCallback(() => {
		mutate();
	}, [mutate]);

	useProjectBoardChrome(project, error);
	useProjectSyncIndicator(project?.id ?? null, refresh, Boolean(error));

	// The system project has no board — its tasks live on the dashboard.
	useEffect(() => {
		if (project?.is_system) router.replace('/dashboard');
	}, [project?.is_system, router]);

	const taskParam = searchParams.get('task');
	const initialTask = taskParam ? project?.tasks.find(t => t.id === Number(taskParam)) ?? null : null;

	return (
		<ProjectGuard isLoading={isLoading} error={error}>
			{project && user && (
				<ProjectBoard project={project} currentUser={user} refresh={refresh} initialTask={initialTask} />
			)}
		</ProjectGuard>
	);
}
