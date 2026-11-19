import type { ReactNode } from 'react';
import Button from '@/components/ui/Button';
import type { TaskPermissions } from '../../lib/permissions';

export interface TaskActionHandlers {
	onDelete: () => void;
	onEdit?: () => void;
	onReject?: () => void;
	onApprove: () => void;
	onTakeBack: () => void;
	onSubmit: () => void;
	onComplete: () => void;
	onStart: () => void;
}

/**
 * Footer buttons for the task detail panel. Shows only what the permissions
 * allow, in a fixed order: destructive on the left, primary action last.
 */
export default function TaskActionBar({
	permissions: p,
	handlers: h,
	busy,
	canSubmitNow,
	note,
}: {
	permissions: TaskPermissions;
	handlers: TaskActionHandlers;
	busy: boolean;
	/** Submission needs a link before the Submit button enables. */
	canSubmitNow: boolean;
	/** Optional hint rendered on the left, e.g. "edit this in the project". */
	note?: ReactNode;
}) {
	return (
		<div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
			{p.canDelete && (
				<Button variant="danger-outline" className="mr-auto" disabled={busy} onClick={h.onDelete}>
					Delete
				</Button>
			)}

			{p.canEdit && h.onEdit && (
				<Button disabled={busy} onClick={h.onEdit}>Edit</Button>
			)}

			{note && <span className="text-xs text-muted mr-auto">{note}</span>}

			{p.canReview && (
				<>
					{h.onReject && <Button disabled={busy} onClick={h.onReject}>Reject</Button>}
					<Button variant="primary" disabled={busy} onClick={h.onApprove}>Approve</Button>
				</>
			)}

			{p.canTakeBack && <Button disabled={busy} onClick={h.onTakeBack}>Take Back</Button>}

			{p.canSubmit && (
				<Button variant="primary" disabled={busy || !canSubmitNow} onClick={h.onSubmit}>Submit</Button>
			)}

			{p.canSelfComplete && <Button variant="primary" disabled={busy} onClick={h.onComplete}>Mark as Done</Button>}

			{p.canStart && <Button variant="primary" disabled={busy} onClick={h.onStart}>Start Working</Button>}
		</div>
	);
}
