'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { useSetBoardState, useSetBoardTitle, useSetBoardThemeColor } from '@/components/layout/AppBarActionsContext';
import { UserMinus, UserPlus } from 'lucide-react';
import AddProjectMemberModal from '@/components/AddProjectMemberModal';
import { useSetAppBarActions, useSetBoardLogo, useBoardState } from '@/components/layout/AppBarActionsContext';
import ProjectGuard from '@/components/feedback/ProjectGuard';

interface ProjectMember {
	id: number;
	user: {
		id: number;
		full_name: string;
		username: string;
		system_role: 'admin' | 'team_member';
		email: string;
		phone: string | null;
		department: string | null;
		avatar_url: string | null;
		profile_completed: boolean;
	};
}

interface Task {
	id: number;
	status: 'todo' | 'in_progress' | 'submitted' | 'done' | 'closed';
	due_date: string | null;
	assignee: { id: number } | null;
}

interface Project {
	id: number;
	name: string;
	lead_id: number;
	members: ProjectMember[];
	tasks: Task[];
	logo_url: string | null;
	theme_color: string | null;
}

interface UserRecord {
	id: number;
	full_name: string;
	username: string;
	system_role: 'admin' | 'team_member';
	email: string;
	phone: string | null;
	department: string | null;
	avatar_url: string | null;
	profile_completed: boolean;
}

