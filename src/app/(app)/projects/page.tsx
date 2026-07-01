'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus } from 'lucide-react';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { useSetAppBarActions } from '@/components/layout/AppBarActionsContext';

interface Project {
	id: number;
	name: string;
	status: string;
	lead: {
		full_name: string;
	} | null;
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
			{isLoading && <p className="text-sm text-muted">Loading...</p>}
			{error && <p className="text-sm text-danger">{error.message}</p>}
			{!isLoading && !error && projects?.length === 0 && (
				<p className="text-sm text-muted">No projects yet.</p>
			)}

			<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
				{projects?.map(project => (
					<div
						key={project.id}
						className="bg-surface border border-border rounded-xl shadow-sm p-5 cursor-pointer flex flex-col gap-2 transition-shadow hover:shadow-md aspect-[16/9]"
						onClick={() => router.push(`/projects/${project.id}`)}
					>
						<div className="flex items-center justify-between gap-2">
							<span className="text-sm font-semibold text-text">
								{project.name}
							</span>
							<span className={`font-mono text-xs tracking-wide px-2 py-0.5 rounded lowercase whitespace-nowrap ${chipStyles[project.status] ?? 'bg-gray-100 text-muted'}`}>
								{project.status}
							</span>
						</div>
						<span className="text-xs text-muted">
							{project.lead ? project.lead.full_name : 'No lead assigned'}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}