/** Shared date helpers. All "day" comparisons use local midnight. */

const DAY_MS = 1000 * 60 * 60 * 24;

function startOfDay(value: string | Date): Date {
	const d = new Date(value);
	d.setHours(0, 0, 0, 0);
	return d;
}

/** Whole days from today until `dateStr` (negative = in the past). */
export function daysUntil(dateStr: string): number {
	return Math.round((startOfDay(dateStr).getTime() - startOfDay(new Date()).getTime()) / DAY_MS);
}

/** Whole days since `dateStr`, never negative. */
export function daysSince(dateStr: string): number {
	return Math.max(0, -daysUntil(dateStr));
}

/** "March 4, 2026" */
export function formatLongDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * The yyyy-mm-dd part of an API date, for <input type="date">. The API sends
 * full ISO timestamps (e.g. 2026-03-04T00:00:00.000000Z), which date inputs
 * can't display.
 */
export function toDateInputValue(dateStr: string | null | undefined): string {
	return dateStr ? dateStr.slice(0, 10) : '';
}

export interface DueLabel {
	label: string;
	urgent: boolean;
}

/** Long form for boards: "Due in 3 days", "Due yesterday", "Due in 2 weeks". */
export function formatDueDate(dateStr: string): DueLabel {
	const diff = daysUntil(dateStr);

	if (diff === 0) return { label: 'Due today', urgent: true };
	if (diff === 1) return { label: 'Due tomorrow', urgent: false };
	if (diff === -1) return { label: 'Due yesterday', urgent: true };
	if (diff > 1 && diff < 7) return { label: `Due in ${diff} days`, urgent: false };
	if (diff < -1 && diff > -7) return { label: `Due ${-diff} days ago`, urgent: true };

	const weeks = Math.floor(Math.abs(diff) / 7);
	const unit = weeks === 1 ? 'week' : 'weeks';
	return diff > 0
		? { label: `Due in ${weeks} ${unit}`, urgent: false }
		: { label: `Due ${weeks} ${unit} ago`, urgent: true };
}

/** Compact form for dashboard widgets: "Overdue", "Today", "3d", "2w". */
export function formatDueShort(dateStr: string | null): DueLabel {
	if (!dateStr) return { label: '', urgent: false };

	const diff = daysUntil(dateStr);
	let label: string;
	if (diff < 0) label = 'Overdue';
	else if (diff === 0) label = 'Today';
	else if (diff < 7) label = `${diff}d`;
	else if (diff < 14) label = '1w';
	else label = `${Math.ceil(diff / 7)}w`;

	return { label, urgent: diff <= 0 };
}
