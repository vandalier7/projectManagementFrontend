'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Check, CheckCircle2, Circle, PartyPopper, Plus, Stars } from 'lucide-react';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import DashbordTaskModal from './DashbordTaskModal';
import TaskCreateModal from '@/components/TaskCreateModal';
import TaskEditModal from '@/components/TaskEditModal';

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

// Same shape as MyPriorityTasks' Task — kept identical so DashboardTaskModal
// can be reused without changes to its prop contract.
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

// Member/lead shape needed by TaskCreateModal — fetched separately here
// since this widget's own /projects/system/tasks endpoint only returns
// tasks, not the project's member list or lead.
interface Member {
	id: number;
	user: {
		id: number;
		full_name: string;
		system_role: 'admin' | 'team_member';
		profile_completed: boolean;
	};
}

interface SystemProjectDetails {
	id: number;
	lead_id: number;
	members: Member[];
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

// todo/in_progress get their existing icons; done gets a checkmark (the
// card itself is grayscaled separately, so this icon reads as "muted" too
// without needing special-case coloring here). Every other status (submitted,
// closed) has no icon — this widget doesn't track those visually.
function getStatusIcon(status: Status, colorClass: string) {
	switch (status) {
		case 'todo':
			return <Stars size={14} className={colorClass} fill="currentColor" />;
		case 'in_progress':
			return <Circle size={14} className={colorClass} fill="currentColor" />;
		case 'done':
			return <Check size={14} className={colorClass} />;
		default:
			return null;
	}
}

// System project is always project id 1, by convention (see ProjectTasksPage).
const SYSTEM_PROJECT_ID = 1;

export default function SystemProjectTasks() {
	const [user, setUser] = useState<User | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);

	useEffect(() => {
		setUser(getUser());
	}, []);

	// Backend already scopes visibility: admins get every task in the
	// system project, everyone else gets tasks assigned to them plus
	// unassigned ones. This widget just renders whatever comes back.
	const { data, error, isLoading, mutate } = useSWR<Task[]>(
		user ? `/projects/system/tasks?user=${user.id}` : null
	);

	const isAdmin = user?.system_role === 'admin';

	// Only fetched when an admin is present — the create modal needs the
	// project's member list and lead_id, which the tasks-only endpoint
	// above doesn't return. Non-admins never see the create button, so
	// they never trigger this extra request.
	const { data: projectDetails } = useSWR<SystemProjectDetails>(
		isAdmin && user ? `/projects/${SYSTEM_PROJECT_ID}?user=${user.id}` : null
	);

	// Done tasks stay visible (grayed out) instead of vanishing immediately —
	// they only drop off 96 hours after completion, giving people a window
	// to double check something before it's gone for good.
	const DONE_RETENTION_MS = 96 * 60 * 60 * 1000;

	function isExpiredDone(task: Task): boolean {
		if (task.status !== 'done' || !task.completed_date) return false;
		return Date.now() - new Date(task.completed_date).getTime() > DONE_RETENTION_MS;
	}

	// Priority first, then status — except done tasks are always pushed to
	// the bottom regardless of their priority, since they're no longer
	// "active" work even if they were high priority while in flight.
	const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
	const statusOrder: Record<Status, number> = { todo: 0, in_progress: 1, submitted: 2, closed: 3, done: 4 };

	function sortTasks(a: Task, b: Task): number {
		if (a.status === 'done' && b.status !== 'done') return 1;
		if (b.status === 'done' && a.status !== 'done') return -1;

		const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
		if (priorityDiff !== 0) return priorityDiff;

		return statusOrder[a.status] - statusOrder[b.status];
	}

	const tasks = (data ?? []).filter(t => !isExpiredDone(t)).sort(sortTasks);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [editTask, setEditTask] = useState<Task | null>(null);

