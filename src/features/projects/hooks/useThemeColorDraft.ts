'use client';

import { useState } from 'react';
import type { KeyedMutator } from 'swr';
import { apiClient } from '@/lib/api';
import type { Project } from '@/types';

/** Shown in the picker before any colour has been extracted or set. */
export const DEFAULT_THEME_COLOR = '#6366F1';

/**
 * Unsaved theme colour edits. `active` is what previews should show: the
 * pending pick, else the saved colour, else the default.
 */
export function useThemeColorDraft(project: Project | undefined, mutate: KeyedMutator<Project>) {
	const [pending, setPending] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const saved = project?.theme_color ?? DEFAULT_THEME_COLOR;
	const active = pending ?? saved;

	const save = async () => {
		if (!project || pending === null) return;
		setSaving(true);
		setError(null);

		try {
			const updated = await apiClient<Project>(`/projects/${project.id}/theme-color`, {
				method: 'PATCH',
				body: JSON.stringify({ theme_color: pending }),
			});
			// Write the confirmed value straight into the cache before clearing
			// the draft, so the UI never flashes back to the old colour.
			await mutate(prev => (prev ? { ...prev, ...updated } : prev), false);
			setPending(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save theme color.');
		} finally {
			setSaving(false);
		}
	};

	return {
		active,
		hasChange: pending !== null && pending !== saved,
		saving,
		error,
		pick: (color: string) => {
			setError(null);
			setPending(color);
		},
		discard: () => {
			setPending(null);
			setError(null);
		},
		save,
	};
}

export type ThemeColorDraft = ReturnType<typeof useThemeColorDraft>;
