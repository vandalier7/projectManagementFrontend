'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { useSetBoardTitle, useSetBoardLogo } from '@/components/layout/AppBarActionsContext';
import ProjectGuard from '@/components/feedback/ProjectGuard';

export interface Assignee {
	id: number;
	full_name: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'submitted' | 'done' | 'closed';

export interface Task {
	id: number;
	title: string;
	description: string | null;
	status: TaskStatus;
	priority: string;
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
}

interface Project {
	id: number;
	name: string;
	logo_url: string | null;
	tasks: Task[];
}

const STATUS_META: Record<TaskStatus, { label: string; dot: string; text: string }> = {
	todo:        { label: 'To Do',       dot: 'bg-surface border-2 border-muted',      text: 'text-muted' },
	in_progress: { label: 'In Progress', dot: 'bg-surface border-2 border-blue-600',   text: 'text-blue-600' },
	submitted:   { label: 'Submitted',   dot: 'bg-surface border-2 border-yellow-600', text: 'text-yellow-600' },
	done:        { label: 'Done',        dot: 'bg-green-600 border-2 border-green-600', text: 'text-green-600' },
	closed:      { label: 'Closed',      dot: 'bg-danger border-2 border-danger',      text: 'text-danger' },
};

const SKELETON_DELAY_MS = 500;

function buildHistoryChain(task: Task): Task[] {
	const chain: Task[] = [];
	let current = task.previous_task;

	while (current) {
		chain.push(current);
		current = current.previous_task;
	}

	return chain;
}

function formatDate(value: string | null): string | null {
	if (!value) return null;
	return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function TaskDetailsPanel({ task, onClose }: { task: Task; onClose: () => void }) {
	const meta = STATUS_META[task.status];

	return (
		<div className="fixed top-23 right-8 z-20 w-80 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-lg border border-border bg-surface p-4">
			<div className="flex items-start justify-between gap-3">
				<h3 className="text-sm font-semibold text-text">{task.title}</h3>
				<button
					type="button"
					onClick={onClose}
					className="shrink-0 rounded p-1 text-muted hover:bg-bg hover:text-text cursor-pointer"
					aria-label="Close details"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			<span className={`mt-2 inline-block text-xs font-medium ${meta.text}`}>
				{meta.label}
			</span>

			{task.description && (
				<p className="mt-3 whitespace-pre-wrap text-sm text-muted">{task.description}</p>
			)}

			<div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 text-xs">
				{task.assignee && (
					<div className="flex justify-between gap-2">
						<span className="text-muted">Assignee</span>
						<span className="text-text">{task.assignee.full_name}</span>
					</div>
				)}
				<div className="flex justify-between gap-2">
					<span className="text-muted">Priority</span>
					<span className="text-text capitalize">{task.priority}</span>
				</div>
				{task.due_date && (
					<div className="flex justify-between gap-2">
						<span className="text-muted">Due</span>
						<span className="text-text">{formatDate(task.due_date)}</span>
					</div>
				)}
				{task.completed_date && (
					<div className="flex justify-between gap-2">
						<span className="text-muted">Completed</span>
						<span className="text-text">{formatDate(task.completed_date)}</span>
					</div>
				)}
				{task.submitted_at && (
					<div className="flex justify-between gap-2">
						<span className="text-muted">Submitted</span>
						<span className="text-text">{formatDate(task.submitted_at)}</span>
					</div>
				)}
			</div>

			{task.submission_link && (
				<div className="mt-3 border-t border-border pt-3">
					<p className="text-xs text-muted">Submission link</p>
					<a
						href={task.submission_link}
						target="_blank"
						rel="noreferrer"
						className="break-all text-xs text-accent hover:underline"
					>
						{task.submission_link}
					</a>
				</div>
			)}

			{task.submission_notes && (
				<div className="mt-3 border-t border-border pt-3">
					<p className="text-xs text-muted">Submission notes</p>
					<p className="mt-1 whitespace-pre-wrap text-xs text-text">{task.submission_notes}</p>
				</div>
			)}

			{task.review_comment && (
				<div className="mt-3 border-t border-border pt-3">
					<div className="flex items-center justify-between gap-2">
						<p className="text-xs text-muted">Review comment</p>
						{task.reviewed_at && (
							<span className="text-xs text-muted">{formatDate(task.reviewed_at)}</span>
						)}
					</div>
					<p className="mt-1 whitespace-pre-wrap text-xs text-text">{task.review_comment}</p>
				</div>
			)}
		</div>
	);
}

export default function ProjectTimelinePage() {
	const params = useParams();
	const projectId = params.id;

	const [user, setUser] = useState<User | null>(null);
	const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
	const [loadingRevisionsId, setLoadingRevisionsId] = useState<number | null>(null);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
	const pendingExpandTimeout = useRef<number | null>(null);

	useEffect(() => {
		setUser(getUser());
	}, []);

	const { data: project, error, isLoading } = useSWR<Project>(
		user ? `/projects/${projectId}?user=${user.id}` : null
	);

	useSetBoardTitle(project?.name ? `${project.name} / Timeline` : null);
	useSetBoardLogo(project?.logo_url ?? null);

	useEffect(() => {
		return () => {
			if (pendingExpandTimeout.current) window.clearTimeout(pendingExpandTimeout.current);
		};
	}, []);

	const handleExpandToggle = (task: Task) => {
		if (pendingExpandTimeout.current) {
			window.clearTimeout(pendingExpandTimeout.current);
			pendingExpandTimeout.current = null;
		}

		if (expandedTaskId === task.id) {
			setExpandedTaskId(null);
			setLoadingRevisionsId(null);
			return;
		}

		setExpandedTaskId(task.id);
		setLoadingRevisionsId(task.id);
		nodeRefs.current[task.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

		pendingExpandTimeout.current = window.setTimeout(() => {
			setLoadingRevisionsId(null);
		}, SKELETON_DELAY_MS);
	};

	const tasks = (project?.tasks ?? []).filter(task => task.status === 'done').reverse();

	return (
		<ProjectGuard isLoading={isLoading} error={error}>
			<div className="flex items-start gap-4">
				<div className="relative min-w-0 flex-1 pl-2 transition-all duration-300">
					<div className="absolute left-[24px] top-2 bottom-2 w-2 rounded-full bg-border" />

					<div className="flex flex-col">
						{tasks.map(task => {
							const meta = STATUS_META[task.status];
							const isExpanded = expandedTaskId === task.id;
							const revisionCount = buildHistoryChain(task).length;
							const isExpandable = revisionCount > 1;
							const chain = isExpanded ? buildHistoryChain(task) : [];
							const isSelected = selectedTask?.id === task.id;

							return (
								<div
									key={task.id}
									ref={el => { nodeRefs.current[task.id] = el; }}
									className="relative flex gap-4 scroll-mt-4 pb-1"
								>
									<div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center">
										<div className={`h-3.5 w-3.5 rounded-full ${meta.dot}`} />
									</div>

									<div className="min-w-0 flex-1 pt-1.5">
										<div
											role="button"
											tabIndex={0}
											onClick={() => {
												setSelectedTask(task);
												if (isExpandable) handleExpandToggle(task);
											}}
											onKeyDown={e => {
												if (e.key === 'Enter' || e.key === ' ') {
													setSelectedTask(task);
													if (isExpandable) handleExpandToggle(task);
												}
											}}
											className={`flex w-full flex-col gap-1 rounded-lg border bg-surface px-4 py-3 text-left transition-colors hover:border-accent cursor-pointer ${
												isSelected ? 'border-accent' : 'border-border'
											}`}
										>
											<div className="flex items-center justify-between gap-3">
												<span className="text-sm font-medium text-text truncate">
													{task.title}
												</span>

												<span className={`flex shrink-0 items-center gap-1 text-xs font-medium ${meta.text}`}>
													{revisionCount > 0 && (
														<span>{revisionCount} revision{revisionCount !== 1 ? 's' : ''}</span>
													)}
													{isExpandable && (
														isExpanded
															? <ChevronDown className="h-3.5 w-3.5" />
															: <ChevronRight className="h-3.5 w-3.5" />
													)}
												</span>
											</div>

											<div className="flex items-center gap-3 text-xs text-muted">
												{task.assignee && <span>{task.assignee.full_name}</span>}
												{task.completed_date && <span className="ml-auto">{formatDate(task.completed_date)}</span>}
											</div>
										</div>

										{isExpanded && chain.length > 0 && (
											<div className="relative mt-3 pl-6">
												<div className="absolute left-0 top-[-1.25rem] h-6 w-4 rounded-bl-2xl border-b-2 border-l-2 border-border" />
												<div className="absolute left-4 top-1 bottom-2 w-1 rounded-full bg-border/70" />

												<div className="flex flex-col gap-3">
													{chain.map((historyTask, index) => {
														const revisionNumber = revisionCount - index;
														const isHistorySelected = selectedTask?.id === historyTask.id;

														return (
															<div key={historyTask.id} className="relative flex gap-3">
																<div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center">
																	<div className={`h-2.5 w-2.5 rounded-full ${STATUS_META[historyTask.status].dot}`} />
																</div>

																<button
																	type="button"
																	onClick={() => setSelectedTask(historyTask)}
																	className={`min-w-0 flex-1 rounded-md border bg-bg px-3 py-2 text-left text-xs transition-colors hover:border-accent cursor-pointer ${
																		isHistorySelected ? 'border-accent' : 'border-border/70'
																	}`}
																>
																	<div className="flex items-center justify-between gap-2">
																		<span className="font-medium text-text truncate">
																			Revision {revisionNumber} — {historyTask.title}
																		</span>
																		{historyTask.reviewed_at && (
																			<span className="shrink-0 text-muted">
																				{formatDate(historyTask.reviewed_at)}
																			</span>
																		)}
																	</div>

																	{historyTask.review_comment && (
																		<p className="mt-1 text-muted">
																			{historyTask.review_comment}
																		</p>
																	)}
																</button>
															</div>
														);
													})}
												</div>
											</div>
										)}
									</div>
								</div>
							);
						})}

						{tasks.length === 0 && (
							<p className="pl-8 text-sm text-muted">No tasks yet.</p>
						)}
					</div>
				</div>

				<div
					className={`shrink-0 overflow-hidden transition-all duration-300 ${
						selectedTask ? 'w-80 opacity-100' : 'w-0 opacity-0'
					}`}
				>
					{selectedTask && (
						<TaskDetailsPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
					)}
				</div>
			</div>
		</ProjectGuard>
	);
}