	return (
		<>
			<div className="flex h-full flex-col rounded-xl border border-border bg-surface shadow-sm">
				<div className="flex items-center justify-between border-b border-border px-4 py-2.5">
					<h2 className="text-sm font-semibold text-text">
						General
					</h2>

					{isAdmin && (
						<button
							onClick={() => setShowCreateModal(true)}
							className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover"
						>
							<Plus size={14} />
							New Task
						</button>
					)}
				</div>

				<div className="flex-1 overflow-y-auto">
					{isLoading ? (
						<div className="flex h-full flex-col gap-2 p-2">
							{[0, 1, 2, 3, 4].map(i => (
								<div key={i} className="h-14 shrink-0 animate-pulse rounded bg-bg" />
							))}
						</div>
					) : error ? (
						<div className="flex h-full flex-col items-center justify-center px-6 text-center">
							<p className="text-sm font-medium text-danger">
								Couldn't load tasks.
							</p>
							<button
								onClick={() => mutate()}
								className="mt-1 text-xs font-medium text-accent hover:text-accent-hover"
							>
								Try again
							</button>
						</div>
					) : tasks.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center px-6 text-center">
							<PartyPopper className="mx-auto h-6 w-6 text-accent" />
							<p className="mt-2 text-sm font-medium text-text">
								Nothing here yet.
							</p>
							<p className="mt-0.5 text-xs text-muted">
								No tasks to show right now.
							</p>
						</div>
					) : (
						<div className="flex flex-col gap-2 p-2">
							{tasks.map(task => {
								const isDone = task.status === 'done';
								const priorityClasses = getPriorityClasses(task.priority);
								const dueInfo = getDueInfo(task.due_date);
								// A done task's due date no longer matters — don't let
								// it force the red "urgent" border on a completed card.
								const urgent = dueInfo.urgent && !isDone;
								const cardBorderClasses = urgent
									? 'border border-l-4 border-danger'
									: `border ${priorityClasses.border} border-l-4 ${priorityClasses.accent}`;
								// When the due date is urgent, the left bar turns red
								// (border-danger) instead of the priority color — so
								// the icon should follow that same override to stay
								// visually tied to the bar, not the (now-overridden)
								// priority color.
								const iconColorClass = urgent ? 'text-danger' : priorityClasses.text;
								const statusIcon = getStatusIcon(task.status, iconColorClass);

								return (
									<div
										key={task.id}
										onClick={() => setSelectedTask(task)}
										className={`${cardBorderClasses} relative flex h-14 shrink-0 cursor-pointer flex-col gap-1.5 rounded p-2.5 shadow-sm transition-all duration-150 hover:border-accent/40 hover:shadow-md ${
											isDone ? 'grayscale opacity-90' : ''
										}`}
									>
										<div className="flex items-start justify-between gap-2">
											<span className="truncate text-sm font-medium leading-tight text-text">
												{task.title}
											</span>
											<div className="flex shrink-0 items-center gap-1.5">
												{!isDone && (
													<span
														className={`whitespace-nowrap font-mono text-xs ${
															urgent ? 'text-danger' : 'text-muted'
														}`}
													>
														{dueInfo.label}
													</span>
												)}
												{statusIcon}
											</div>
										</div>

										<div className="flex items-center gap-1.5 text-xs text-muted">
											<span className="truncate">
												{task.assignee ? task.assignee.full_name : 'Unassigned'}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{selectedTask && user && (
				<DashbordTaskModal
					task={selectedTask}
					projectLeadId={selectedTask.project_lead_id}
					currentUser={user}
					isSystemProjectTask
					onClose={() => setSelectedTask(null)}
					onMutate={() => {
						mutate();
						setSelectedTask(null);
					}}
					onDelete={(taskId) => {
						mutate(prev => (prev ?? []).filter(t => t.id !== taskId), false);
						setSelectedTask(null);
					}}
					onReject={() => setSelectedTask(null)}
					onEdit={(task) => {
						setSelectedTask(null);
						setEditTask(task);
					}}
				/>
			)}

			{editTask && user && projectDetails && (
				<TaskEditModal
					task={editTask}
					members={projectDetails.members}
					currentUser={user}
					onClose={() => setEditTask(null)}
					onMutate={(updated) => {
						if (updated) {
							mutate(
								prev => (prev ?? []).map(t => (t.id === updated.id ? { ...t, ...updated } : t)),
								false
							);
						} else {
							mutate();
						}
						setEditTask(null);
					}}
				/>
			)}

			{showCreateModal && user && projectDetails && (
				<TaskCreateModal
					projectId={projectDetails.id}
					members={projectDetails.members}
					currentUser={user}
					defaultRequiresSubmission={false}
					isSystemProject
					onClose={() => setShowCreateModal(false)}
					onMutate={(created) => {
						if (created) {
							const withProjectContext: Task = {
								...created,
								project: { id: projectDetails.id, name: 'General' },
								project_lead_id: projectDetails.lead_id,
								previous_task: null,
							};
							mutate(prev => [...(prev ?? []), withProjectContext], false);
						} else {
							mutate();
						}
						setShowCreateModal(false);
					}}
					projectLeadId={projectDetails.lead_id}
				/>
			)}
		</>
	);
}