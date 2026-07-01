'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { apiClient } from '@/lib/api';

interface UserOption {
	id: number;
	full_name: string;
	username: string;
}

export default function NewProjectPage() {
	const router = useRouter();

	const [user, setUser] = useState<User | null>(null);
	const [checkedAccess, setCheckedAccess] = useState(false);

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [leadId, setLeadId] = useState('');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [budget, setBudget] = useState('');
	const [submissionMode, setSubmissionMode] = useState('require');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const today = new Date().toISOString().split('T')[0];

	useEffect(() => {
		const u = getUser();

		if (u?.system_role !== 'admin') {
			router.replace('/projects');
			return;
		}

		setUser(u);
		setCheckedAccess(true);
	}, [router]);

	const { data: users } = useSWR<UserOption[]>(
		checkedAccess ? '/users' : null
	);

	const handleCreate = async () => {
		setLoading(true);
		setError(null);

		try {
			const newProject = await apiClient('/projects', {
				method: 'POST',
				body: JSON.stringify({
					name,
					description: description || null,
					lead_id: leadId,
					created_by: user?.id,
					start_date: startDate || null,
					end_date: endDate || null,
					budget: budget || null,
					task_default_submission_mode: submissionMode,
				}),
			});

			await mutate(key => typeof key === 'string' && key.startsWith('/projects'), undefined, { revalidate: true });

			router.replace(`/projects/${newProject.id}`);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-4xl">
			<div className="flex flex-col gap-8">
				<div className="grid grid-cols-2 gap-6">
					<div className="flex flex-col gap-1.5 col-span-2">
						<label className="text-xs text-muted uppercase tracking-wide">
							Name <span className="text-danger">*</span>
						</label>
						<input
							className="text-sm text-text bg-surface border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors"
							placeholder="Project name"
							value={name}
							onChange={e => setName(e.target.value)}
							autoFocus
						/>
					</div>

					<div className="flex flex-col gap-1.5 col-span-2">
						<label className="text-xs text-muted uppercase tracking-wide">Description</label>
						<textarea
							className="text-sm text-text bg-surface border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors resize-none min-h-20"
							placeholder="Optional description"
							value={description}
							onChange={e => setDescription(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-muted uppercase tracking-wide">
							Lead <span className="text-danger">*</span>
						</label>
						<select
							className="text-sm text-text bg-surface border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors cursor-pointer"
							value={leadId}
							onChange={e => setLeadId(e.target.value)}
						>
							<option value="">Select a lead</option>
							{users?.map(u => (
								<option key={u.id} value={u.id}>
									{u.full_name} ({u.username})
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-muted uppercase tracking-wide">Default Submission Mode</label>
						<select
							className="text-sm text-text bg-surface border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors cursor-pointer"
							value={submissionMode}
							onChange={e => setSubmissionMode(e.target.value)}
						>
							<option value="require">Require</option>
							<option value="no_require">No Require</option>
							<option value="match_last">Match Last</option>
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-muted uppercase tracking-wide">Start Date</label>
						<input
							type="date"
							min={today}
							max={endDate || undefined}
							className="text-sm text-text bg-surface border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors"
							value={startDate}
							onChange={e => {
								const value = e.target.value;
								if (value && value < today) return;
								if (value && endDate && value > endDate) return;
								setStartDate(value);
							}}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-muted uppercase tracking-wide">End Date</label>
						<input
							type="date"
							min={startDate || today}
							className="text-sm text-text bg-surface border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors"
							value={endDate}
							onChange={e => {
								const value = e.target.value;
								const lowerBound = startDate || today;
								if (value && value < lowerBound) return;
								setEndDate(value);
							}}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-muted uppercase tracking-wide">Budget</label>
						<input
							type="number"
							min="0"
							className="text-sm text-text bg-surface border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors"
							placeholder="Optional"
							value={budget}
							onChange={e => setBudget(e.target.value)}
						/>
					</div>
				</div>

				{error && <p className="text-sm text-danger m-0">{error}</p>}

				<div className="flex justify-end gap-3">
					<button
						className="text-sm font-medium text-text bg-surface border border-border rounded px-4 py-2 cursor-pointer transition-colors hover:bg-bg"
						onClick={() => router.replace('/projects')}
						disabled={loading}
					>
						Cancel
					</button>
					<button
						className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed"
						onClick={handleCreate}
						disabled={loading || !name.trim() || !leadId}
					>
						{loading ? 'Creating...' : 'Create Project'}
					</button>
				</div>
			</div>
		</div>
	);
}