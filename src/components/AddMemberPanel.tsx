'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface MemberUser {
	id: number;
	full_name: string;
}

interface Member {
	id: number;
	user: MemberUser;
}

interface AllUser {
	id: number;
	full_name: string;
}

interface AddMemberPanelProps {
	projectId: number;
	members: Member[];
	allUsers: AllUser[];
	onMutate: () => void;
}

export default function AddMemberPanel({ projectId, members, allUsers, onMutate }: AddMemberPanelProps) {
	const [query, setQuery] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const memberIds = useMemo(() => new Set(members.map(m => m.user.id)), [members]);

	const availableUsers = useMemo(() => {
		return allUsers
			.filter(u => !memberIds.has(u.id))
			.filter(u => u.full_name.toLowerCase().includes(query.toLowerCase()));
	}, [allUsers, memberIds, query]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleAdd = async (userId: number) => {
		setSubmitting(true);
		setError(null);
		try {
			await apiClient(`/projects/${projectId}/members`, {
				method: 'POST',
				body: JSON.stringify({ user_id: userId }),
			});
			setQuery('');
			setIsOpen(false);
			onMutate();
		} catch (err: any) {
			setError(err.message ?? 'Failed to add member.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col gap-1.5" ref={containerRef}>
			<span className="text-xs text-muted uppercase tracking-wide">Members</span>

			<div className="flex flex-col gap-1 mb-1">
				{members.length === 0 && (
					<span className="text-sm text-muted">No members yet.</span>
				)}
				{members.map(m => (
					<span key={m.id} className="text-sm text-text">
						{m.user.full_name}
					</span>
				))}
			</div>

			<div className="relative">
				<input
					type="text"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setIsOpen(true);
					}}
					onFocus={() => setIsOpen(true)}
					placeholder="Add a member…"
					disabled={submitting}
					className="w-full text-sm text-text bg-bg border border-border rounded px-3 py-2 outline-none focus:border-accent transition-colors"
				/>

				{isOpen && (
					<div className="absolute left-0 right-0 mt-1 bg-surface border border-border rounded shadow-md max-h-48 overflow-y-auto z-10">
						{availableUsers.length === 0 && (
							<p className="text-xs text-muted px-3 py-2 m-0">
								{query ? 'No matching users.' : 'No users available to add.'}
							</p>
						)}
						{availableUsers.map(u => (
							<button
								key={u.id}
								onClick={() => handleAdd(u.id)}
								disabled={submitting}
								className="w-full text-left text-sm text-text bg-transparent border-none px-3 py-2 cursor-pointer hover:bg-bg transition-colors"
							>
								{u.full_name}
							</button>
						))}
					</div>
				)}
			</div>

			{error && <p className="text-xs text-danger m-0">{error}</p>}
		</div>
	);
}