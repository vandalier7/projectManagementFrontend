'use client';

import { useRef, useState } from 'react';
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/types';
import { SortableTaskCard, StaticTaskCard, TaskCardVisual } from './TaskCard';

export interface ColumnDef {
	key: TaskStatus;
	label: string;
}

function EmptyColumn() {
	return <p className="text-xs text-muted px-1 py-2 m-0">No tasks</p>;
}

/**
 * One board column. Each column has its own DnD context, so cards can be
 * reordered within a column but never dragged into another status — status
 * changes go through the task lifecycle, not drag-and-drop.
 */
export default function BoardColumn({
	column,
	tasks,
	canReorder,
	onReorder,
	onTaskClick,
}: {
	column: ColumnDef;
	tasks: Task[];
	canReorder: boolean;
	/** A card was dropped onto another card's position in this column. */
	onReorder: (status: TaskStatus, activeId: number, overId: number) => void;
	onTaskClick: (task: Task) => void;
}) {
	const listRef = useRef<HTMLDivElement>(null);
	// Freeze the list height while dragging so the column doesn't jump.
	const [lockedHeight, setLockedHeight] = useState<number | null>(null);
	const [activeTask, setActiveTask] = useState<Task | null>(null);
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

	const endDrag = () => {
		setLockedHeight(null);
		setActiveTask(null);
	};

	const handleDragStart = (event: DragStartEvent) => {
		if (listRef.current) setLockedHeight(listRef.current.offsetHeight);
		setActiveTask(tasks.find(t => t.id === event.active.id) ?? null);
	};

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		endDrag();
		if (over && active.id !== over.id) onReorder(column.key, Number(active.id), Number(over.id));
	};

	return (
		<div className="min-w-60 flex-1 flex flex-col gap-2">
			<div className="flex items-center justify-between px-1 pb-2 border-b border-border">
				<span className="text-sm font-semibold text-text">{column.label}</span>
				<span className="font-mono text-xs text-muted">{tasks.length}</span>
			</div>

			{canReorder ? (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					onDragCancel={endDrag}
				>
					<SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
						<div
							ref={listRef}
							className="flex flex-col gap-2"
							style={lockedHeight !== null ? { height: lockedHeight, overflow: 'hidden' } : undefined}
						>
							{tasks.map(task => (
								<SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
							))}
							{tasks.length === 0 && <EmptyColumn />}
						</div>
					</SortableContext>

					<DragOverlay>
						{activeTask && (
							<div className="shadow-lg rounded">
								<TaskCardVisual task={activeTask} showHandle />
							</div>
						)}
					</DragOverlay>
				</DndContext>
			) : (
				<div className="flex flex-col gap-2">
					{tasks.map(task => (
						<StaticTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
					))}
					{tasks.length === 0 && <EmptyColumn />}
				</div>
			)}
		</div>
	);
}
