import Cookies from 'js-cookie';
import { mutate } from 'swr';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// --- Token helpers ---

export const getToken = (): string | undefined => {
	return Cookies.get(TOKEN_KEY);
};

export const setToken = (token: string): void => {
	Cookies.set(TOKEN_KEY, token, {
		expires: 7,
		sameSite: 'strict',
	});
};

export const clearToken = (): void => {
	Cookies.remove(TOKEN_KEY);
};

// --- User helpers ---

export const getUser = (): User | null => {
	if (typeof window === 'undefined') return null;
	const raw = localStorage.getItem(USER_KEY);
	return raw ? JSON.parse(raw) : null;
};

export const setUser = (user: User): void => {
	localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearUser = (): void => {
	localStorage.removeItem(USER_KEY);
};

// --- SWR cache helper ---

// SWR's default cache is an in-memory Map, not localStorage — there is no
// 'swr-cache' key to remove. This clears every actual cached key by
// calling the global mutate() with no data and a special clear flag, which
// is SWR's documented way to wipe its entire cache imperatively (used
// outside of any component, e.g. here in a plain auth helper).
const clearSwrCache = (): Promise<void> => {
	return mutate(() => true, undefined, { revalidate: false }).then(() => {});
};

// --- Auth calls ---

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export const login = async (
	email: string,
	password: string
): Promise<{ token: string; user: User }> => {
	const res = await fetch(`${apiUrl}/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	});

	if (!res.ok) {
		const err = await res.json();
		throw new Error(err.message ?? 'Login failed.');
	}

	const data = await res.json();
	await clearSwrCache();   // wait for it to actually finish
	setToken(data.token);
	setUser(data.user);
	return data;
};

export const logout = async (): Promise<void> => {
	const token = getToken();

	if (token) {
		await fetch(`${apiUrl}/logout`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
		});
	}
	await clearSwrCache();
	clearToken();
	clearUser();
};

// --- Types ---

export interface User {
	id: number;
	username: string;
	email: string;
	full_name: string;
	phone: string | null;
	department: string | null;
	system_role: 'admin' | 'team_member';
	status: string;
	avatar_url: string | null;
	profile_completed: boolean;
	must_change_password: boolean;
}