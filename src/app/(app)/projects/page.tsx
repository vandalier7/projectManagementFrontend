'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useProjects } from '@/features/projects/hooks/useProject';
import { useSetAppBarActions } from '@/components/layout/AppBarActionsContext';
import ProjectCard from '@/features/projects/components/ProjectCard';

export default function ProjectsPage() {
	const router = useRouter();
	const user = useCurrentUser();
	const { data: projects, error, isLoading } = useProjects(user != null);

	const newProjectAction = useMemo(
		() =>
			user?.system_role === 'admin' ? (
				<button
					className="flex items-center justify-center gap-2 leading-none text-sm font-medium text-white bg-accent border-none rounded pl-3 pr-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover"
					onClick={() => router.push('/projects/new')}
				>
					<Plus className="h-4 w-4 shrink-0" />
					New
				</button>
			) : null,
		[user?.system_role, router]
	);

	useSetAppBarActions(newProjectAction);

	return (
		<div className="w-full">
			{error && <p className="text-sm text-danger">{error.message}</p>}

			{!isLoading && !error && projects?.length === 0 && (
				<div className="flex items-center justify-center py-12">
					<p className="text-sm text-muted">No projects yet.</p>
				</div>
			)}

			<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
				{isLoading &&
					Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="bg-surface border border-border rounded-xl shadow-sm p-5 flex flex-col gap-2 aspect-[16/9] animate-pulse"
						>
							<div className="flex items-center justify-between gap-2">
								<div className="h-4 w-2/3 rounded bg-border" />
								<div className="h-4 w-14 rounded bg-border" />
							</div>
							<div className="h-3 w-1/2 rounded bg-border" />
						</div>
					))}

				{!isLoading &&
				projects?.map(project => (
					<ProjectCard
						key={project.id}
						project={project}
						bannerUrl={project.banner_url}
						onClick={() => router.push(`/projects/${project.id}`)}
					/>
				))}
			</div>
		</div>
	);
}