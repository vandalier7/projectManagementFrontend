'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { useSetBoardTitle } from '@/components/layout/AppBarActionsContext';

interface Project {
	id: number;
	name: string;
	status: string;
}

const REDIRECT_DELAY_MS = 4000;

export default function ProjectSettingsPage() {
	const params = useParams();
	const router = useRouter();
	const projectId = params.id;

	const [user, setUser] = useState<User | null>(null);
	const [confirmText, setConfirmText] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [isDeleted, setIsDeleted] = useState(false);

	useEffect(() => {
		setUser(getUser());
	}, []);

	const { data: project, error, isLoading } = useSWR<Project>(
		user ? `/projects/${projectId}?user=${user.id}` : null
	);

	useSetBoardTitle(project?.name ? `${project.name} / Settings` : null);

	// Auto-redirect after a successful delete, with an early-exit button.
	useEffect(() => {
		if (!isDeleted) return;

		const timeout = setTimeout(() => {
			router.push('/projects');
		}, REDIRECT_DELAY_MS);

		return () => clearTimeout(timeout);
	}, [isDeleted, router]);

	const isAdmin = user?.system_role === 'admin';
	const canConfirmDelete = project ? confirmText === project.name : false;

	const handleDelete = async () => {
		if (!project || !canConfirmDelete) return;

		setIsDeleting(true);
		setDeleteError(null);

		try {
			await apiClient(`/projects/${project.id}`, { method: 'DELETE' });
			setIsDeleted(true);
		} catch (err) {
			setDeleteError(err instanceof Error ? err.message : 'Failed to delete project.');
			setIsDeleting(false);
		}
	};

	if (isDeleted) {
		return (
			<div className="flex flex-col items-start gap-3">
				<p className="text-sm text-text m-0">Project deleted successfully.</p>
				<p className="text-xs text-muted m-0">Redirecting to your projects shortly...</p>
				<button
					className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover"
					onClick={() => router.push('/projects')}
				>
					Go to Projects now
				</button>
			</div>
		);
	}

	if (isLoading) {
		return <p className="text-sm text-muted">Loading...</p>;
	}

	if (error?.message === 'You do not have access to this project.') {
		return <p className="text-sm text-muted">You do not have access to this project.</p>;
	}

	if (error || !project) {
		return <p className="text-sm text-muted">This project does not exist or has been removed.</p>;
	}

	if (!isAdmin) {
		return <p className="text-sm text-muted">Only admins can access project settings.</p>;
	}

	return (
		<div className="flex flex-col gap-4 max-w-lg">
			<div className="border border-danger rounded-xl p-5 flex flex-col gap-3">
				<div className="flex flex-col gap-1">
					<span className="text-sm font-semibold text-danger">Danger Zone</span>
					<p className="text-xs text-muted m-0">
						Deleting <span className="font-medium text-text">{project.name}</span> is
						permanent and cannot be undone. All tasks, members, and history for this
						project will be lost.
					</p>
				</div>

				<label className="flex flex-col gap-1.5">
					<span className="text-xs text-muted">
						Type <span className="font-mono font-medium text-text">{project.name}</span> to confirm
					</span>
					<input
						type="text"
						value={confirmText}
						onChange={e => setConfirmText(e.target.value)}
						className="border border-border rounded px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:ring-1 focus:ring-danger"
						placeholder={project.name}
						autoComplete="off"
					/>
				</label>

				{deleteError && (
					<p className="text-xs text-danger m-0">{deleteError}</p>
				)}

				<button
					onClick={handleDelete}
					disabled={!canConfirmDelete || isDeleting}
					className="self-start text-sm font-medium text-white bg-danger border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isDeleting ? 'Deleting...' : 'Delete Project'}
				</button>
			</div>
		</div>
	);
}