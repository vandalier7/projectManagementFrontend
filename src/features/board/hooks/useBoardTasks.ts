'use client';

import { useMemo, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { taskApi } from '@/features/tasks';
import type { Task, TaskStatus } from '@/types';

/**
 * Board task state: sorted tasks, an optional "mine + unassigned" filter, and
 * optimistic drag-to-reorder within a column.
 *
 * @param serverTasks tasks from the project payload
 * @param refresh     revalidates the project (used to roll back a failed reorder)
 */
export function useBoardTasks(serverTasks: Task[] | undefined, currentUserId: number | null, refresh: () => void) {
	// Order overrides applied immediately on drop. They're tied to the server
	// payload they were made against, so they drop away as soon as fresh data
	// (with the saved order, or someone else's change) arrives.
	const [override, setOverride] = useState<{ base: Task[] | undefined; order: Map<number, number> } | null>(null);
	const localOrder = override && override.base === serverTasks ? override.order : null;
	const [showMineOnly, setShowMineOnly] = useState(false);

	const tasks = useMemo(() => {
		const order = (t: Task) => localOrder?.get(t.id) ?? t.sort_order;
		return [...(serverTasks ?? [])].sort((a, b) => order(a) - order(b));
	}, [serverTasks, localOrder]);

	const visible = useMemo(
		() => (showMineOnly && currentUserId != null ? tasks.filter(t => !t.assignee || t.assignee.id === currentUserId) : tasks),
		[tasks, showMineOnly, currentUserId]
	);

	const byStatus = (status: TaskStatus) => visible.filter(t => t.status === status);

	const reorder = async (status: TaskStatus, activeId: number, overId: number) => {
		const column = byStatus(status);
		const from = column.findIndex(t => t.id === activeId);
		const to = column.findIndex(t => t.id === overId);
		if (from < 0 || to < 0) return;

		const reordered = arrayMove(column, from, to);
		const order = new Map(localOrder ?? []);
		reordered.forEach((t, index) => order.set(t.id, index));
		setOverride({ base: serverTasks, order });

		try {
			await taskApi.reorder(reordered.map(t => t.id));
		} catch {
			setOverride(null);
		} finally {
			refresh();
		}
	};

	return { byStatus, reorder, showMineOnly, toggleMineOnly: () => setShowMineOnly(v => !v) };
}
