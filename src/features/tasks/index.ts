// Public surface of the tasks feature. Other features import from here,
// not from the files inside.
export { taskApi, taskKeys } from './api';
export type { CreateTaskInput, EditTaskInput, RejectTaskInput, TransitionInput, TaskRecord } from './api';

export { default as TaskDetailModal } from './components/detail/TaskDetailModal';
export type { ManageMode, TaskDetailModalProps } from './components/detail/TaskDetailModal';
export { default as TaskCreateModal } from './components/TaskCreateModal';
export { default as TaskEditModal } from './components/TaskEditModal';
export { default as RejectTaskModal } from './components/RejectTaskModal';
export { StatusChip, PriorityChip, SubmissionBadge } from './components/TaskChips';

export { getTaskPermissions } from './lib/permissions';
export type { TaskPermissions } from './lib/permissions';
export { flattenRevisionChain } from './lib/revisions';
export * from './lib/display';
