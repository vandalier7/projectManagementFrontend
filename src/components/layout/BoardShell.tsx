'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import ProjectSidebar from './ProjectSideBar';
import BoardAppBar from './BoardAppBar';
import {
	AppBarActionsProvider,
	useAppBarActionsValue,
	useAppBarTitleValue,
	useAppBarTitleAdornmentValue,
} from './AppBarActionsContext';

import { getToken } from '@/lib/auth';

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

	useEffect(() => {
		if (!getToken()) {
			router.replace('/');
		}
	}, [router]);

	return (
		<div className="flex h-screen overflow-hidden bg-bg">
			<ProjectSidebar />

			<div className="flex min-w-0 flex-1 flex-col">
				<BoardAppBar
					title={title ?? 'Loading...'}
					titleAdornment={titleAdornment}
					actions={actions}
				/>

				<main className="min-w-0 flex-1 overflow-y-auto p-6">
					{children}
				</main>
			</div>
		</div>
	);
}