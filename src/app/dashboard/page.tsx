'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser, logout, clearToken, clearUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { mutate } from 'swr';

export default function DashboardPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [loggingOut, setLoggingOut] = useState(false);

	useEffect(() => {
		const token = getToken();
		if (!token) {
			router.replace('/');
			return;
		}
		setUser(getUser());
	}, [router]);

	const handleLogout = () => {
		clearToken();
		clearUser();
		localStorage.removeItem('swr-cache');
		mutate(() => true, undefined, { revalidate: false }); // clears all SWR cache keys
		logout();
		router.replace('/');
	};

	return (
		<main className="min-h-screen bg-bg flex items-center justify-center">
			<div className="bg-surface border border-border rounded-xl shadow-md px-10 py-12 w-full max-w-md flex flex-col gap-8">
				<h1 className="text-2xl font-semibold text-text m-0">Dashboard</h1>

				<div className="flex flex-col gap-3">
					<button
						className="text-sm font-medium text-white bg-accent rounded py-2.5 border-none cursor-pointer transition-colors hover:bg-accent-hover w-full"
						onClick={() => router.push('/projects')}
					>
						View Projects
					</button>

					{user?.system_role === 'admin' && (
						<button
							className="text-sm font-medium text-text bg-surface border border-border rounded py-2.5 cursor-pointer transition-colors hover:bg-bg w-full"
							onClick={() => router.push('/users/new')}
						>
							Add New Member
						</button>
					)}

					<button
						className="text-sm font-medium text-danger bg-surface border border-danger rounded py-2.5 cursor-pointer transition-colors hover:bg-red-50 w-full disabled:opacity-60 disabled:cursor-not-allowed"
						onClick={handleLogout}
						disabled={loggingOut}
					>
						{loggingOut ? 'Logging out...' : 'Log out'}
					</button>
				</div>
			</div>
		</main>
	);
}