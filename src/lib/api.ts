import { getToken } from './auth';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Builds headers for every request, attaching the token if one exists.
const buildHeaders = (extra?: HeadersInit): HeadersInit => {
	const token = getToken();

	return {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		...(token ? { 'Authorization': `Bearer ${token}` } : {}),
		...extra,
	};
};

// Wraps fetch with base URL and auth headers.
// Throws on non-2xx responses with the error message from the API.
export const apiClient = async (
	path: string,
	options: RequestInit = {}
): Promise<any> => {
	const res = await fetch(`${apiUrl}${path}`, {
		...options,
		headers: buildHeaders(options.headers),
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ message: 'Request failed.' }));
		throw new Error(err.message ?? 'Request failed.');
	}

	if (res.status === 204) {
		return null;
	}

	return res.json();
};