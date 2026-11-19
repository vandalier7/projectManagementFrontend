'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import type { ProjectSummary } from '@/types';

/** Delete with type-the-name-to-confirm. Calls onDeleted after success. */
export default function DeleteProjectSection({ project, onDeleted }: { project: ProjectSummary; onDeleted: () => void }) {
	const [confirmText, setConfirmText] = useState('');
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const confirmed = confirmText === project.name;

	const handleDelete = async () => {
		if (!confirmed) return;
		setDeleting(true);
		setError(null);

		try {
			await apiClient(`/projects/${project.id}`, { method: 'DELETE' });
			onDeleted();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete project.');
			setDeleting(false);
		}
	};

	return (
		<section className="flex max-w-lg flex-col gap-3">
			<h2 className="m-0 text-base font-semibold text-danger">Danger Zone</h2>

			<div className="flex flex-col gap-3 rounded-xl border border-danger p-5">
				<p className="m-0 text-xs text-muted">
					Deleting <span className="font-medium text-text">{project.name}</span> is permanent and cannot be undone. All tasks,
					members, and history for this project will be lost.
				</p>

				<label className="flex flex-col gap-1.5">
					<span className="text-xs text-muted">
						Type <span className="font-mono font-medium text-text">{project.name}</span> to confirm
					</span>
					<input
						type="text"
						value={confirmText}
						onChange={e => setConfirmText(e.target.value)}
						className="rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-danger"
						placeholder={project.name}
						autoComplete="off"
					/>
				</label>

				{error && <p className="m-0 text-xs text-danger">{error}</p>}

				<button
					onClick={handleDelete}
					disabled={!confirmed || deleting}
					className="self-start rounded border-none bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{deleting ? 'Deleting...' : 'Delete Project'}
				</button>
			</div>
		</section>
	);
}
