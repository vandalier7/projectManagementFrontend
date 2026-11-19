'use client';

import { ReactNode, useMemo } from 'react';

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

import { buildThemeStyle } from '@/lib/theme/themeStyle';

import { useAuthGuard } from '@/hooks/useAuthGuard';


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

	

	const actions = useAppBarActionsValue();
	const title = useAppBarTitleValue();
	const titleAdornment = useAppBarTitleAdornmentValue();
	const logoUrl = useAppBarLogoValue();
	const themeColor = useAppBarThemeColorValue();

	// Same helper as the settings page preview, applied on the outer wrapper
	// so the sidebar and app bar are themed too.
	const themeStyle = useMemo(() => (themeColor ? buildThemeStyle(themeColor) : undefined), [themeColor]);

	useAuthGuard();

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