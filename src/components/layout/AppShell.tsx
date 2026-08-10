'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { mutate } from 'swr';

import Sidebar from './Sidebar';
import AppBar from './AppBar';
import { AppBarActionsProvider, useAppBarActionsValue } from './AppBarActionsContext';

import {
	getToken,
	getUser,
	clearToken,
	clearUser,
	logout,
	type User,
} from '@/lib/auth';

interface AppShellProps {
	children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
	return (
		<AppBarActionsProvider>
			<AppShellLayout>{children}</AppShellLayout>
		</AppBarActionsProvider>
	);
}

function AppShellLayout({ children }: AppShellProps) {
	const router = useRouter();
	const pathname = usePathname();
	const actions = useAppBarActionsValue();

	const [user, setUser] = useState<User | null>(null);
	const [loggingOut, setLoggingOut] = useState(false);

	const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
		if (typeof window === 'undefined') {
			return false;
		}

		return localStorage.getItem('sidebar-collapsed') === 'true';
	});

	// Board routes are /projects/[id], but not /projects or /projects/new
	const isBoardRoute = /^\/projects\/[^/]+$/.test(pathname) && pathname !== '/projects/new';

	const effectiveSidebarCollapsed = isBoardRoute ? true : sidebarCollapsed;

	useEffect(() => {
		const token = getToken();

		if (!token) {
			router.replace('/');
			return;
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

	useEffect(() => {
		localStorage.setItem(
			'sidebar-collapsed',
			String(sidebarCollapsed)
		);
	}, [sidebarCollapsed]);

	const handleLogout = async () => {
		setLoggingOut(true);
		setUser(null);

		await logout();  // clears token, user, and (now properly awaited) SWR cache

		router.replace('/');
	};

	const getPageTitle = () => {
		if (/^\/users\/[^/]+\/edit$/.test(pathname)) {
			return 'Edit User';
		}

		switch (pathname) {
			case '/dashboard':
				return 'Home';

			case '/projects':
				return 'Projects';

			case '/projects/new':
				return 'New Project';

			case '/users/new':
				return 'Add New User';

			case '/users':
				return 'Users';

			case '/admin':
				return 'Admin Account';

			default:
				return 'Project Dashboard';
		}
	};

	return (
		<div className="flex h-screen overflow-hidden bg-bg">
			<Sidebar
				collapsed={effectiveSidebarCollapsed}
				onToggle={() => {
					if (isBoardRoute) return;
					setSidebarCollapsed(prev => !prev);
				}}
			/>

			<div className="flex min-w-0 flex-1 flex-col">
				<AppBar
					title={getPageTitle()}
					actions={actions}
					user={user}
					onLogout={handleLogout}
					loggingOut={loggingOut}
				/>

				<main className="min-w-0 flex-1 overflow-y-auto p-6">
					{children}
				</main>
			</div>
		</div>
	);
}