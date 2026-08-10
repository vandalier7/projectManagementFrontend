'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Check, ChevronDown } from 'lucide-react';

interface User {
	id: number;
	full_name: string;
	username: string;
	system_role: 'admin' | 'team_member';
	email: string;
	phone: string | null;
	department: string | null;
	avatar_url: string | null;
	profile_completed: boolean;
}

interface ProjectMember {
	id: number;
	user: {
		id: number;
	};
}

interface Props {
	projectId: string | string[];
	users: User[];
	members: ProjectMember[];
	onClose: () => void;
	onMutate: () => void;
}

function getInitials(name: string): string {
	return name
		.split(' ')
		.map(part => part[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

export default function AddProjectMemberModal({
	projectId,
	users,
	members,
	onClose,
	onMutate,
}: Props) {
	const [query, setQuery] = useState('');
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [open, setOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const memberIds = useMemo(
		() => new Set(members.map(member => member.user.id)),
		[members]
	);

	const filteredUsers = useMemo(() => {
		const search = query.trim().toLowerCase();

		return users
			.filter(user => !memberIds.has(user.id))
			.filter(user => user.profile_completed)
			.filter(user => {
				if (!search) return true;

				return (
					user.full_name.toLowerCase().includes(search) ||
					user.username.toLowerCase().includes(search) ||
					user.email.toLowerCase().includes(search)
				);
			});
	}, [users, memberIds, query]);

	useEffect(() => {
		setHighlightedIndex(0);
	}, [query]);

	const handleSelect = (user: User) => {
		setSelectedUser(user);
		setQuery(user.full_name);
		setOpen(false);
	};

	const handleSubmit = async () => {
		if (!selectedUser) return;

        if (
            !selectedUser ||
            selectedUser.full_name !== query.trim()
        ) {
            setError('Please select a user from the list.');
            return;
        }

		setLoading(true);
		setError(null);

		try {
			await apiClient(`/projects/${projectId}/members`, {
				method: 'POST',
				body: JSON.stringify({
					user_id: selectedUser.id,
				}),
			});

			onMutate();
			onClose();
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40"
			onClick={onClose}
		>
			<div
				onClick={e => e.stopPropagation()}
				className="w-full max-w-lg h-[25rem] overflow-hidden rounded-xl border border-border bg-surface shadow-md flex flex-col"
			>
				<div className="flex items-center justify-between border-b border-border px-6 pt-6 pb-4">
					<h2 className="m-0 text-base font-semibold text-text">
						Add Member
					</h2>

					<button
						onClick={onClose}
						className="bg-transparent border-none p-0 text-muted hover:text-text cursor-pointer leading-none"
					>
						✕
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

					<div className="flex flex-col gap-1.5">
						<label className="text-xs uppercase tracking-wide text-muted">
							User
						</label>

						<div className="relative">

							<div className="relative">

								<input
									ref={inputRef}
									value={query}
									onFocus={() => setOpen(true)}
									onChange={e => {
										setQuery(e.target.value);
										setSelectedUser(prev =>
                                            prev?.full_name === e.target.value ? prev : null
                                        );
										setOpen(true);
									}}
									onKeyDown={e => {
										if (!open) return;

										if (e.key === 'ArrowDown') {
											e.preventDefault();
											setHighlightedIndex(i =>
												Math.min(i + 1, filteredUsers.length - 1)
											);
										}

										if (e.key === 'ArrowUp') {
											e.preventDefault();
											setHighlightedIndex(i =>
												Math.max(i - 1, 0)
											);
										}

										if (e.key === 'Enter') {
											e.preventDefault();

											const user =
												filteredUsers[highlightedIndex];

											if (user) {
												handleSelect(user);
											}
										}

										if (e.key === 'Escape') {
											setOpen(false);
										}
									}}
									placeholder="Search by name, username or email"
									className="w-full rounded border border-border bg-bg px-3 py-2.5 pr-10 text-sm text-text outline-none transition-colors focus:border-accent"
								/>

								<ChevronDown
									size={16}
									className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
								/>

							</div>
							{open && (
								<div
									ref={listRef}
									className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
								>
									{filteredUsers.length === 0 ? (
										<div className="px-3 py-3 text-sm text-muted">
											No matching users.
										</div>
									) : (
										filteredUsers.map((user, index) => (
											<button
												key={user.id}
												type="button"
												onMouseDown={e => e.preventDefault()}
												onClick={() => handleSelect(user)}
												className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
													index === highlightedIndex
														? 'bg-accent/10'
														: 'hover:bg-bg'
												}`}
											>
												{user.avatar_url ? (
													<img
														src={user.avatar_url}
														alt={user.full_name}
														className="h-9 w-9 rounded-full object-cover shrink-0"
													/>
												) : (
													<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
														{getInitials(user.full_name)}
													</div>
												)}

												<div className="min-w-0 flex-1">
													<div className="truncate text-sm font-medium text-text">
														{user.full_name}
													</div>

													<div className="truncate text-xs text-muted">
														@{user.username}
														{user.department
															? ` • ${user.department}`
															: ''}
													</div>
												</div>

												{selectedUser?.id === user.id && (
													<Check
														size={16}
														className="text-accent shrink-0"
													/>
												)}
											</button>
										))
									)}
								</div>
							)}
						</div>
					</div>

					{selectedUser && (
						<div className="rounded-lg border border-border bg-bg px-3 py-2">
							<p className="m-0 text-sm font-medium text-text">
								{selectedUser.full_name}
							</p>

							<p className="m-0 text-xs text-muted">
								@{selectedUser.username} • {selectedUser.email}
							</p>
						</div>
					)}

					{error && (
						<p className="m-0 text-sm text-danger">
							{error}
						</p>
					)}
				</div>

				<div className="flex justify-end gap-2 border-t border-border px-6 py-4">
					<button
						onClick={onClose}
						disabled={loading}
						className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-bg"
					>
						Cancel
					</button>

					<button
						onClick={handleSubmit}
						disabled={!selectedUser || loading}
						className="rounded border-none bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? 'Adding...' : 'Add Member'}
					</button>
				</div>
			</div>
		</div>
	);
}