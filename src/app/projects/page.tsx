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

	// Only start fetching once we've confirmed a token exists. Passing
	// null as the key tells SWR "don't fetch yet" — this avoids firing
	// a request that we know will 401 during the brief moment before the
	// auth check above has run.
	const { data: projects, error, isLoading } = useSWR<Project[]>(
		hasToken ? '/projects' : null
	);

	return (
		<main className="root">
			<div className="header">
				<h1 className="title">Projects</h1>
				{user?.system_role === 'admin' && (
					<button
						className="newBtn"
						onClick={() => router.push('/projects/new')}
					>
						New Project
					</button>
				)}
			</div>

			{isLoading && <p className="state">Loading...</p>}
			{error && <p className="stateError">{error.message}</p>}

			{!isLoading && !error && projects?.length === 0 && (
				<p className="state">No projects yet.</p>
			)}

			<div className="grid">
				{projects?.map(project => (
					<div
						key={project.id}
						className="card"
						onClick={() => router.push(`/projects/${project.id}`)}
					>
						<div className="cardTop">
							<span className="cardName">{project.name}</span>
							<span className={`chip chip--${project.status}`}>
								{project.status}
							</span>
						</div>
						<span className="cardLead">
							{project.lead ? project.lead.full_name : 'No lead assigned'}
						</span>
					</div>
				))}
			</div>

			<style jsx>{`
				.root {
					min-height: 100vh;
					background: var(--bg);
					padding: 48px 60px;
				}

				.header {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 32px;
					max-width: 1100px;
				}

				.title {
					font-family: var(--font-ui);
					font-size: 24px;
					font-weight: 600;
					color: var(--text);
					margin: 0;
				}

				.newBtn {
					font-family: var(--font-ui);
					font-size: 13px;
					font-weight: 500;
					color: #FFFFFF;
					background: var(--accent);
					border: none;
					border-radius: var(--radius);
					padding: 9px 16px;
					cursor: pointer;
					transition: background 150ms ease;
				}

				.newBtn:hover {
					background: var(--accent-hover);
				}

				.grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
					gap: 16px;
					max-width: 1100px;
				}

				.card {
					background: var(--surface);
					border: 1px solid var(--border);
					border-radius: var(--radius-lg);
					box-shadow: var(--shadow-sm);
					padding: 20px;
					cursor: pointer;
					transition: box-shadow 150ms ease;
					display: flex;
					flex-direction: column;
					gap: 8px;
				}

				.card:hover {
					box-shadow: var(--shadow-md);
				}

				.cardTop {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 8px;
				}

				.cardName {
					font-family: var(--font-ui);
					font-size: 15px;
					font-weight: 600;
					color: var(--text);
				}

				.chip {
					font-family: var(--font-mono);
					font-size: 11px;
					letter-spacing: 0.05em;
					padding: 3px 8px;
					border-radius: 4px;
					text-transform: lowercase;
					white-space: nowrap;
				}

				.chip--active {
					background: #E8F5E9;
					color: #2E7D32;
				}

				.chip--inactive {
					background: #F5F5F5;
					color: var(--muted);
				}

				.chip--archived {
					background: #F5F5F5;
					color: var(--muted);
				}

				.cardLead {
					font-family: var(--font-ui);
					font-size: 13px;
					color: var(--muted);
				}

				.state {
					font-family: var(--font-ui);
					font-size: 14px;
					color: var(--muted);
				}

				.stateError {
					font-family: var(--font-ui);
					font-size: 14px;
					color: #D94F4F;
				}
			`}</style>
		</main>
	);
}