function getInitials(name: string): string {
	return name
		.split(' ')
		.map(n => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

function MemberAvatar({ member, large = false }: { member: ProjectMember; large?: boolean }) {
	const [imgError, setImgError] = useState(false);
	const size = large ? 'h-14 w-14 text-base' : 'h-10 w-10 text-sm';

	if (member.user.avatar_url && !imgError) {
		return (
			<img
				src={member.user.avatar_url}
				alt={member.user.full_name}
				onError={() => setImgError(true)}
				className={size + ' rounded-full object-cover shrink-0'}
			/>
		);
	}

	return (
		<div className={size + ' rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold shrink-0'}>
			{getInitials(member.user.full_name)}
		</div>
	);
}

// Numbers only. Column names are shown once in the header row instead of per-card.
function StatPill({ value, color }: { value: number; color: string }) {
	return (
		<div className={'flex items-center justify-center ' + STAT_COL_WIDTH}>
			<span className={'text-base font-semibold ' + color}>{value}</span>
		</div>
	);
}

const STAT_COL_WIDTH = 'w-16';

const STAT_COLUMNS = [
	{ key: 'todo', label: 'To Do' },
	{ key: 'inProgress', label: 'In Progress' },
	{ key: 'submitted', label: 'Submitted' },
	{ key: 'done', label: 'Done' },
	{ key: 'overdue', label: 'Overdue' },
	{ key: 'rate', label: 'Completion' },
];

export default function ProjectMembersPage() {
	const params = useParams();
	const projectId = params.id;

	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [removingId, setRemovingId] = useState<number | null>(null);
	const [showAddMemberModal, setShowAddMemberModal] = useState(false);

	useEffect(() => {
		setCurrentUser(getUser());
	}, []);

	const { data: project, mutate, error, isLoading } = useSWR<Project>(
		currentUser ? `/projects/${projectId}?user=${currentUser.id}` : null
	);

	const { data: users } = useSWR<UserRecord[]>(
		currentUser ? '/users' : null
	);

	useSetBoardTitle(project?.name ? `${project.name} / Members` : null);
	useSetBoardLogo(project?.logo_url ?? null);
	useSetBoardThemeColor(project?.theme_color ?? null);

	const isAdmin = currentUser?.system_role === 'admin';
	const isLead = currentUser?.id === project?.lead_id;
	const canManage = isAdmin || isLead;

	const boardActions =
		project && canManage ? (
			<button
				onClick={() => setShowAddMemberModal(true)}
				className="flex items-center gap-2 rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
			>
				Add Member
			</button>
		) : null;

	useSetAppBarActions(boardActions);

	const leadMember = useMemo(() => {
		if (!project) return null;
		if (!project.members) return null;
		return project.members.find(m => m.user.id === project.lead_id) ?? null;
	}, [project]);

	const nonLeadMembers = useMemo(() => {
		if (!project) return [];
		if (!project.members) return [];
		return project.members.filter(m => m.user.id !== project.lead_id);
	}, [project]);

	// Per-member task stats. Lead excluded.
	const statsByUser = useMemo(() => {
	const map: Record<number, { todo: number; inProgress: number; submitted: number; done: number; overdue: number }> = {};
	if (!project?.tasks) return map;

	for (const task of project.tasks) {
		if (!task.assignee) continue;
		if (task.assignee.id === project.lead_id) continue;

		// 🚫 ignore closed tasks entirely
		if (task.status === 'closed') continue;

		const uid = task.assignee.id;

		if (!map[uid]) {
			map[uid] = { todo: 0, inProgress: 0, submitted: 0, done: 0, overdue: 0 };
		}

		if (task.status === 'todo') map[uid].todo++;
		else if (task.status === 'in_progress') map[uid].inProgress++;
		else if (task.status === 'submitted') map[uid].submitted++;
		else if (task.status === 'done') map[uid].done++;

        const NON_OVERDUE_STATUSES = new Set(['done', 'submitted', 'closed']);

        const isOverdue =
            task.due_date &&
            (() => {
                const due = new Date(task.due_date);
                const now = new Date();

                // normalize both to midnight (local time)
                due.setHours(0, 0, 0, 0);
                now.setHours(0, 0, 0, 0);

                return due < now && !NON_OVERDUE_STATUSES.has(task.status);
            })();

		if (isOverdue) map[uid].overdue++;
	}

	return map;
}, [project?.tasks, project?.lead_id]);

	const handleRemove = async (userId: number) => {
		if (!confirm('Remove this member from the project?')) return;

		setRemovingId(userId);

		try {
			await apiClient(`/projects/${projectId}/members/${userId}`, {
				method: 'DELETE',
			});
			mutate();
		} catch (err: any) {
			alert(err.message);
		} finally {
			setRemovingId(null);
		}
	};

	if (!project) {
		return (
			<ProjectGuard isLoading={isLoading} error={error}>
				<></>
			</ProjectGuard>
		);
	}

	return (
		<ProjectGuard isLoading={isLoading} error={error}>
			<div className="flex flex-col gap-3">
				{leadMember && (
					<div className="flex items-center gap-5 bg-surface border border-border rounded-xl px-6 py-6">
						<MemberAvatar member={leadMember} large />

						<div className="flex flex-col gap-1 min-w-0 w-56 shrink-0">
							<div className="flex items-center gap-2">
								<span className="text-base font-semibold text-text truncate">
									{leadMember.user.full_name}
								</span>
								<span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent/10 text-accent shrink-0">
									Lead
								</span>
							</div>
							{leadMember.user.department && (
								<span className="text-xs text-muted truncate">
									{leadMember.user.department}
								</span>
							)}
						</div>

						<div className="flex flex-col gap-1 min-w-0 flex-1">
							<a
								href={`mailto:${leadMember.user.email}`}
								className="text-sm text-accent hover:underline truncate"
							>
								{leadMember.user.email}
							</a>
							{leadMember.user.phone && (
								<a
									href={`tel:${leadMember.user.phone}`}
									className="text-sm text-muted hover:text-text truncate"
								>
									{leadMember.user.phone}
								</a>
							)}
						</div>

						{canManage && <div className="w-4 shrink-0" />}
					</div>
				)}

				{canManage && nonLeadMembers.length > 0 && (
					<div className="flex items-center gap-4 px-5">
						<div className="w-10 shrink-0" />
						<div className="w-48 shrink-0" />
						<div className="flex-1" />
						<div className="flex items-center gap-5 shrink-0">
							{STAT_COLUMNS.map(col => (
								<span key={col.key} className={'text-xs text-muted font-medium text-center ' + STAT_COL_WIDTH}>
									{col.label}
								</span>
							))}
						</div>
						<div className="w-4 shrink-0" />
					</div>
				)}

				{nonLeadMembers.map(member => {
					const stats = statsByUser[member.user.id] ?? { todo: 0, inProgress: 0, submitted: 0, done: 0, overdue: 0 };
					const total = stats.todo + stats.inProgress + stats.submitted + stats.done;
					const completionRate = total > 0 ? Math.round((stats.done / total) * 100) : 0;

					return (
						<div
							key={member.id}
							className="flex items-center gap-4 bg-surface border border-border rounded-xl px-5 py-4"
						>
							<MemberAvatar member={member} />

							<div className="flex flex-col gap-0.5 min-w-0 w-48 shrink-0">
								<span className="text-sm font-semibold text-text truncate">
									{member.user.full_name}
								</span>
								{member.user.department && (
									<span className="text-xs text-muted truncate">
										{member.user.department}
									</span>
								)}
							</div>

							<div className="flex flex-col gap-0.5 min-w-0 flex-1">
								<a
									href={`mailto:${member.user.email}`}
									className="text-xs text-accent hover:underline truncate"
								>
									{member.user.email}
								</a>
								{member.user.phone && (
									<a
										href={`tel:${member.user.phone}`}
										className="text-xs text-muted hover:text-text truncate"
									>
										{member.user.phone}
									</a>
								)}
							</div>

							{canManage && (
								<div className="flex items-center gap-5 shrink-0">
									<StatPill value={stats.todo} color="text-text" />
									<StatPill value={stats.inProgress} color="text-blue-600" />
									<StatPill value={stats.submitted} color="text-yellow-600" />
									<StatPill value={stats.done} color="text-green-600" />
									<StatPill value={stats.overdue} color={stats.overdue > 0 ? 'text-danger' : 'text-muted'} />
									<div className={'flex items-center justify-center ' + STAT_COL_WIDTH}>
										<span className="text-base font-semibold text-text">{completionRate}%</span>
									</div>
								</div>
							)}

							{canManage && (
								<button
									onClick={() => handleRemove(member.user.id)}
									disabled={removingId === member.id}
									className="shrink-0 text-muted hover:text-danger transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
									title="Remove member"
								>
									<UserMinus className="h-4 w-4" />
								</button>
							)}
						</div>
					);
				})}

				{showAddMemberModal && users && (
					<AddProjectMemberModal
						projectId={String(projectId)}
						users={users}
						members={project.members}
						onClose={() => setShowAddMemberModal(false)}
						onMutate={mutate}
					/>
				)}

				{project.members.length === 0 && (
					<p className="text-sm text-muted">No members yet.</p>
				)}
			</div>
		</ProjectGuard>
	);
}