'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';
import type { AppNotification } from '@/types';
import { useNotifications } from './useNotifications';

function timeAgo(dateStr: string): string {
	const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
	if (mins < 1) return 'just now';
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
}

/** Bell with unread badge; opens a dropdown. Clicking an item marks it read and follows its link. */
export default function NotificationsMenu({ enabled }: { enabled: boolean }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const { notifications, unreadCount, markRead } = useNotifications(enabled);

	useClickOutside(ref, useCallback(() => setOpen(false), []), open);

	const handleClick = (notification: AppNotification) => {
		setOpen(false);
		markRead(notification);
		if (notification.action_url) router.push(notification.action_url);
	};

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen(v => !v)}
				className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-red-50 hover:text-text"
				aria-label="Notifications"
				aria-expanded={open}
			>
				<Bell size={20} />
				{unreadCount > 0 && (
					<span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white">
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</button>

			{open && (
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
								{notifications.map(n => (
									<button
										key={n.id}
										type="button"
										onClick={() => handleClick(n)}
										className={`flex flex-col gap-0.5 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-bg ${!n.read_at ? 'bg-accent/5' : ''}`}
									>
										<div className="flex items-start justify-between gap-2">
											<span className="text-sm font-medium text-text leading-snug">{n.title}</span>
											{!n.read_at && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
										</div>
										{n.body && <span className="text-xs text-muted leading-snug">{n.body}</span>}
										<span className="text-[11px] text-muted mt-0.5">
											{n.project_name ?? 'General'} · {timeAgo(n.created_at)}
										</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
