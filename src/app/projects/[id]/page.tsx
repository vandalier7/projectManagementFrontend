'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { getToken, getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import TaskModal from '@/components/TaskModal';
import TaskCreateModal from '@/components/TaskCreateModal';
import AddMemberPanel from '@/components/AddMemberPanel';
import RejectModal from '@/components/RejectModal';

interface Assignee {
	id: number;
	full_name: string;
}

interface Task {
	id: number;
	title: string;
	description: string | null;
	status: 'todo' | 'in_progress' | 'submitted' | 'done' | 'closed';
	priority: string;
	requires_submission: boolean;
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

interface Member {
	id: number;
	user: {
		id: number;
		full_name: string;
	};
}

interface Project {
	id: number;
	name: string;
	status: string;
	lead_id: number;
	lead: { full_name: string } | null;
	tasks: Task[];
	members: Member[];
	task_default_submission_mode: 'require' | 'no_require' | 'match_last';
}

interface AllUser {
	id: number;
	full_name: string;
}

const COLUMNS: { key: Task['status']; label: string }[] = [
	{ key: 'todo', label: 'To Do' },
	{ key: 'in_progress', label: 'In Progress' },
	{ key: 'submitted', label: 'Submitted' },
	{ key: 'done', label: 'Done' },
];

const priorityStyles: Record<string, string> = {
	high: 'bg-red-50 text-red-800',
	medium: 'bg-yellow-50 text-yellow-800',
	low: 'bg-gray-100 text-muted',
};

const chipStyles: Record<string, string> = {
	active: 'bg-green-100 text-green-800',
	inactive: 'bg-gray-100 text-muted',
	archived: 'bg-gray-100 text-muted',
};

export default function ProjectBoardPage() {
	const router = useRouter();
	const params = useParams();
	const projectId = params.id;

	const [user, setUser] = useState<User | null>(null);
	const [hasToken, setHasToken] = useState<boolean | null>(null);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [rejectTask, setRejectTask] = useState<Task | null>(null);

	useEffect(() => {
		if (!getToken()) {
			router.push('/login');
			setHasToken(false);
			return;
		}
		setUser(getUser());
		setHasToken(true);
	}, [router]);

	const { data: project, error, isLoading, mutate } = useSWR<Project>(
		hasToken && user ? `/projects/${projectId}?user=${user.id}` : null
	);

	// Used by AddMemberPanel to know which users are available to add.
	// Same access rule as everywhere else — admin sees all, members would
	// only see their own scoped list (not relevant for this dropdown's
	// purposes, since only admin/lead can add members anyway).
	const { data: allUsers } = useSWR<AllUser[]>(hasToken ? '/users' : null);

	const isAdmin = user?.system_role === 'admin';
	const isLead = user?.id === project?.lead_id;
	const canCreateTask = isAdmin || isLead;
	const canManageMembers = isAdmin || isLead;

	const tasksByStatus = (status: Task['status']) =>
		(project?.tasks ?? []).filter(t => t.status === status);

	const defaultRequiresSubmission =
    project?.task_default_submission_mode === 'no_require' ? false : true;

	// --- ADD HERE ---
	if (error?.message === 'You do not have access to this project.') {
		return (
			<main className="min-h-screen bg-bg flex items-center justify-center">
				<div className="bg-surface border border-border rounded-xl shadow-md px-10 py-12 w-full max-w-md flex flex-col gap-4">
					<h1 className="text-xl font-semibold text-text m-0">Access Denied</h1>
					<p className="text-sm text-muted m-0">You do not have access to this project.</p>
					<button
						className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover self-start"
						onClick={() => router.replace('/projects')}
					>
						Back to Projects
					</button>
				</div>
			</main>
		);
	}

	// --- ADD HERE ---
	if (error && error.message !== 'You do not have access to this project.') {
		return (
			<main className="min-h-screen bg-bg flex items-center justify-center">
				<div className="bg-surface border border-border rounded-xl shadow-md px-10 py-12 w-full max-w-md flex flex-col gap-4">
					<h1 className="text-xl font-semibold text-text m-0">Project Not Found</h1>
					<p className="text-sm text-muted m-0">This project does not exist or has been removed.</p>
					<button
						className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover self-start"
						onClick={() => router.replace('/projects')}
					>
						Back to Projects
					</button>
				</div>
			</main>
		);
	}

	if (!project && isLoading) {
		return (
			<main className="min-h-screen bg-bg flex items-center justify-center">
				<p className="text-sm text-muted">Loading...</p>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-bg flex">
			{/* Sidebar */}
			<aside className="w-60 min-w-60 bg-surface border-r border-border px-6 py-8 flex flex-col gap-4">
				 <button
					className="text-sm text-muted cursor-pointer hover:text-text transition-colors bg-transparent border-none p-0 self-start"
					onClick={() => router.push('/projects')}
				>
					← Projects
				</button>
				{isLoading && <p className="text-sm text-muted">Loading...</p>}
				{error && <p className="text-sm text-danger">{error.message}</p>}
				{project && (
					<>
						<h1 className="text-lg font-semibold text-text m-0">{project.name}</h1>

						<span className={`font-mono text-xs tracking-wide px-2 py-0.5 rounded lowercase self-start ${chipStyles[project.status] ?? 'bg-gray-100 text-muted'}`}>
							{project.status}
						</span>

						<div className="flex flex-col gap-0.5">
							<span className="text-xs text-muted uppercase tracking-wide">Lead</span>
							<span className="text-sm text-text">
								{project.lead ? project.lead.full_name : '—'}
							</span>
						</div>

						{canManageMembers ? (
							<AddMemberPanel
								projectId={project.id}
								members={project.members}
								allUsers={allUsers ?? []}
								onMutate={() => mutate()}
							/>
						) : (
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted uppercase tracking-wide">Members</span>
								{project.members.length === 0 && (
									<span className="text-sm text-muted">No members yet.</span>
								)}
								{project.members.map(m => (
									<span key={m.id} className="text-sm text-text">
										{m.user.full_name}
									</span>
								))}
							</div>
						)}

						{canCreateTask && (
							<button
								className="text-sm font-medium text-white bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover mt-2"
								onClick={() => setShowCreateModal(true)}
							>
								+ New Task
							</button>
						)}
					</>
				)}
			</aside>

			{/* Board */}
			<div className="flex-1 flex gap-4 px-6 py-8 overflow-x-auto items-start">
				{COLUMNS.map(col => (
					<div key={col.key} className="min-w-60 w-60 flex flex-col gap-2">
						<div className="flex items-center justify-between px-1 pb-2 border-b border-border">
							<span className="text-sm font-semibold text-text">{col.label}</span>
							<span className="font-mono text-xs text-muted">{tasksByStatus(col.key).length}</span>
						</div>

						<div className="flex flex-col gap-2">
							{tasksByStatus(col.key).map(task => (
								<div
									key={task.id}
									className="bg-surface border border-border rounded shadow-sm p-3 flex flex-col gap-2 cursor-pointer transition-shadow hover:shadow-md"
									onClick={() => setSelectedTask(task)}
								>
									<div className="flex items-start justify-between gap-2">
										<span className="text-sm font-medium text-text leading-snug">{task.title}</span>
										{task.requires_submission && (
											<span className="w-2 h-2 min-w-2 rounded-full bg-accent mt-1" title="Requires submission" />
										)}
									</div>

									<div className="flex items-center justify-between gap-2">
										<span className={`font-mono text-xs tracking-wide px-1.5 py-0.5 rounded lowercase ${priorityStyles[task.priority] ?? 'bg-gray-100 text-muted'}`}>
											{task.priority}
										</span>
										{task.assignee && (
											<span className="text-xs text-muted">{task.assignee.full_name}</span>
										)}
									</div>

									{task.due_date && (
										<span className="font-mono text-xs text-muted">{task.due_date}</span>
									)}
								</div>
							))}

							{tasksByStatus(col.key).length === 0 && (
								<p className="text-xs text-muted px-1 py-2 m-0">No tasks</p>
							)}
						</div>
					</div>
				))}
			</div>

			{selectedTask && user && project && (
				<TaskModal
					task={selectedTask}
					projectLeadId={project.lead_id}
					currentUser={user}
					onClose={() => setSelectedTask(null)}
					onMutate={() => mutate()}
					onReject={(task) => {
						setSelectedTask(null);
						setRejectTask(task);
					}}
				/>
			)}

			{rejectTask && user && project && (
				<RejectModal
					task={rejectTask}
					members={project.members}
					currentUser={user}
					onClose={() => setRejectTask(null)}
					onMutate={() => mutate()}
				/>
			)}

			{showCreateModal && user && project && (
				<TaskCreateModal
					projectId={project.id}
					members={project.members}
					currentUser={user}
					defaultRequiresSubmission={defaultRequiresSubmission}
					onClose={() => setShowCreateModal(false)}
					onMutate={() => mutate()}
				/>
			)}
		</main>
	);
}