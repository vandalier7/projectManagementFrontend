'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { getToken, getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';

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
	const [hasToken, setHasToken] = useState<boolean | null>(null);

	useEffect(() => {
		if (!getToken()) {
			router.push('/login');
			setHasToken(false);
			return;
		}

		setUser(getUser());
		setHasToken(true);
	}, [router]);

	const { data: projects, error, isLoading } = useSWR<Project[]>(
		hasToken && user ? `/projects?user=${user.id}` : null
	);

	return (
		<main className="min-h-screen bg-bg px-15 py-12">
			<div className="flex items-center justify-between mb-8 max-w-5xl">
				<div className="flex items-center gap-4">
					<button
						className="text-sm text-muted cursor-pointer hover:text-text transition-colors bg-transparent border-none p-0"
						onClick={() => router.push('/dashboard')}
					>
						← Dashboard
					</button>
					<h1 className="text-2xl font-semibold text-text m-0">Projects</h1>
				</div>
				{user?.system_role === 'admin' && (
					<button
						className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover"
						onClick={() => router.push('/projects/new')}
					>
						New Project
					</button>
				)}
			</div>

			{isLoading && <p className="text-sm text-muted">Loading...</p>}
			{error && <p className="text-sm text-danger">{error.message}</p>}
			{!isLoading && !error && projects?.length === 0 && (
				<p className="text-sm text-muted">No projects yet.</p>
			)}

			<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 max-w-5xl">
				{projects?.map(project => (
					<div
						key={project.id}
						className="bg-surface border border-border rounded-xl shadow-sm p-5 cursor-pointer flex flex-col gap-2 transition-shadow hover:shadow-md"
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
		</main>
	);
}