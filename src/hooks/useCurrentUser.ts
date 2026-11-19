'use client';

import { useSyncExternalStore } from 'react';
import { getUser, USER_CHANGED_EVENT } from '@/lib/auth';
import type { User } from '@/types';

function subscribe(onChange: () => void) {
	window.addEventListener('storage', onChange);
	window.addEventListener(USER_CHANGED_EVENT, onChange);
	return () => {
		window.removeEventListener('storage', onChange);
		window.removeEventListener(USER_CHANGED_EVENT, onChange);
	};
}

/**
 * The logged-in user from localStorage, kept in sync when it changes (login,
 * logout, profile edits — in this tab or another).
 *
 * Null during server rendering and hydration, so markup matches. Only use
 * this for UI decisions — the API derives identity from the auth token and
 * never trusts a client-sent user id.
 */
export function useCurrentUser(): User | null {
	return useSyncExternalStore(subscribe, getUser, () => null);
}
