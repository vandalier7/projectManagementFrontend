'use client';

import useSWR from 'swr';
import { apiClient } from '@/lib/api';
import type { AppNotification, NotificationsResponse } from '@/types';

/**
 * The current user's notifications, polled every 30s and on tab focus.
 * Every caller shares one cache entry, so mounting this in several places
 * doesn't multiply requests.
 */
export function useNotifications(enabled: boolean) {
	const { data, mutate } = useSWR<NotificationsResponse>(enabled ? '/notifications' : null, {
		refreshInterval: 30000,
		revalidateOnFocus: true,
		dedupingInterval: 5000,
	});

	/** Marks one as read, updating the badge immediately. A failure is corrected by the next poll. */
	const markRead = async (notification: AppNotification) => {
		if (notification.read_at) return;

		mutate(
			current =>
				current && {
					notifications: current.notifications.map(n =>
						n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
					),
					unread_count: Math.max(0, current.unread_count - 1),
				},
			{ revalidate: false }
		);

		try {
			await apiClient(`/notifications/${notification.id}/read`, { method: 'POST' });
		} catch {
			// The next poll resyncs the real state.
		}
	};

	return {
		notifications: data?.notifications ?? [],
		unreadCount: data?.unread_count ?? 0,
		markRead,
	};
}
