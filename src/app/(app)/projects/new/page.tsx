'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { apiClient } from '@/lib/api';

interface UserOption {
	id: number;
	full_name: string;
	username: string;
	profile_completed: boolean;
}

export default function NewProjectPage() {
	const router = useRouter();

	const [user, setUser] = useState<User | null>(null);
	const [checkedAccess, setCheckedAccess] = useState(false);

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [leadId, setLeadId] = useState('');
	const [leadQuery, setLeadQuery] = useState('');
	const [leadOpen, setLeadOpen] = useState(false);
	const [highlightIndex, setHighlightIndex] = useState(0);
	const leadBoxRef = useRef<HTMLDivElement>(null);
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

	const selectedLead = users?.find(u => String(u.id) === leadId);

	// Same pattern as TaskCreateModal's assignee combobox — filtered by
	// profile_completed (anyone, including admins, can be a lead) and by
	// the typed query against full_name.
	const filteredUsers = (users ?? []).filter(
		u =>
			u.profile_completed &&
			u.full_name.toLowerCase().includes(leadQuery.toLowerCase())
	);
	const comboOptions: { id: string; label: string }[] = filteredUsers.map(u => ({
		id: String(u.id),
		label: u.full_name,
	}));

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (leadBoxRef.current && !leadBoxRef.current.contains(e.target as Node)) {
				setLeadOpen(false);
				// Snap the visible text back to the actual selection if the
				// user typed something then clicked away without picking.
				setLeadQuery(selectedLead?.full_name ?? '');
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [selectedLead]);

	const selectLead = (id: string, label: string) => {
		setLeadId(id);
		setLeadQuery(label);
		setLeadOpen(false);
	};

	const handleLeadKeyDown = (e: React.KeyboardEvent) => {
		if (!leadOpen) {
			if (e.key === 'ArrowDown' || e.key === 'Enter') {
				setLeadOpen(true);
				setHighlightIndex(0);
			}
			return;
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setHighlightIndex(i => Math.min(i + 1, comboOptions.length - 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setHighlightIndex(i => Math.max(i - 1, 0));
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const opt = comboOptions[highlightIndex];
			if (opt) selectLead(opt.id, opt.label);
		} else if (e.key === 'Escape') {
			setLeadOpen(false);
			setLeadQuery(selectedLead?.full_name ?? '');
		}
	};

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
						<div className="relative" ref={leadBoxRef}>
							<input
								className="w-full text-sm text-text bg-surface border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors"
								placeholder="Select a lead"
								value={leadQuery}
								onChange={e => {
									setLeadQuery(e.target.value);
									setLeadId('');
									setLeadOpen(true);
									setHighlightIndex(0);
								}}
								onFocus={() => setLeadOpen(true)}
								onKeyDown={handleLeadKeyDown}
							/>
							{leadOpen && (
								<div className="absolute top-[calc(100%+4px)] left-0 right-0 max-h-48 overflow-y-auto bg-surface border border-border rounded shadow-md z-10">
									{comboOptions.length === 0 ? (
										<div className="text-sm text-muted px-3 py-2">No matches</div>
									) : (
										comboOptions.map((opt, i) => (
											<div
												key={opt.id}
												className={
													'text-sm text-text px-3 py-2 cursor-pointer ' +
													(i === highlightIndex ? 'bg-bg' : '')
												}
												onMouseDown={e => {
													e.preventDefault();
													selectLead(opt.id, opt.label);
												}}
												onMouseEnter={() => setHighlightIndex(i)}
											>
												{opt.label}
											</div>
										))
									)}
								</div>
							)}
						</div>
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