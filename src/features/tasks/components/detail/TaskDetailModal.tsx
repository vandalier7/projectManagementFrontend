'use client';

import { useState, type ReactNode } from 'react';
import { CloseButton, ModalOverlay } from '@/components/ui/Modal';
import { ErrorText } from '@/components/ui/Field';
import type { AnyTask, User } from '@/types';
import { taskApi, type TransitionInput } from '../../api';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useTaskHistory, type HistorySource } from '../../hooks/useTaskHistory';
import type { PriorityPalette } from '../../lib/display';
import { getTaskPermissions } from '../../lib/permissions';
import { SubmissionBadge } from '../TaskChips';
import RevisionHistoryPanel from './RevisionHistoryPanel';
import TaskActionBar from './TaskActionBar';
import { ReviewComment, SubmissionDetails, SubmissionForm, TaskDescription, TaskMetaGrid } from './TaskDetailSections';

/**
 * Who can edit/delete from this modal:
 *  - 'permissions': whoever the task permissions allow (board)
 *  - 'admin-only':  admins only (system project tasks on the dashboard)
 *  - 'none':        nobody — show `editElsewhere` instead (cross-project dashboard)
 */
export type ManageMode = 'permissions' | 'admin-only' | 'none';

export interface TaskDetailModalProps<T extends AnyTask> {
	task: T;
	currentUser: User;
	projectLeadId: number | null;
	onClose: () => void;
	/** Called after any successful status change. */
	onChanged: () => void;
	/** Called after a successful delete. Defaults to onChanged. */
	onDeleted?: (taskId: number) => void;
	/** Open the edit form. Omit to hide the Edit button. */
	onEdit?: (task: T) => void;
	/** Open the reject form. Omit to hide the Reject button. */
	onReject?: (task: T) => void;

	historySource?: HistorySource;
	manage?: ManageMode;
	palette?: PriorityPalette;
	showSubmissionBadge?: boolean;
	/** Line under the title, e.g. assignee name or a link to the project. */
	subtitle?: (task: T) => ReactNode;
	/** Shown in the footer when manage='none' but the user could edit elsewhere. */
	editElsewhere?: ReactNode;
}

/**
 * Task details with its lifecycle actions (start, submit, take back, review,
 * complete) and revision history. Used by both the project board and the
 * dashboard widgets; props configure the differences.
 */
export default function TaskDetailModal<T extends AnyTask>({
	task,
	currentUser,
	projectLeadId,
	onClose,
	onChanged,
	onDeleted,
	onEdit,
	onReject,
	historySource = 'nested',
	manage = 'permissions',
	palette = 'fixed',
	showSubmissionBadge = true,
	subtitle,
	editElsewhere,
}: TaskDetailModalProps<T>) {
	const [selected, setSelected] = useState<T>(task);
	const [submissionLink, setSubmissionLink] = useState(task.submission_link ?? '');
	const [submissionNotes, setSubmissionNotes] = useState(task.submission_notes ?? '');
	const { run, loading, error } = useAsyncAction();
	const history = useTaskHistory(task, historySource);

	const isViewingPast = selected.id !== task.id;
	const isAdmin = currentUser.system_role === 'admin';
	const base = getTaskPermissions(selected, { currentUser, projectLeadId, isViewingPast });
	const permissions = {
		...base,
		canEdit: manage === 'permissions' ? base.canEdit : manage === 'admin-only' && isAdmin && !isViewingPast,
		canDelete: manage === 'permissions' ? base.canDelete : manage === 'admin-only' && isAdmin && !isViewingPast,
	};
	const showEditElsewhere = manage === 'none' && base.canEdit && !isViewingPast;

	const transition = (input: TransitionInput) =>
		run(async () => {
			await taskApi.transition(selected.id, input);
			onChanged();
			onClose();
		});

	const remove = () => {
		if (!confirm('Delete this task?')) return;
		run(async () => {
			await taskApi.remove(selected.id);
			(onDeleted ?? onChanged)(selected.id);
			onClose();
		});
	};

	const showHistory =
		historySource === 'fetch' || (historySource === 'nested' && history.revisions.length > 0);

	return (
		<ModalOverlay onClose={onClose}>
			<div className="flex items-start gap-4" onClick={e => e.stopPropagation()}>
				{showHistory && (
					<RevisionHistoryPanel
						current={task}
						revisions={history.revisions}
						selectedId={selected.id}
						onSelect={t => setSelected(t as T)}
						loading={history.loading}
						error={history.error}
					/>
				)}

				<div className="bg-surface border border-border rounded-xl shadow-md w-[32rem] shrink-0 max-h-[85vh] flex flex-col overflow-hidden">
					<div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border gap-3">
						<div className="flex flex-col gap-1 min-w-0">
							<div className="flex items-center gap-2 min-w-0">
								<h2 className="text-base font-semibold text-text m-0">{selected.title}</h2>
								{showSubmissionBadge && <SubmissionBadge required={selected.requires_submission} />}
							</div>
							{selected.status !== 'closed' && subtitle?.(selected)}
						</div>
						<CloseButton onClick={onClose} />
					</div>

					<div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
						<TaskMetaGrid task={selected} palette={palette} />
						<TaskDescription html={selected.description} />
						<ReviewComment comment={selected.review_comment} />
						{permissions.canSubmit && (
							<SubmissionForm
								link={submissionLink}
								notes={submissionNotes}
								onLinkChange={setSubmissionLink}
								onNotesChange={setSubmissionNotes}
							/>
						)}
						<SubmissionDetails task={selected} />
						<ErrorText>{error}</ErrorText>
					</div>

					<TaskActionBar
						permissions={permissions}
						busy={loading}
						canSubmitNow={submissionLink.trim() !== ''}
						note={showEditElsewhere ? editElsewhere : undefined}
						handlers={{
							onDelete: remove,
							onEdit: onEdit && (() => onEdit(selected)),
							onReject: onReject && (() => onReject(selected)),
							onApprove: () => transition({ status: 'done' }),
							onTakeBack: () => transition({ status: 'in_progress' }),
							onSubmit: () =>
								transition({
									status: 'submitted',
									submission_link: submissionLink,
									submission_notes: submissionNotes || null,
								}),
							onComplete: () => transition({ status: 'done' }),
							onStart: () => transition({ status: 'in_progress' }),
						}}
					/>
				</div>
			</div>
		</ModalOverlay>
	);
}
