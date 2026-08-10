'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Bell, LogOut } from 'lucide-react';
import type { User } from '@/lib/auth';
import { apiClient } from '@/lib/api';

interface AppNotification {
	id: number;
	project_id: number;
	project_name: string | null;
	type: string;
	title: string;
	body: string | null;
	action_url: string | null;
	created_at: string;
	read_at: string | null;
}

interface NotificationsResponse {
	notifications: AppNotification[];
	unread_count: number;
}

interface AppBarProps {
	title: string;
	actions?: ReactNode;
	user: User | null;
	onLogout: () => void;
	loggingOut: boolean;
}

function getInitials(user: User) {
	const source = user.full_name?.trim() || user.username;
	const parts = source.split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		return (parts[0][0] + parts[1][0]).toUpperCase();
	}
	return source.slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string): string {
	const diffMs = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diffMs / 60000);
	if (mins < 1) return 'just now';
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export default function AppBar({
	title,
	actions,
	user,
	onLogout,
	loggingOut,
}: AppBarProps) {
	const router = useRouter();
	const [avatarOpen, setAvatarOpen] = useState(false);
	const [notifOpen, setNotifOpen] = useState(false);
	const avatarRef = useRef<HTMLDivElement>(null);
	const notifRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
				setAvatarOpen(false);
			}
			if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
				setNotifOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// SWR handles caching + dedup automatically — every AppBar instance
	// (e.g. across route changes, since AppBar is mounted in a shared
	// layout) shares the same cached response under this key, instead of
	// each mount independently re-fetching and running its own interval.
	// refreshInterval keeps it polling in the background like before, and
	// revalidateOnFocus re-syncs the moment the tab regains focus.
	const { data, mutate } = useSWR<NotificationsResponse>(
		user ? '/notifications' : null,
		{
			refreshInterval: 30000,
			revalidateOnFocus: true,
			dedupingInterval: 5000,
		}
	);

	const notifications: AppNotification[] = data?.notifications ?? [];
	const unreadCount: number = data?.unread_count ?? 0;

	const handleNotificationClick = async (notif: AppNotification) => {
		setNotifOpen(false);

		if (!notif.read_at) {
			// Optimistically update the SWR cache so the dropdown/badge
			// reflect the read state instantly, without waiting on the
			// round-trip or the next poll. revalidate: false keeps this
			// as a pure local patch until the background refresh confirms it.
			mutate(
				(current) => {
					if (!current) return current;
					return {
						...current,
						notifications: current.notifications.map((n) =>
							n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n
						),
						unread_count: Math.max(0, current.unread_count - 1),
					};
				},
				{ revalidate: false }
			);

			try {
				await apiClient(`/notifications/${notif.id}/read`, { method: 'POST' });
			} catch {
				// If this fails, the next poll will resync the true state
				// from the server, undoing the optimistic patch if needed.
			}
		}

		if (notif.action_url) {
			router.push(notif.action_url);
		}
	};

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

				{/* Notifications */}
				<div className="relative" ref={notifRef}>
					{/* Notifications button */}
					<button
						type="button"
						onClick={() => {
							setNotifOpen((v) => !v);
							setAvatarOpen(false);
						}}
						className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-red-50 hover:text-text"
						aria-label="Notifications"
					>
						<Bell size={20} />
						{unreadCount > 0 && (
							<span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white">
								{unreadCount > 99 ? '99+' : unreadCount}
							</span>
						)}
					</button>

					{notifOpen && (
						<div className="absolute right-0 z-20 mt-2 w-80 min-w-[280px] max-w-[360px] min-h-[340px] max-h-96 overflow-hidden rounded-lg border border-border bg-surface shadow-lg flex flex-col">
							<div className="px-4 py-3 border-b border-border shrink-0">
								<p className="m-0 text-sm font-semibold text-text">Notifications</p>
							</div>
							<div className="overflow-y-auto flex-1">
							{notifications.length === 0 ? (
								<div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
									<Bell size={28} className="text-muted" />
									<p className="m-0 text-sm text-muted">No notifications</p>
								</div>
							) : (
								<div className="flex flex-col divide-y divide-border">
									{notifications.map(notif => (
										<button
											key={notif.id}
											type="button"
											onClick={() => handleNotificationClick(notif)}
											className={`flex flex-col gap-0.5 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-bg ${
												!notif.read_at ? 'bg-accent/5' : ''
											}`}
										>
											<div className="flex items-start justify-between gap-2">
												<span className="text-sm font-medium text-text leading-snug">
													{notif.title}
												</span>
												{!notif.read_at && (
													<span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
												)}
											</div>
											{notif.body && (
												<span className="text-xs text-muted leading-snug">{notif.body}</span>
											)}
											<span className="text-[11px] text-muted mt-0.5">
												{notif.project_name ?? 'General'} · {timeAgo(notif.created_at)}
											</span>
										</button>
									))}
								</div>
							)}
							</div>
						</div>
					)}
				</div>

				{/* Avatar */}
				{user && (
					<div className="relative" ref={avatarRef}>
						{/* Avatar button */}
						<button
							type="button"
							onClick={() => {
								setAvatarOpen((v) => !v);
								setNotifOpen(false);
							}}
							className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-accent text-sm font-semibold text-white transition-opacity hover:opacity-90"
							aria-label="Account menu"
						>
							{getInitials(user)}
						</button>

						{avatarOpen && (
							<div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-border bg-surface shadow-lg">
								<div className="border-b border-border px-4 py-3">
									<p className="m-0 text-sm font-medium text-text">
										{user.full_name || user.username}
									</p>
									<p className="m-0 text-xs text-muted">
										@{user.username}
									</p>
								</div>

								<button
									type="button"
									onClick={onLogout}
									disabled={loggingOut}
									className="cursor-pointer flex w-full items-center gap-2 rounded-b-lg px-4 py-3 text-sm font-medium text-danger transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
								>
									<LogOut size={16} />
									{loggingOut ? 'Logging out...' : 'Log Out'}
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</header>
	);
}