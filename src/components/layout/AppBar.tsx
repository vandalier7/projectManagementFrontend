'use client';

import type { ReactNode } from 'react';
import NotificationsMenu from '@/features/notifications/NotificationsMenu';
import type { User } from '@/types';
import AccountMenu from './AccountMenu';

interface AppBarProps {
	title: string;
	actions?: ReactNode;
	user: User | null;
	onLogout: () => void;
	loggingOut: boolean;
}

/** Top bar for the main app: page title, page actions, notifications, account. */
export default function AppBar({ title, actions, user, onLogout, loggingOut }: AppBarProps) {
	return (
		<header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
			<h1 className="m-0 text-lg font-semibold text-text">{title}</h1>

			<div className="flex flex-1 items-center justify-end gap-4">
				{actions && <div className="flex items-center gap-2">{actions}</div>}
				<NotificationsMenu enabled={user != null} />
				{user && <AccountMenu user={user} onLogout={onLogout} loggingOut={loggingOut} />}
			</div>
		</header>
	);
}
