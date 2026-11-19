import type { AnyTask, User } from '@/types';
import { FINISHED_STATUSES, LOCKED_STATUSES } from './display';

/**
 * Which task actions the UI should offer. This mirrors the server's
 * TaskLifecycleEngine so buttons only appear when the action will succeed;
 * the server still enforces every rule.
 */
export interface TaskPermissions {
	canEdit: boolean;
	canDelete: boolean;
	canStart: boolean;
	canSubmit: boolean;
	canTakeBack: boolean;
	canSelfComplete: boolean;
	canReview: boolean;
}

export interface PermissionContext {
	currentUser: User;
	projectLeadId: number | null;
	/** True when looking at an older revision in the history panel — read-only. */
	isViewingPast: boolean;
}

const NONE: TaskPermissions = {
	canEdit: false,
	canDelete: false,
	canStart: false,
	canSubmit: false,
	canTakeBack: false,
	canSelfComplete: false,
	canReview: false,
};

export function getTaskPermissions(task: AnyTask, { currentUser, projectLeadId, isViewingPast }: PermissionContext): TaskPermissions {
	const isAdmin = currentUser.system_role === 'admin';
	const isLead = currentUser.id === projectLeadId;
	const isManager = isAdmin || isLead;
	const isAssignee = task.assignee?.id === currentUser.id;
	const assigneeIsLead = task.assignee != null && task.assignee.id === projectLeadId;

	// Past revisions are closed history: only admins may still edit or delete them.
	if (isViewingPast) {
		return { ...NONE, canEdit: isAdmin, canDelete: isAdmin };
	}

	// Leads can work on a task until it's submitted; after that it's admin-only.
	const editable = isManager && (isAdmin || !LOCKED_STATUSES.includes(task.status));
	const deletable = isManager && (isAdmin || !FINISHED_STATUSES.includes(task.status));
	const reviewerIsInvolved = isLead || isAdmin || assigneeIsLead;

	return {
		canEdit: editable,
		canDelete: deletable,
		canStart: task.status === 'todo' && (isAssignee || !task.assignee),
		canSubmit: isAssignee && task.status === 'in_progress' && task.requires_submission && !reviewerIsInvolved,
		canTakeBack: isAssignee && task.status === 'submitted',
		canSelfComplete: isAssignee && task.status === 'in_progress' && (!task.requires_submission || reviewerIsInvolved),
		canReview: isManager && task.status === 'submitted',
	};
}
