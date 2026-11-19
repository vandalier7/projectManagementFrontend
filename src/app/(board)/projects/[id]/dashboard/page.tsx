'use client';

import { useParams } from 'next/navigation';
import ProjectGuard from '@/components/feedback/ProjectGuard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import ProjectOverview from '@/features/projects/components/ProjectOverview';
import { useProject } from '@/features/projects/hooks/useProject';
import { useProjectBoardChrome } from '@/features/projects/hooks/useProjectBoardChrome';

export default function ProjectDashboardPage() {
	const { id } = useParams<{ id: string }>();
	const user = useCurrentUser();
	const { data: project, error, isLoading } = useProject(user ? id : null);

	useProjectBoardChrome(project, error);

	return (
		<ProjectGuard isLoading={isLoading} error={error}>
			{project && <ProjectOverview project={project} linked className="h-full" />}
		</ProjectGuard>
	);
}
