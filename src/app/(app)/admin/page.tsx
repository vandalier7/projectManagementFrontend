'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import MyAccountSection from '@/components/admin/MyAccountSection';

export default function AdminPage() {
	const [user, setUser] = useState<User | null>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		setUser(getUser());
		setLoaded(true);
	}, []);

	if (!loaded) {
		return (
			<div className="flex h-full items-center justify-center text-muted">
				Loading...
			</div>
		);
	}

	if (user?.system_role !== 'admin') {
		return (
			<div className="flex h-full items-center justify-center text-muted">
				You don&apos;t have access to this page.
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<section className="flex flex-col gap-3">
				<h2 className="m-0 text-base font-semibold text-text">My Account</h2>
				<MyAccountSection user={user} onUserUpdated={setUser} />
			</section>
		</div>
	);
}