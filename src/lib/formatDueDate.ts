export function formatDueDate(dateStr: string): { label: string; urgent: boolean } {
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Due today', urgent: true };
    if (diffDays === 1) return { label: 'Due tomorrow', urgent: false };
    if (diffDays === -1) return { label: 'Due yesterday', urgent: true };
    if (diffDays > 1 && diffDays < 7) return { label: `Due in ${diffDays} days`, urgent: false };
    if (diffDays <= -2 && diffDays > -7) return { label: `Due ${Math.abs(diffDays)} days ago`, urgent: true };
    if (diffDays >= 7) {
        const weeks = Math.floor(diffDays / 7);
        return { label: `Due in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`, urgent: false };
    }
    if (diffDays <= -7) {
        const weeks = Math.floor(Math.abs(diffDays) / 7);
        return { label: `Due ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`, urgent: true };
    }

    return { label: dateStr, urgent: false };
}