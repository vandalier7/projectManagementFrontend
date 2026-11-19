'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ErrorText } from '@/components/ui/Field';
import { ModalBody, ModalFooter, ModalHeader, ModalOverlay, ModalPanel, ModalTitle } from '@/components/ui/Modal';
import type { ProjectMember, Task } from '@/types';
import { taskApi } from '../api';
import { useAsyncAction } from '../hooks/useAsyncAction';
import AssigneeCombobox from './AssigneeCombobox';
import { SubmissionBadge } from './TaskChips';
import TaskFormFields, { type TaskFormValues } from './TaskFormFields';

interface Props {
	projectId: number;
	projectLeadId: number;
	members: ProjectMember[];
	defaultRequiresSubmission: boolean;
	/** System project tasks never require submission. */
	isSystemProject?: boolean;
	onClose: () => void;
	/** Receives the created task with its assignee attached, for instant rendering. */
	onCreated: (task: Task) => void;
}

export default function TaskCreateModal({
	projectId,
	projectLeadId,
	members,
	defaultRequiresSubmission,
	isSystemProject = false,
	onClose,
	onCreated,
}: Props) {
	const [values, setValues] = useState<TaskFormValues>({ title: '', description: '', priority: 'medium', dueDate: '' });
	const [assigneeId, setAssigneeId] = useState<number | null>(null);
	const [requiresSubmissionChoice, setRequiresSubmission] = useState(defaultRequiresSubmission);
	const [notifyAll, setNotifyAll] = useState(false);
	const { run, loading, error } = useAsyncAction();

	const assignee = members.find(m => m.user.id === assigneeId) ?? null;

	// Leads and admins review their own work, so submission doesn't apply.
	const submissionFrozen =
		isSystemProject || assignee?.user.id === projectLeadId || assignee?.user.system_role === 'admin';
	const requiresSubmission = submissionFrozen ? false : requiresSubmissionChoice;

	const handleCreate = () =>
		run(async () => {
			const created = await taskApi.create({
				project_id: projectId,
				title: values.title,
				description: values.description || null,
				assigned_to: assigneeId,
				priority: values.priority,
				requires_submission: requiresSubmission,
				due_date: values.dueDate || null,
				notify_all: notifyAll,
			});

			// The API returns the bare row; attach what the UI needs to render it.
			onCreated({
				...created,
				assignee: assignee ? { id: assignee.user.id, full_name: assignee.user.full_name } : null,
				previous_task: null,
			});
			onClose();
		});

	return (
		<ModalOverlay onClose={onClose} dismissible={false}>
			<ModalPanel className="w-full max-w-2xl">
				<ModalHeader onClose={onClose}>
					<div className="flex items-center gap-2.5 min-w-0 shrink-0">
						<ModalTitle>New Task</ModalTitle>
						<SubmissionBadge
							required={requiresSubmission}
							frozen={submissionFrozen}
							onToggle={() => setRequiresSubmission(v => !v)}
							labels={{ on: 'Require Submission', off: 'Require Submission' }}
							title={
								isSystemProject
									? 'Submission is never required for system project tasks'
									: submissionFrozen
										? 'Submission not required for leads and admins'
										: 'Toggle submission requirement'
							}
						/>
					</div>

					<div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-[280px]">
						{assigneeId !== null && (
							<button
								type="button"
								className="shrink-0 inline-flex items-center gap-1 h-7 px-2 rounded border border-border bg-bg text-muted text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors hover:text-text hover:border-accent"
								onClick={() => setNotifyAll(v => !v)}
								title={notifyAll ? 'Notify all project members' : 'Notify assignee only'}
							>
								<Bell size={12} />
								{notifyAll ? 'Everyone' : 'Assignee'}
							</button>
						)}
						<AssigneeCombobox members={members} value={assigneeId} onChange={setAssigneeId} />
					</div>
				</ModalHeader>

				<ModalBody>
					<TaskFormFields values={values} onChange={patch => setValues(v => ({ ...v, ...patch }))} />
					<ErrorText>{error}</ErrorText>
				</ModalBody>

				<ModalFooter>
					<Button onClick={onClose} disabled={loading}>Cancel</Button>
					<Button variant="primary" onClick={handleCreate} disabled={loading || !values.title.trim()}>
						{loading ? 'Creating...' : 'Create Task'}
					</Button>
				</ModalFooter>
			</ModalPanel>
		</ModalOverlay>
	);
}
