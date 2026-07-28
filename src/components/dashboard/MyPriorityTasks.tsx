'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { ChevronRight, Circle, FolderKanban, PartyPopper, Square, Star, Stars } from 'lucide-react';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import DashboardTaskModal from './DashbordTaskModal';

interface Assignee {
	id: number;
	full_name: string;
}

interface Project {
	id: number;
	name: string;
}

type Priority = 'high' | 'medium' | 'low';
type Status = 'todo' | 'in_progress' | 'submitted' | 'done' | 'closed';

interface Task {
	id: number;
	title: string;
	description: string | null;
	status: Status;
	priority: Priority;
	requires_submission: boolean;
	sort_order: number;
	due_date: string | null;
	assignee: Assignee | null;
	submission_link: string | null;
	submission_notes: string | null;
	submitted_at: string | null;
	review_comment: string | null;
	reviewed_at: string | null;
	completed_date: string | null;
	previous_task: Task | null;
	project: Project;
	project_lead_id: number;
}

// Priority accent — pulled from the maroon-ish theme palette itself
// (accent = deep maroon, accent-hover = warm coral, muted = soft brown)
// rather than generic red/green/blue, so priority coloring stays
// consistent with the rest of the UI.
function getPriorityClasses(priority: Priority): { border: string; accent: string; text: string } {
	switch (priority) {
		case 'high':
			return { border: 'border-border', accent: 'border-l-accent', text: 'text-accent' };
		case 'medium':
			return { border: 'border-border', accent: 'border-l-accent-hover', text: 'text-accent-hover' };
		default:
			return { border: 'border-border', accent: 'border-l-muted', text: 'text-muted' };
	}
}

