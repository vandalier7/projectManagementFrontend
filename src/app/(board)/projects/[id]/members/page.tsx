'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { useSetAppBarActions } from '@/components/layout/AppBarActionsContext';
import ProjectGuard from '@/components/feedback/ProjectGuard';
import Button from '@/components/ui/Button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/api';
import AddProjectMemberModal from '@/features/members/components/AddProjectMemberModal';
import { LeadCard, MemberRow, MemberStatsHeader } from '@/features/members/components/MemberCards';
import { EMPTY_STATS, statsByMember } from '@/features/members/lib/memberStats';
import { useProject } from '@/features/projects/hooks/useProject';
import { useProjectBoardChrome } from '@/features/projects/hooks/useProjectBoardChrome';
import type { User } from '@/types';

export default function ProjectMembersPage() {
	const { id } = useParams<{ id: string }>();
	const currentUser = useCurrentUser();
	const { data: project, mutate, error, isLoading } = useProject(currentUser ? id : null);
	const [removingUserId, setRemovingUserId] = useState<number | null>(null);
	const [showAddModal, setShowAddModal] = useState(false);

	const canManage = currentUser != null && (currentUser.system_role === 'admin' || currentUser.id === project?.lead_id);
	// Only needed for the "add member" picker.
	const { data: users } = useSWR<User[]>(canManage ? '/users' : null);

	useProjectBoardChrome(project, error, { section: 'Members' });
	useSetAppBarActions(
		useMemo(
			() =>
				project && canManage ? (
					<Button variant="primary" className="text-accent-foreground" onClick={() => setShowAddModal(true)}>
						Add Member
					</Button>
				) : null,
			[project, canManage]
		)
	);

	const lead = project?.members.find(m => m.user.id === project.lead_id) ?? null;
	const others = project?.members.filter(m => m.user.id !== project.lead_id) ?? [];
	const stats = useMemo(() => (project ? statsByMember(project.tasks, project.lead_id) : {}), [project]);

	const handleRemove = async (userId: number) => {
		if (!confirm('Remove this member from the project?')) return;

		setRemovingUserId(userId);
		try {
			await apiClient(`/projects/${id}/members/${userId}`, { method: 'DELETE' });
			mutate();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Could not remove member.');
		} finally {
			setRemovingUserId(null);
		}
	};

	return (
		<ProjectGuard isLoading={isLoading} error={error}>
			{project && (
				<div className="flex flex-col gap-3">
					{lead && <LeadCard member={lead} reserveActionSpace={canManage} />}

					{canManage && others.length > 0 && <MemberStatsHeader />}

					{others.map(member => (
						<MemberRow
							key={member.id}
							member={member}
							stats={stats[member.user.id] ?? EMPTY_STATS}
							manageable={canManage}
							removing={removingUserId === member.user.id}
							onRemove={() => handleRemove(member.user.id)}
						/>
					))}

					{project.members.length === 0 && <p className="text-sm text-muted">No members yet.</p>}

					{showAddModal && users && (
						<AddProjectMemberModal
							projectId={id}
							users={users}
							members={project.members}
							onClose={() => setShowAddModal(false)}
							onMutate={() => mutate()}
						/>
					)}
				</div>
			)}
		</ProjectGuard>
	);
}
