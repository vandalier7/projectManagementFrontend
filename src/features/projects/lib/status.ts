/** Project status chips and the options an admin can pick from. */

export const PROJECT_STATUS_CHIP: Record<string, string> = {
	active: 'bg-green-100 text-green-800',
	on_hold: 'bg-yellow-100 text-yellow-700',
	completed: 'bg-blue-100 text-blue-700',
	inactive: 'bg-gray-100 text-muted',
	archived: 'bg-gray-100 text-muted',
};

export const PROJECT_STATUS_OPTIONS = [
	{ value: 'active', label: 'Active' },
	{ value: 'on_hold', label: 'On Hold' },
	{ value: 'completed', label: 'Completed' },
];
