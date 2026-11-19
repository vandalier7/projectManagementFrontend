'use client';

import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import ProjectGuard from '@/components/feedback/ProjectGuard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useProject } from '@/features/projects/hooks/useProject';
import { useProjectBoardChrome } from '@/features/projects/hooks/useProjectBoardChrome';
import TimelineEntry from '@/features/timeline/components/TimelineEntry';
import TimelineTaskDetails from '@/features/timeline/components/TimelineTaskDetails';
import type { Task } from '@/types';

/** Completed tasks, newest first, with their revision history. */
export default function ProjectTimelinePage() {
	const { id } = useParams<{ id: string }>();
	const user = useCurrentUser();
	const { data: project, error, isLoading } = useProject(user ? id : null);
	const [expandedId, setExpandedId] = useState<number | null>(null);
	const [selected, setSelected] = useState<Task | null>(null);
	const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

	useProjectBoardChrome(project, error, { section: 'Timeline' });

	const handleActivate = (task: Task, hasRevisions: boolean) => {
		setSelected(task);
		if (!hasRevisions) return;

		if (expandedId === task.id) {
			setExpandedId(null);
		} else {
			setExpandedId(task.id);
			nodeRefs.current[task.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	const tasks = (project?.tasks ?? []).filter(task => task.status === 'done').reverse();

	return (
		<ProjectGuard isLoading={isLoading} error={error}>
			<div className="flex items-start gap-4">
				<div className="relative min-w-0 flex-1 pl-2 transition-all duration-300">
					<div className="absolute left-[24px] top-2 bottom-2 w-2 rounded-full bg-border" />

					<div className="flex flex-col">
						{tasks.map(task => (
							<TimelineEntry
								key={task.id}
								ref={el => {
									nodeRefs.current[task.id] = el;
								}}
								task={task}
								expanded={expandedId === task.id}
								selectedId={selected?.id ?? null}
								onActivate={handleActivate}
								onSelectRevision={setSelected}
							/>
						))}

						{tasks.length === 0 && <p className="pl-8 text-sm text-muted">No tasks yet.</p>}
					</div>
				</div>

				<div className={`shrink-0 overflow-hidden transition-all duration-300 ${selected ? 'w-80 opacity-100' : 'w-0 opacity-0'}`}>
					{selected && <TimelineTaskDetails task={selected} onClose={() => setSelected(null)} />}
				</div>
			</div>
		</ProjectGuard>
	);
}
