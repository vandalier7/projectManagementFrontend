'use client';

import { ReactNode } from 'react';
import type { User } from '@/lib/auth';

interface AppBarProps {
	title: string;
	actions?: ReactNode;
	user: User | null;
	onLogout: () => void;
	loggingOut: boolean;
}

export default function AppBar({
	title,
	actions,
	user,
	onLogout,
	loggingOut,
}: AppBarProps) {
	return (
		<header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
			<h1 className="m-0 text-lg font-semibold text-text">
				{title}
			</h1>

			<div className="flex flex-1 items-center justify-end gap-4">
				{actions && (
					<div className="flex items-center gap-2">
						{actions}
					</div>
				)}

				{user && (
					<div className="text-right">
						<p className="m-0 text-sm font-medium text-text">
							{user.username}
						</p>

						<p className="m-0 text-xs capitalize text-muted">
							{user.system_role}
						</p>
					</div>
				)}

				<button
					type="button"
					onClick={onLogout}
					disabled={loggingOut}
					className="rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{loggingOut ? 'Logging out...' : 'Log Out'}
				</button>
			</div>
		</header>
	);
}