'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { ErrorText } from '@/components/ui/Field';
import { ModalBody, ModalFooter, ModalHeader, ModalOverlay, ModalPanel, ModalTitle } from '@/components/ui/Modal';
import { toDateInputValue } from '@/lib/dates';
import type { AnyTask, ProjectMember } from '@/types';
import { taskApi } from '../api';
import { useAsyncAction } from '../hooks/useAsyncAction';
import AssigneeCombobox from './AssigneeCombobox';
import { SubmissionBadge } from './TaskChips';
import TaskFormFields, { type TaskFormValues } from './TaskFormFields';

interface Props<T extends AnyTask> {
	task: T;
	members: ProjectMember[];
	onClose: () => void;
	/** Receives the task merged with the saved changes, for instant rendering. */
	onSaved: (task: T) => void;
}

export default function TaskEditModal<T extends AnyTask>({ task, members, onClose, onSaved }: Props<T>) {
	const [values, setValues] = useState<TaskFormValues>({
		title: task.title,
		description: task.description ?? '',
		priority: task.priority,
		dueDate: toDateInputValue(task.due_date),
	});
	const [assigneeId, setAssigneeId] = useState<number | null>(task.assignee?.id ?? null);
	const { run, loading, error } = useAsyncAction();

	const handleSave = () =>
		run(async () => {
			const updated = await taskApi.edit(task.id, {
				title: values.title,
				description: values.description || null,
				assigned_to: assigneeId,
				priority: values.priority,
				due_date: values.dueDate || null,
			});

			const assignee = members.find(m => m.user.id === assigneeId);
			onSaved({
				...task,
				...updated,
				assignee: assignee ? { id: assignee.user.id, full_name: assignee.user.full_name } : null,
			} as T);
			onClose();
		});

	return (
		<ModalOverlay onClose={onClose} layer="stacked">
			<ModalPanel className="w-full max-w-2xl">
				<ModalHeader onClose={onClose}>
					<div className="flex items-center gap-2.5 min-w-0 shrink-0">
						<ModalTitle>Edit Task</ModalTitle>
						<SubmissionBadge
							required={task.requires_submission}
							title="Submission requirement cannot be changed after task creation"
						/>
					</div>
					<AssigneeCombobox members={members} value={assigneeId} onChange={setAssigneeId} className="max-w-[200px]" />
				</ModalHeader>

				<ModalBody>
					<TaskFormFields values={values} onChange={patch => setValues(v => ({ ...v, ...patch }))} />
					<ErrorText>{error}</ErrorText>
				</ModalBody>

				<ModalFooter>
					<Button onClick={onClose} disabled={loading}>Cancel</Button>
					<Button variant="primary" onClick={handleSave} disabled={loading || !values.title.trim()}>
						{loading ? 'Saving...' : 'Save Changes'}
					</Button>
				</ModalFooter>
			</ModalPanel>
		</ModalOverlay>
	);
}
