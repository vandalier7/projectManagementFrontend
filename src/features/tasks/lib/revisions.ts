import type { Task } from '@/types';

/**
 * Flattens a nested revision chain into a list, newest first, not including
 * the task itself: task.previous_task, its previous_task, …
 */
export function flattenRevisionChain(task: Task): Task[] {
	const chain: Task[] = [];
	let cursor = task.previous_task;

	while (cursor) {
		chain.push(cursor);
		cursor = cursor.previous_task;
	}

	return chain;
}
