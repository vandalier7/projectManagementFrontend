'use client';

import {
	useSetBoardLogo,
	useSetBoardThemeColor,
	useSetBoardTitle,
} from '@/components/layout/AppBarActionsContext';
import type { ApiError } from '@/lib/api';
import type { ProjectSummary } from '@/types';

/**
 * Sets the project board's app bar (title, logo, theme colour) for one of the
 * project's pages. `section` is appended to the title: "Website / Members".
 *
 * Overrides let a page preview unsaved changes (the settings page does this
 * for the logo and theme colour).
 */
export function useProjectBoardChrome(
	project: ProjectSummary | undefined,
	error: ApiError | undefined,
	{
		section,
		logoUrl,
		themeColor,
	}: { section?: string; logoUrl?: string | null; themeColor?: string | null } = {}
) {
	const title = error ? '' : project ? (section ? `${project.name} / ${section}` : project.name) : null;

	useSetBoardTitle(title);
	useSetBoardLogo(error ? null : logoUrl ?? project?.logo_url ?? null);
	useSetBoardThemeColor(error ? null : themeColor ?? project?.theme_color ?? null);
}
