'use client';

import RichTextEditor from '@/components/ui/RichTextEditor';
import { Field, Select, TextInput } from '@/components/ui/Field';
import type { TaskPriority } from '@/types';
import { PRIORITY_LABEL, PRIORITY_OPTIONS } from '../lib/display';

export interface TaskFormValues {
	title: string;
	description: string;
	priority: TaskPriority;
	dueDate: string;
}

/** Title, description, priority and due date — shared by the create and edit modals. */
export default function TaskFormFields({
	values,
	onChange,
}: {
	values: TaskFormValues;
	onChange: (patch: Partial<TaskFormValues>) => void;
}) {
	return (
		<>
			<Field label="Title">
				<TextInput
					placeholder="Task title"
					value={values.title}
					onChange={e => onChange({ title: e.target.value })}
					autoFocus
				/>
			</Field>

			<Field label="Description">
				<RichTextEditor
					value={values.description}
					onChange={description => onChange({ description })}
					placeholder="Optional description"
					minHeight={100}
				/>
			</Field>

			<div className="flex gap-4">
				<Field label="Priority" className="flex-1">
					<Select value={values.priority} onChange={e => onChange({ priority: e.target.value as TaskPriority })}>
						{PRIORITY_OPTIONS.map(p => (
							<option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
						))}
					</Select>
				</Field>

				<Field label="Due Date" className="flex-1">
					<TextInput type="date" value={values.dueDate} onChange={e => onChange({ dueDate: e.target.value })} />
				</Field>
			</div>
		</>
	);
}
