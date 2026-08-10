'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { Plus, UserMinus, KeyRound, Pencil, MoreVertical } from 'lucide-react';
import { useSetAppBarActions } from '@/components/layout/AppBarActionsContext';
import { apiClient } from '@/lib/api';
import SecurityConfirmation, { SecurityLevel } from '@/components/SecurityConfirmationModal';

interface UserRecord {
	id: number;
	full_name: string;
	username: string;
	system_role: 'admin' | 'team_member';
	email: string;
	phone: string | null;
	department: string | null;
	avatar_url: string | null;
	profile_completed: boolean;
	must_change_password: boolean;
}

interface GeneratedCredentials {
	email: string;
	password: string;
}

function getInitials(name: string): string {
	if (name == null) return '';
	return name
		.split(' ')
		.map(part => part[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

function MemberAvatar({ user }: { user: UserRecord }) {
	const [imgError, setImgError] = useState(false);

	if (user.avatar_url && !imgError) {
		return (
			<img
				src={user.avatar_url}
				alt={user.full_name}
				onError={() => setImgError(true)}
				className="h-8 w-10 rounded-full object-cover shrink-0"
			/>
		);
	}

	return (
		<div className="h-8 w-12 rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold shrink-0">
			{getInitials(user.full_name)}
		</div>
	);
}

function openCredentialsEmail(credentials: GeneratedCredentials) {
	const to = encodeURIComponent(credentials.email);
	const subject = encodeURIComponent('Your new temporary password');
	const body = encodeURIComponent(
		`Hello,

Your password has been reset by an administrator.

Please log in using:

Email: ${credentials.email}
Temporary Password: ${credentials.password}

You will be asked to set a new password after your next login.

Thank you.`
	);

	window.open(
		`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`,
		'_blank'
	);
}

function openGmailCompose(email: string) {
	const to = encodeURIComponent(email);

	window.open(
		`https://mail.google.com/mail/?view=cm&fs=1&to=${to}`,
		'_blank'
	);
}

interface PendingAction {
	userId: number;
	title: string;
	text: string;
	securityLevel: SecurityLevel;
	run: (password?: string) => Promise<void>;
}

interface UserActionsMenuProps {
	user: UserRecord;
	open: boolean;
	onToggle: () => void;
	onClose: () => void;
	onEdit: (user: UserRecord) => void;
	onForcePasswordChange: (user: UserRecord) => void;
	onRemove: (user: UserRecord) => void;
	removing: boolean;
}

function UserActionsMenu({
	user,
	open,
	onToggle,
	onClose,
	onEdit,
	onForcePasswordChange,
	onRemove,
	removing,
}: UserActionsMenuProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) return;

		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') onClose();
		}

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [open, onClose]);

	return (
		<div className="relative shrink-0" ref={containerRef}>
			<button
				onClick={onToggle}
				disabled={removing}
				className="cursor-pointer shrink-0 text-muted hover:text-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed p-1 rounded-md hover:bg-bg"
				title="More actions"
				aria-haspopup="menu"
				aria-expanded={open}
			>
				<MoreVertical className="h-4 w-4" />
			</button>

			{open && (
				<div
					role="menu"
					className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg"
				>
					<button
						role="menuitem"
						onClick={() => {
							onClose();
							onEdit(user);
						}}
						className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg cursor-pointer"
					>
						<Pencil className="h-4 w-4 text-muted" />
						Edit Details
					</button>

					<button
						role="menuitem"
						onClick={() => {
							onClose();
							onForcePasswordChange(user);
						}}
						className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg cursor-pointer"
					>
						<KeyRound className="h-4 w-4 text-muted" />
						Change Password
					</button>

					<button
						role="menuitem"
						onClick={() => {
							onClose();
							onRemove(user);
						}}
						className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-bg cursor-pointer"
					>
						<UserMinus className="h-4 w-4" />
						Delete User
					</button>
				</div>
			)}
		</div>
	);
}

export default function UsersPage() {
	const router = useRouter();
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [removingId, setRemovingId] = useState<number | null>(null);
	const [openMenuId, setOpenMenuId] = useState<number | null>(null);
	const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
	const [generatedCredentials, setGeneratedCredentials] =
		useState<GeneratedCredentials | null>(null);

	useEffect(() => {
		setCurrentUser(getUser());
	}, []);

	const { data: users, isLoading, mutate } = useSWR<UserRecord[]>(
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

	const handleEdit = (user: UserRecord) => {
		router.push(`/users/${user.id}/edit`);
	};

	const handleRemove = (user: UserRecord) => {
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

	const handleForcePasswordChange = (user: UserRecord) => {
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
						<MemberAvatar user={user} />

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