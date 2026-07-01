'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { useSetBoardTitle } from '@/components/layout/AppBarActionsContext';
import { UserMinus, UserPlus } from 'lucide-react';
import AddProjectMemberModal from '@/components/AddProjectMemberModal';
import { useSetAppBarActions } from '@/components/layout/AppBarActionsContext';

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
}

function getInitials(name: string): string {
	return name
		.split(' ')
		.map(n => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

function MemberAvatar({ member }: { member: ProjectMember }) {
	const [imgError, setImgError] = useState(false);

	if (member.user.avatar_url && !imgError) {
		return (
			<img
				src={member.user.avatar_url}
				alt={member.user.full_name}
				onError={() => setImgError(true)}
				className="h-10 w-10 rounded-full object-cover shrink-0"
			/>
		);
	}

	return (
		<div className="h-10 w-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-semibold shrink-0">
			{getInitials(member.user.full_name)}
		</div>
	);
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
	return (
		<div className="flex flex-col items-center gap-0.5">
			<span className={`text-base font-semibold ${color}`}>{value}</span>
			<span className="text-xs text-muted">{label}</span>
		</div>
	);
}

export default function ProjectMembersPage() {
	const params = useParams();
	const projectId = params.id;

	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [removingId, setRemovingId] = useState<number | null>(null);

    const [showAddMemberModal, setShowAddMemberModal] = useState(false);

	useEffect(() => {
		setCurrentUser(getUser());
	}, []);

	const { data: project, mutate } = useSWR<Project>(
		currentUser ? `/projects/${projectId}?user=${currentUser.id}` : null
	);

    const { data: users } = useSWR<UserRecord[]>(
        currentUser ? '/users' : null
    );

	useSetBoardTitle(project?.name ?? null);

	const isAdmin = currentUser?.system_role === 'admin';
	const isLead = currentUser?.id === project?.lead_id;
	const canManage = isAdmin || isLead;

    useSetAppBarActions(
        canManage ? (
            <button
                onClick={() => setShowAddMemberModal(true)}
                className="flex items-center gap-2 rounded px-4 bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
                {/* <UserPlus className="h-4 w-4" /> */}
                Add Member
            </button>
        ) : null
    );

	const sortedMembers = useMemo(() => {
		if (!project?.members) return [];
		return [...project.members].sort((a, b) => {
			if (a.user.id === project.lead_id) return -1;
			if (b.user.id === project.lead_id) return 1;
			return 0;
		});
	}, [project?.members, project?.lead_id]);

	// Per-member task stats — lead excluded
	const statsByUser = useMemo(() => {
		if (!project?.tasks) return {};

		const map: Record<number, { todo: number; inProgress: number; submitted: number; done: number; overdue: number }> = {};

		for (const task of project.tasks) {
			if (!task.assignee) continue;
			if (task.assignee.id === project.lead_id) continue;

			const uid = task.assignee.id;
			if (!map[uid]) map[uid] = { todo: 0, inProgress: 0, submitted: 0, done: 0, overdue: 0 };

			if (task.status === 'todo') map[uid].todo++;
			else if (task.status === 'in_progress') map[uid].inProgress++;
			else if (task.status === 'submitted') map[uid].submitted++;
			else if (task.status === 'done') map[uid].done++;

			const isOverdue =
				task.due_date &&
				new Date(task.due_date) < new Date() &&
				!['done', 'closed'].includes(task.status);

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
		return <p className="text-sm text-muted">Loading...</p>;
	}

	return (
		<div className="flex flex-col gap-3">
			{sortedMembers.map(member => {
				const isLead = member.user.id === project.lead_id;
				const stats = statsByUser[member.user.id] ?? { todo: 0, inProgress: 0, submitted: 0, done: 0, overdue: 0 };
				const total = stats.todo + stats.inProgress + stats.submitted + stats.done;
				const completionRate = total > 0 ? Math.round((stats.done / total) * 100) : 0;

				return (
					<div
						key={member.id}
						className="flex items-center gap-4 bg-surface border border-border rounded-xl px-5 py-4"
					>
						<MemberAvatar member={member} />

						{/* Identity */}
						<div className="flex flex-col gap-0.5 min-w-0 w-48 shrink-0">
							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold text-text truncate">
									{member.user.full_name}
								</span>
								{isLead && (
									<span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent/10 text-accent shrink-0">
										Lead
									</span>
								)}
							</div>
							{member.user.department && (
								<span className="text-xs text-muted truncate">
									{member.user.department}
								</span>
							)}
						</div>

						{/* Contacts */}
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

						{/* Stats — lead/admin only, not shown for the lead themselves */}
						{canManage && !isLead && (
							<div className="flex items-center gap-5 shrink-0">
								<StatPill label="To Do" value={stats.todo} color="text-text" />
								<StatPill label="In Progress" value={stats.inProgress} color="text-blue-600" />
								<StatPill label="Submitted" value={stats.submitted} color="text-yellow-600" />
								<StatPill label="Done" value={stats.done} color="text-green-600" />
								<StatPill label="Overdue" value={stats.overdue} color={stats.overdue > 0 ? 'text-danger' : 'text-muted'} />
								<div className="flex flex-col items-center gap-0.5 w-10">
									<span className="text-base font-semibold text-text">{completionRate}%</span>
									<span className="text-xs text-muted">Done</span>
								</div>
							</div>
						)}

						{/* Spacer so remove button stays aligned when stats are hidden (lead row) */}
						{canManage && isLead && <div className="flex-1" />}

						{/* Remove — lead/admin only, can't remove the lead */}
						{canManage && !isLead && (
							<button
								onClick={() => handleRemove(member.user.id)}
								disabled={removingId === member.id}
								className="shrink-0 text-muted hover:text-danger transition-colors disabled:opacity-40"
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
	);
}