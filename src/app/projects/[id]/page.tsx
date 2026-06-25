'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { getToken, getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import TaskModal from '@/components/TaskModal';
import TaskCreateModal from '@/components/TaskCreateModal';

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

const COLUMNS: { key: Task['status']; label: string }[] = [
	{ key: 'todo', label: 'To Do' },
	{ key: 'in_progress', label: 'In Progress' },
	{ key: 'submitted', label: 'Submitted' },
	{ key: 'done', label: 'Done' },
];

export default function ProjectBoardPage() {
	const router = useRouter();
	const params = useParams();
	const projectId = params.id;

	const [user, setUser] = useState<User | null>(null);
	const [hasToken, setHasToken] = useState<boolean | null>(null);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);

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
		hasToken ? `/projects/${projectId}` : null
	);

	const isAdmin = user?.system_role === 'admin';
	const isLead = user?.id === project?.lead_id;
	const canCreateTask = isAdmin || isLead;

	const tasksByStatus = (status: Task['status']) =>
		(project?.tasks ?? []).filter(t => t.status === status);

	const defaultRequiresSubmission =
		project?.task_default_submission_mode === 'no_require' ? false : true;

	return (
		<main className="root">
			<aside className="sidebar">
				{isLoading && <p className="state">Loading...</p>}
				{error && <p className="stateError">{error.message}</p>}
				{project && (
					<>
						<h1 className="projectName">{project.name}</h1>
						<div className="meta">
							<span className={`chip chip--${project.status}`}>
								{project.status}
							</span>
						</div>
						<div className="metaRow">
							<span className="metaLabel">Lead</span>
							<span className="metaValue">
								{project.lead ? project.lead.full_name : '—'}
							</span>
						</div>

						{canCreateTask && (
							<button
								className="newTaskBtn"
								onClick={() => setShowCreateModal(true)}
							>
								+ New Task
							</button>
						)}
					</>
				)}
			</aside>

			<div className="board">
				{COLUMNS.map(col => (
					<div key={col.key} className="column">
						<div className="columnHeader">
							<span className="columnLabel">{col.label}</span>
							<span className="columnCount">
								{tasksByStatus(col.key).length}
							</span>
						</div>

						<div className="cards">
							{tasksByStatus(col.key).map(task => (
								<div
									key={task.id}
									className="card"
									onClick={() => setSelectedTask(task)}
								>
									<div className="cardTop">
										<span className="cardTitle">{task.title}</span>
										{task.requires_submission && (
											<span className="submissionDot" title="Requires submission" />
										)}
									</div>

									<div className="cardMeta">
										<span className={`priority priority--${task.priority}`}>
											{task.priority}
										</span>
										{task.assignee && (
											<span className="assignee">{task.assignee.full_name}</span>
										)}
									</div>

									{task.due_date && (
										<span className="dueDate">{task.due_date}</span>
									)}
								</div>
							))}

							{tasksByStatus(col.key).length === 0 && (
								<p className="empty">No tasks</p>
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
					}}
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

			<style jsx>{`
				.root {
					min-height: 100vh;
					background: var(--bg);
					display: flex;
				}

				.sidebar {
					width: 240px;
					min-width: 240px;
					background: var(--surface);
					border-right: 1px solid var(--border);
					padding: 32px 24px;
					display: flex;
					flex-direction: column;
					gap: 16px;
				}

				.projectName {
					font-family: var(--font-ui);
					font-size: 18px;
					font-weight: 600;
					color: var(--text);
					margin: 0;
				}

				.meta {
					display: flex;
					gap: 8px;
				}

				.metaRow {
					display: flex;
					flex-direction: column;
					gap: 2px;
				}

				.metaLabel {
					font-family: var(--font-ui);
					font-size: 11px;
					color: var(--muted);
					text-transform: uppercase;
					letter-spacing: 0.05em;
				}

				.metaValue {
					font-family: var(--font-ui);
					font-size: 13px;
					color: var(--text);
				}

				.chip {
					font-family: var(--font-mono);
					font-size: 11px;
					letter-spacing: 0.05em;
					padding: 3px 8px;
					border-radius: 4px;
					text-transform: lowercase;
				}

				.chip--active { background: #E8F5E9; color: #2E7D32; }
				.chip--inactive { background: #F5F5F5; color: var(--muted); }
				.chip--archived { background: #F5F5F5; color: var(--muted); }

				.newTaskBtn {
					font-family: var(--font-ui);
					font-size: 13px;
					font-weight: 500;
					color: #FFFFFF;
					background: var(--accent);
					border: none;
					border-radius: var(--radius);
					padding: 9px 16px;
					cursor: pointer;
					transition: background 150ms ease;
					margin-top: 8px;
				}

				.newTaskBtn:hover {
					background: var(--accent-hover);
				}

				.board {
					flex: 1;
					display: flex;
					gap: 16px;
					padding: 32px 24px;
					overflow-x: auto;
					align-items: flex-start;
				}

				.column {
					min-width: 240px;
					width: 240px;
					display: flex;
					flex-direction: column;
					gap: 8px;
				}

				.columnHeader {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 0 4px 8px;
					border-bottom: 1px solid var(--border);
				}

				.columnLabel {
					font-family: var(--font-ui);
					font-size: 13px;
					font-weight: 600;
					color: var(--text);
				}

				.columnCount {
					font-family: var(--font-mono);
					font-size: 11px;
					color: var(--muted);
				}

				.cards {
					display: flex;
					flex-direction: column;
					gap: 8px;
				}

				.card {
					background: var(--surface);
					border: 1px solid var(--border);
					border-radius: var(--radius);
					padding: 12px;
					display: flex;
					flex-direction: column;
					gap: 8px;
					box-shadow: var(--shadow-sm);
					cursor: pointer;
					transition: box-shadow 150ms ease;
				}

				.card:hover {
					box-shadow: var(--shadow-md);
				}

				.cardTop {
					display: flex;
					align-items: flex-start;
					justify-content: space-between;
					gap: 8px;
				}

				.cardTitle {
					font-family: var(--font-ui);
					font-size: 13px;
					font-weight: 500;
					color: var(--text);
					line-height: 1.4;
				}

				.submissionDot {
					width: 8px;
					height: 8px;
					min-width: 8px;
					border-radius: 50%;
					background: var(--accent);
					margin-top: 3px;
				}

				.cardMeta {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 8px;
				}

				.priority {
					font-family: var(--font-mono);
					font-size: 10px;
					letter-spacing: 0.05em;
					padding: 2px 6px;
					border-radius: 4px;
					text-transform: lowercase;
				}

				.priority--high { background: #FDECEA; color: #C62828; }
				.priority--medium { background: #FFF8E1; color: #F57F17; }
				.priority--low { background: #F5F5F5; color: var(--muted); }

				.assignee {
					font-family: var(--font-ui);
					font-size: 11px;
					color: var(--muted);
				}

				.dueDate {
					font-family: var(--font-mono);
					font-size: 11px;
					color: var(--muted);
				}

				.empty {
					font-family: var(--font-ui);
					font-size: 12px;
					color: var(--muted);
					padding: 8px 4px;
					margin: 0;
				}

				.state {
					font-family: var(--font-ui);
					font-size: 13px;
					color: var(--muted);
				}

				.stateError {
					font-family: var(--font-ui);
					font-size: 13px;
					color: #D94F4F;
				}
			`}</style>
		</main>
	);
}