function getDueInfo(dateStr: string | null) {
	if (!dateStr) return { label: '', urgent: false };

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const due = new Date(dateStr);
	due.setHours(0, 0, 0, 0);

	const diff = Math.floor(
		(due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
	);

	let label: string;
	if (diff < 0) label = 'Overdue';
	else if (diff === 0) label = 'Today';
	else if (diff < 7) label = `${diff}d`;
	else if (diff < 14) label = '1w';
	else label = `${Math.ceil(diff / 7)}w`;

	return { label, urgent: diff <= 0 };
}

function ranking(task: Task) {
	if (!task.due_date) return 6;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const due = new Date(task.due_date);
	due.setHours(0, 0, 0, 0);

	const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

	if (diff < 0) return 0;
	if (diff === 0) return 1;
	if (task.priority === 'high') return 2;
	if (diff <= 7) return 3;
	if (task.priority === 'medium') return 4;

	return 5;
}

// Only todo/in_progress get a status icon here — every other status means
// the task is out of the "active work" loop this widget cares about
// (submitted/done/closed are already filtered out of topTasks below).
// Color is passed in by the caller so it matches the card's left-border
// accent (i.e. the task's priority color), not a fixed grey.
function getStatusIcon(status: Status, colorClass: string) {
	switch (status) {
		case 'todo':
			return <Stars size={14} className={colorClass} fill="currentColor" />;
		case 'in_progress':
			return <Circle size={14} className={colorClass} fill="currentColor" />;
		default:
			return null;
	}
}

// Row height matches the loading skeleton's h-14 (56px). Container is sized
// for exactly 3 rows + 2 gaps (gap-2 = 8px) + top/bottom padding (p-2 = 8px
// each) = 3*56 + 2*8 + 16 = 200px, so the widget doesn't resize between
// loading/error/empty/populated states.
const LIST_HEIGHT = 'h-[200px]';

export default function MyPriorityTasks() {
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		setUser(getUser());
	}, []);

	const { data, error, isLoading, mutate } = useSWR<Task[]>(
		user ? `/tasks/mine?user=${user.id}` : null
	);

	const tasks = data ?? [];
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);

	const topTasks = useMemo(() => {
		return [...tasks]
			.filter(t => t.status !== 'submitted' && t.status !== 'done' && t.status !== 'closed')
			.sort((a, b) => {
				const rankDiff = ranking(a) - ranking(b);
				if (rankDiff !== 0) return rankDiff;
				if (!a.due_date || !b.due_date) return 0;
				return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
			})
			.slice(0, 3);
	}, [tasks]);

	return (
		<>
			<div className="rounded-xl border border-border bg-surface shadow-sm">
				<div className="flex items-center justify-between border-b border-border px-4 py-2.5">
					<h2 className="text-sm font-semibold text-text">
						Prioritized Tasks
					</h2>

					<button
						className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover"
						onClick={() => console.log('Go to My Tasks')}
					>
						View All
						<ChevronRight size={14} />
					</button>
				</div>

				<div className={`${LIST_HEIGHT} overflow-y-auto`}>
					{isLoading ? (
						<div className="flex h-full flex-col gap-2 p-2">
							{[0, 1, 2].map(i => (
								<div key={i} className="h-14 animate-pulse rounded bg-bg" />
							))}
						</div>
					) : error ? (
						<div className="flex h-full flex-col items-center justify-center px-6 text-center">
							<p className="text-sm font-medium text-danger">
								Couldn't load your tasks.
							</p>
							<button
								onClick={() => mutate()}
								className="mt-1 text-xs font-medium text-accent hover:text-accent-hover"
							>
								Try again
							</button>
						</div>
					) : topTasks.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center px-6 text-center">
							<PartyPopper className="mx-auto h-6 w-6 text-accent" />
							<p className="mt-2 text-sm font-medium text-text">
								You're all caught up!
							</p>
							<p className="mt-0.5 text-xs text-muted">
								No active tasks assigned to you.
							</p>
						</div>
					) : (
						<div className="flex flex-col gap-2 p-2">
							{topTasks.map(task => {
								const priorityClasses = getPriorityClasses(task.priority);
								const dueInfo = getDueInfo(task.due_date);
								const cardBorderClasses = dueInfo.urgent
									? 'border border-l-4 border-danger'
									: `border ${priorityClasses.border} border-l-4 ${priorityClasses.accent}`;
								// When the due date is urgent, the left bar turns red
								// (border-danger) instead of the priority color — so
								// the icon should follow that same override to stay
								// visually tied to the bar, not the (now-overridden)
								// priority color.
								const iconColorClass = dueInfo.urgent ? 'text-danger' : priorityClasses.text;
								const statusIcon = getStatusIcon(task.status, iconColorClass);

								return (
									<div
										key={task.id}
										onClick={() => setSelectedTask(task)}
										className={`${cardBorderClasses} relative flex h-14 cursor-pointer flex-col gap-1.5 rounded p-2.5 shadow-sm transition-all duration-150 hover:border-accent/40 hover:shadow-md`}
									>
										<div className="flex items-start justify-between gap-2">
											<span className="truncate text-sm font-medium leading-tight text-text">
												{task.title}
											</span>
											<div className="flex shrink-0 items-center gap-1.5">
												<span
													className={`whitespace-nowrap font-mono text-xs ${
														dueInfo.urgent ? 'text-danger' : 'text-muted'
													}`}
												>
													{dueInfo.label}
												</span>
												{statusIcon}
											</div>
										</div>

										<div className="flex items-center gap-1.5 text-xs text-muted">
											<FolderKanban size={12} />
											<span className="truncate">{task.project.name}</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{selectedTask && user && (
				<DashboardTaskModal
					task={selectedTask}
					projectLeadId={selectedTask.project_lead_id}
					currentUser={user}
					onClose={() => setSelectedTask(null)}
					onMutate={() => {
						mutate();
						setSelectedTask(null);
					}}
					onReject={() => setSelectedTask(null)}
					onEdit={() => setSelectedTask(null)}
				/>
			)}
		</>
	);
}