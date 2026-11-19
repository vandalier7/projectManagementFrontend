'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface ProjectDetailsFormProps {
	project: {
		id: number;
		name: string;
		description: string | null;
		budget: string | null;
		status: string;
	};
	onSaved: (updated: any) => void;
}

// TODO: confirm the real set of valid statuses — pulled from the chipStyles
// placeholder in the settings page (active / on_hold / completed). Swap this
// out if the backend's status enum differs.
const STATUS_OPTIONS = [
	{ value: 'active', label: 'Active' },
	{ value: 'on_hold', label: 'On Hold' },
	{ value: 'completed', label: 'Completed' },
];

export default function ProjectDetailsForm({ project, onSaved }: ProjectDetailsFormProps) {
	const [name, setName] = useState(project.name);
	const [description, setDescription] = useState(project.description ?? '');
	const [budget, setBudget] = useState(project.budget ?? '');
	const [status, setStatus] = useState(project.status);

	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const hasChanges =
		name !== project.name ||
		description !== (project.description ?? '') ||
		budget !== (project.budget ?? '') ||
		status !== project.status;

	const handleDiscard = () => {
		setName(project.name);
		setDescription(project.description ?? '');
		setBudget(project.budget ?? '');
		setStatus(project.status);
		setError(null);
	};

	const handleSave = async () => {
		if (!hasChanges) return;

		setSaving(true);
		setError(null);

		try {
			const updated = await apiClient(`/projects/${project.id}`, {
				method: 'PATCH',
				body: JSON.stringify({
					name,
					description: description || null,
					budget: budget || null,
					status,
				}),
			});

			onSaved(updated);
		} catch (err: any) {
			setError(err.message ?? 'Failed to save project details.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
			<div className="flex flex-col gap-1">
				<span className="text-sm font-semibold text-text">Project Details</span>
				<p className="m-0 text-xs text-muted">
					Update the title, description, budget, and status for this project.
				</p>
			</div>

			<label className="flex flex-col gap-1.5">
				<span className="text-xs text-muted">Title</span>
				<input
					type="text"
					value={name}
					onChange={e => setName(e.target.value)}
					className="rounded border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
				/>
			</label>

			<label className="flex flex-col gap-1.5">
				<span className="text-xs text-muted">Description</span>
				<textarea
					value={description}
					onChange={e => setDescription(e.target.value)}
					rows={3}
					className="resize-none rounded border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
				/>
			</label>

			<label className="flex flex-col gap-1.5">
				<span className="text-xs text-muted">Budget</span>
				<input
					type="number"
					min="0"
					step="0.01"
					value={budget}
					onChange={e => setBudget(e.target.value)}
					className="rounded border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
				/>
			</label>

			<label className="flex flex-col gap-1.5">
				<span className="text-xs text-muted">Status</span>
				<select
					value={status}
					onChange={e => setStatus(e.target.value)}
					className="rounded border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
				>
					{STATUS_OPTIONS.map(opt => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</label>

			{error && <p className="m-0 text-xs text-danger">{error}</p>}

			{hasChanges && (
				<div className="flex gap-2">
					<button
						onClick={handleSave}
						disabled={saving}
						className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
					>
						{saving ? 'Saving...' : 'Save Changes'}
					</button>
					<button
						onClick={handleDiscard}
						disabled={saving}
						className="rounded px-4 py-2 text-sm font-medium text-muted hover:text-text disabled:opacity-50"
					>
						Discard
					</button>
				</div>
			)}
		</div>
	);
}