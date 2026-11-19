'use client';

import { useSortable } from '@dnd-kit/sortable';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { formatDueDate } from '@/lib/dates';
import { priorityStyle } from '@/features/tasks';
import type { Task } from '@/types';

/** Board priority colours are fixed (red-orange / yellow / green), not theme-derived. */
const BOARD_PALETTE = 'fixed' as const;

function dueInfo(task: Task) {
	if (!task.due_date || task.status === 'submitted' || task.status === 'done') return null;
	return formatDueDate(task.due_date);
}

interface DragHandle {
	attributes?: DraggableAttributes;
	listeners?: DraggableSyntheticListeners;
}

/** The card's look, without any click or drag behaviour. Also used as the drag overlay. */
export function TaskCardVisual({ task, dragHandle, showHandle = false }: { task: Task; dragHandle?: DragHandle; showHandle?: boolean }) {
	const due = dueInfo(task);
	const borders = due?.urgent
		? 'border border-l-4 border-danger'
		: `border border-border border-l-4 ${priorityStyle(task.priority, BOARD_PALETTE).bar}`;

	return (
		<div className={`bg-surface ${borders} relative rounded shadow-sm p-3 ${showHandle ? 'pr-7' : ''} flex flex-col gap-2`}>
			<div className="flex items-start justify-between gap-2">
				<span className="text-sm font-medium text-text leading-snug">{task.title}</span>
				{due && (
					<span className={`font-mono text-xs whitespace-nowrap shrink-0 ${due.urgent ? 'text-danger' : 'text-muted'}`}>{due.label}</span>
				)}
			</div>

			{task.assignee && (
				<div className="flex items-center justify-end">
					<span className="text-xs text-muted">{task.assignee.full_name}</span>
				</div>
			)}

			{showHandle && (
				<span
					className="absolute right-1 top-1/2 -translate-y-1/2 text-muted cursor-grab active:cursor-grabbing select-none hover:text-text"
					{...(dragHandle?.attributes ?? {})}
					{...(dragHandle?.listeners ?? {})}
					onClick={e => e.stopPropagation()}
					title="Drag to reorder"
				>
					<GripVertical className="h-4 w-4" />
				</span>
			)}
		</div>
	);
}

/** Card that can be reordered via its drag handle (the rest of the card stays clickable). */
export function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
				transition,
			}}
			className={`cursor-pointer transition-shadow hover:shadow-md ${isDragging ? 'opacity-0' : ''}`}
			onClick={onClick}
		>
			<TaskCardVisual task={task} dragHandle={{ attributes, listeners }} showHandle />
		</div>
	);
}

export function StaticTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
	return (
		<div className="cursor-pointer transition-shadow hover:shadow-md" onClick={onClick}>
			<TaskCardVisual task={task} />
		</div>
	);
}
