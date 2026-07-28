'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus } from 'lucide-react';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { useSetAppBarActions } from '@/components/layout/AppBarActionsContext';
import ProjectCard from '@/components/projects/ProjectCard';

interface Project {
	id: number;
	name: string;
	status: string;
	lead: {
		full_name: string;
	} | null;
	banner_url: string | null
}

const chipStyles: Record<string, string> = {
	active: 'bg-green-100 text-green-800',
	inactive: 'bg-gray-100 text-muted',
	archived: 'bg-gray-100 text-muted',
};

export default function ProjectsPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		setUser(getUser());
	}, []);

	const { data: projects, error, isLoading } = useSWR<Project[]>(
		user ? `/projects?user=${user.id}` : null
	);

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
						chipStyles={chipStyles}
						bannerUrl={project.banner_url}
						onClick={() => router.push(`/projects/${project.id}`)}
					/>
				))}
			</div>
		</div>
	);
}