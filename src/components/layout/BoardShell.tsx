'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import ProjectSidebar from './ProjectSideBar';
import BoardAppBar from './BoardAppBar';
import {
	AppBarActionsProvider,
	useAppBarActionsValue,
	useAppBarTitleValue,
	useAppBarTitleAdornmentValue,
	useAppBarLogoValue, 
	useAppBarThemeColorValue,
} from './AppBarActionsContext';

import { useMemo } from 'react';
import { generateThemeShades, getContrastColor } from '@/lib/generateThemeShades';
import { mixHexColors } from '@/lib/mixHexColors';

import { getToken, getUser, type User } from '@/lib/auth';

const DEFAULT_LOGO_URL = '/default-logo.png';

// Same fixed base colors + tint ratios as ProjectSettingsPage's previewThemeStyle,
// so the shell's wash matches what the settings page previews.
const BASE_SURFACE = '#fff7f2';
const BASE_BORDER = '#E0E0E0';
const SURFACE_TINT_RATIO = 0.08;
const BORDER_TINT_RATIO = 0.18;

interface BoardShellProps {
	children: ReactNode;
}

export default function BoardShell({ children }: BoardShellProps) {
	return (
		<AppBarActionsProvider>
			<BoardShellLayout>{children}</BoardShellLayout>
		</AppBarActionsProvider>
	);
}

function BoardShellLayout({ children }: BoardShellProps) {

	

	const router = useRouter();
	const actions = useAppBarActionsValue();
	const title = useAppBarTitleValue();
	const titleAdornment = useAppBarTitleAdornmentValue();
	const logoUrl = useAppBarLogoValue();
	const themeColor = useAppBarThemeColorValue();

	// Mirrors ProjectSettingsPage's previewThemeStyle: same base colors, same
	// tint ratios. Now applied on the outer wrapper (below) so Sidebar and
	// AppBar both inherit it, not just the main content column.
	const themeStyle = useMemo(() => {
		if (!themeColor) return undefined;

		const shades = generateThemeShades(themeColor);
		const tintedSurface = mixHexColors(BASE_SURFACE, shades.accent, SURFACE_TINT_RATIO);
		const tintedBorder = mixHexColors(BASE_BORDER, shades.accent, BORDER_TINT_RATIO);

		return {
			'--accent': shades.accent,
			'--accent-hover': shades.accentHover,
			'--accent-foreground': getContrastColor(shades.accent),
			'--surface': tintedSurface,
			'--border': tintedBorder,
		} as React.CSSProperties;
	}, [themeColor]);

	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		if (!getToken()) {
			router.replace('/');
		}

		const currentUser = getUser();
				setUser(currentUser);
		
				if (currentUser && !currentUser.profile_completed) {
					router.replace('/complete-profile');
				}
		
				if (currentUser && currentUser.must_change_password) {
					router.replace('/change-password');
				}

	}, [router]);

	return (
		<div className="flex h-screen overflow-hidden bg-bg" style={themeStyle}>
			<ProjectSidebar />

			<div className="flex min-w-0 flex-1 flex-col">
				<BoardAppBar
					title={title ?? 'Loading...'}
					titleAdornment={titleAdornment}
					actions={actions}
					logoUrl={logoUrl} 
				/>

				<main className="min-w-0 flex-1 overflow-y-auto p-6">
					{children}
				</main>
			</div>
		</div>
	);
}