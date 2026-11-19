'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { useCurrentUser } from './useCurrentUser';

/**
 * For authenticated layouts: sends visitors without a token to the login
 * page, and users with unfinished account setup to the right step.
 * Returns the current user (null until loaded).
 */
export function useAuthGuard() {
	const router = useRouter();
	const user = useCurrentUser();

	useEffect(() => {
		if (!getToken()) {
			router.replace('/');
		} else if (user && !user.profile_completed) {
			router.replace('/complete-profile');
		} else if (user?.must_change_password) {
			router.replace('/change-password');
		}
	}, [user, router]);

	return user;
}
