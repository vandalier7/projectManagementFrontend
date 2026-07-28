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
} from './AppBarActionsContext';

import { getToken, getUser, type User } from '@/lib/auth';

const DEFAULT_LOGO_URL = '/default-logo.png';

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
		<div className="flex h-screen overflow-hidden bg-bg">
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