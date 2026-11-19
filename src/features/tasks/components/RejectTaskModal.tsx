'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { ErrorText, Field, Select, TextArea, TextInput } from '@/components/ui/Field';
import { ModalBody, ModalFooter, ModalHeader, ModalOverlay, ModalPanel, ModalTitle } from '@/components/ui/Modal';
import type { AnyTask, ProjectMember, TaskPriority } from '@/types';
import { taskApi } from '../api';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { PRIORITY_LABEL, PRIORITY_OPTIONS } from '../lib/display';

/**
 * Rejecting a submission closes the task and creates a replacement revision,
 * linked back to it. The lead can adjust the replacement before it's created.
 */
export default function RejectTaskModal({
	task,
	members,
	onClose,
	onRejected,
}: {
	task: AnyTask;
	members: ProjectMember[];
	onClose: () => void;
	onRejected: () => void;
}) {
	const [reviewComment, setReviewComment] = useState('');
	const [title, setTitle] = useState(task.title);
	const [description, setDescription] = useState(task.description ?? '');
	const [assigneeId, setAssigneeId] = useState(task.assignee ? String(task.assignee.id) : '');
	const [priority, setPriority] = useState<TaskPriority>(task.priority);
	const [dueDate, setDueDate] = useState('');
	const { run, loading, error } = useAsyncAction();

	const canSubmit = reviewComment.trim() !== '' && title.trim() !== '';

	const handleReject = () =>
		run(async () => {
			await taskApi.reject(task.id, {
				review_comment: reviewComment,
				new_title: title,
				new_description: description || null,
				new_assigned_to: assigneeId ? Number(assigneeId) : null,
				new_priority: priority,
				new_due_date: dueDate || null,
			});
			onRejected();
			onClose();
		});

	return (
		<ModalOverlay onClose={onClose} layer="stacked">
			<ModalPanel>
				<ModalHeader onClose={onClose}>
					<ModalTitle>Reject Task</ModalTitle>
				</ModalHeader>

				<ModalBody>
					<Field label="Review Comment" required>
						<TextArea
							className="min-h-20"
							placeholder="Explain what needs to be revised"
							value={reviewComment}
							onChange={e => setReviewComment(e.target.value)}
							autoFocus
						/>
					</Field>

					<div className="border-t border-border pt-4 flex flex-col gap-4">
						<p className="text-xs text-muted uppercase tracking-wide m-0">Replacement Task</p>

						<Field label="Title" required>
							<TextInput placeholder="Replacement task title" value={title} onChange={e => setTitle(e.target.value)} />
						</Field>

						<Field label="Description">
							<TextArea className="min-h-16" placeholder="Optional" value={description} onChange={e => setDescription(e.target.value)} />
						</Field>

						<div className="flex gap-4">
							<Field label="Assign to" className="flex-1">
								<Select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
									<option value="">Unassigned</option>
									{members.map(m => (
										<option key={m.user.id} value={m.user.id}>{m.user.full_name}</option>
									))}
								</Select>
							</Field>

							<Field label="Priority" className="flex-1">
								<Select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
									{PRIORITY_OPTIONS.map(p => (
										<option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
									))}
								</Select>
							</Field>
						</div>

						<Field label="Due Date">
							<TextInput type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
						</Field>
					</div>

					<ErrorText>{error}</ErrorText>
				</ModalBody>

				<ModalFooter>
					<Button onClick={onClose} disabled={loading}>Cancel</Button>
					<Button variant="danger" onClick={handleReject} disabled={loading || !canSubmit}>
						{loading ? 'Rejecting...' : 'Reject & Create Revision'}
					</Button>
				</ModalFooter>
			</ModalPanel>
		</ModalOverlay>
	);
}
