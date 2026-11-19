'use client';

import { useCallback, useState } from 'react';

/**
 * Loading + error state for a one-off async action (submit a form, click a
 * button). Errors are caught and exposed as a message; the promise resolves
 * to true on success so callers can chain follow-ups.
 */
export function useAsyncAction() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const run = useCallback(async (action: () => Promise<unknown>): Promise<boolean> => {
		setLoading(true);
		setError(null);
		try {
			await action();
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Something went wrong.');
			return false;
		} finally {
			setLoading(false);
		}
	}, []);

	return { run, loading, error };
}
