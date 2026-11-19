'use client';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import MyAccountSection from '@/features/users/components/MyAccountSection';

export default function AdminPage() {
	// Updates automatically when MyAccountSection saves changes.
	const user = useCurrentUser();

	if (!user) {
		return (
			<div className="flex h-full items-center justify-center text-muted">
				Loading...
			</div>
		);
	}

	if (user.system_role !== 'admin') {
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
				<MyAccountSection user={user} />
			</section>
		</div>
	);
}