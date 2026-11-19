'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import Avatar from '@/components/ui/Avatar';
import type { User } from '@/types';
import UserActionsMenu from '@/features/users/components/UserActionsMenu';
import { openCredentialsEmail, openGmailCompose, type GeneratedCredentials } from '@/features/users/lib/gmail';
import { Plus } from 'lucide-react';
import { useSetAppBarActions } from '@/components/layout/AppBarActionsContext';
import { apiClient } from '@/lib/api';
import SecurityConfirmation, { SecurityLevel } from '@/components/ui/SecurityConfirmationModal';


interface PendingAction {
	userId: number;
	title: string;
	text: string;
	securityLevel: SecurityLevel;
	run: (password?: string) => Promise<void>;
}

export default function UsersPage() {
	const router = useRouter();
	const currentUser = useCurrentUser();
	const [removingId, setRemovingId] = useState<number | null>(null);
	const [openMenuId, setOpenMenuId] = useState<number | null>(null);
	const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
	const [generatedCredentials, setGeneratedCredentials] =
		useState<GeneratedCredentials | null>(null);

	const { data: users, isLoading, mutate } = useSWR<User[]>(
		currentUser ? '/users' : null
	);

	const newProjectAction = useMemo(
		() =>
			currentUser?.system_role === 'admin' ? (
				<button
					className="flex items-center justify-center gap-2 leading-none text-sm font-medium text-white bg-accent border-none rounded pl-3 pr-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover"
					onClick={() => router.push('/users/new')}
				>
					<Plus className="h-4 w-4 shrink-0" />
					New
				</button>
			) : null,
		[currentUser?.system_role, router]
	);

	useSetAppBarActions(newProjectAction);

	const members = useMemo(() => {
		if (!users) return [];
		return users.filter(
			user => user.system_role !== 'admin' && user.profile_completed
		);
	}, [users]);

	const handleEdit = (user: User) => {
		router.push(`/users/${user.id}/edit`);
	};

	const handleRemove = (user: User) => {
		setPendingAction({
			userId: user.id,
			title: 'Delete User',
			text: `Enter your password to confirm deleting ${user.full_name}. This cannot be undone.`,
			securityLevel: 'high',
			run: async (password?: string) => {
				setRemovingId(user.id);
				try {
					await apiClient(`/users/${user.id}`, {
						method: 'DELETE',
						body: JSON.stringify({ password }),
					});
					mutate();
				} finally {
					setRemovingId(null);
				}
			},
		});
	};

	const handleForcePasswordChange = (user: User) => {
		setPendingAction({
			userId: user.id,
			title: 'Change Password',
			text: `Enter your password to generate a new temporary password for ${user.full_name}.`,
			securityLevel: 'high',
			run: async (password?: string) => {
				const response = await apiClient(
					`/users/${user.id}/force-password-change`,
					{
						method: 'POST',
						body: JSON.stringify({ password }),
					}
				);

				mutate();

				setGeneratedCredentials({
					email: response.user.email,
					password: response.temp_password,
				});
			},
		});
	};

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center text-muted">
				Loading...
			</div>
		);
	}

	if (!members.length) {
		return (
			<div className="flex h-full items-center justify-center text-muted">
				No users found.
			</div>
		);
	}

	return (
		<>
			<div className="flex flex-col gap-2">
				{members.map(user => (
					<div
						key={user.id}
						className="bg-surface border border-border rounded-xl px-6 py-5 flex items-center gap-3"
					>
						<Avatar name={user.full_name} src={user.avatar_url} className="h-8 w-10 text-sm" />

						<div className="flex flex-col min-w-0 w-64">
							<span className="text-sm font-semibold text-text truncate">
								{user.full_name}
							</span>
							<span className="text-xs text-muted truncate">
								@{user.username}
							</span>
							{user.department && (
								<span className="text-xs text-muted truncate">
									{user.department}
								</span>
							)}
						</div>

						<div className="flex-1 min-w-0 flex flex-col">
							<button
								onClick={() => openGmailCompose(user.email)}
								className="text-left text-xs text-accent hover:underline truncate cursor-pointer"
							>
								{user.email}
							</button>
							{user.phone && (
								<a
									href={`tel:${user.phone}`}
									className="text-xs text-muted hover:text-text truncate"
								>
									{user.phone}
								</a>
							)}
						</div>

						{currentUser?.system_role === 'admin' && (
							<UserActionsMenu
								user={user}
								open={openMenuId === user.id}
								onToggle={() =>
									setOpenMenuId(prev => (prev === user.id ? null : user.id))
								}
								onClose={() => setOpenMenuId(null)}
								onEdit={handleEdit}
								onForcePasswordChange={handleForcePasswordChange}
								onRemove={handleRemove}
								removing={removingId === user.id}
							/>
						)}
					</div>
				))}
			</div>

			<SecurityConfirmation
				open={pendingAction !== null}
				title={pendingAction?.title ?? ''}
				text={pendingAction?.text ?? ''}
				securityLevel={pendingAction?.securityLevel ?? 'low'}
				onConfirm={async (password) => {
					if (!pendingAction) return;
					await pendingAction.run(password);
					setPendingAction(null);
				}}
				onCancel={() => setPendingAction(null)}
			/>

			{generatedCredentials && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
					onClick={() => setGeneratedCredentials(null)}
				>
					<div
						className="w-full max-w-sm rounded-xl border border-border bg-surface p-6"
						onClick={e => e.stopPropagation()}
					>
						<h2 className="text-lg font-semibold text-text">
							New Temporary Password
						</h2>
						<p className="mt-1 text-sm text-muted">
							Send these credentials to the user.
						</p>

						<div className="mt-4 rounded-lg bg-bg p-4 text-sm">
							<p>
								<strong>Email:</strong> {generatedCredentials.email}
							</p>
							<p>
								<strong>Temporary Password:</strong>{' '}
								{generatedCredentials.password}
							</p>
						</div>

						<div className="mt-5 flex gap-3">
							<button
								onClick={() => openCredentialsEmail(generatedCredentials)}
								className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
							>
								Email Credentials
							</button>

							<button
								onClick={() => setGeneratedCredentials(null)}
								className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:text-text"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}