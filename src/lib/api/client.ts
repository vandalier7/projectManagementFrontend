import { getToken } from '@/lib/auth';

export class ApiError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Builds headers for every request, attaching the token if one exists.
// Skips Content-Type when the body is FormData — the browser must set
// its own multipart boundary, which it can only do if we don't override it.
const buildHeaders = (extra?: HeadersInit, isFormData = false): HeadersInit => {
	const token = getToken();

	return {
		...(isFormData ? {} : { 'Content-Type': 'application/json' }),
		'Accept': 'application/json',
		...(token ? { 'Authorization': `Bearer ${token}` } : {}),
		...extra,
	};
};

// Wraps fetch with base URL and auth headers.
// Throws on non-2xx responses with the error message from the API.
// Pass the expected response type for a typed result: apiClient<Task>(...).
// The `any` default keeps older untyped call sites compiling; new code should
// always pass T (see the typed wrappers in features/*/api.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiClient = async <T = any>(
	path: string,
	options: RequestInit = {}
): Promise<T> => {
	const isFormData = options.body instanceof FormData;

	const res = await fetch(`${apiUrl}${path}`, {
		...options,
		headers: buildHeaders(options.headers, isFormData),
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ message: 'Request failed.' }));

		throw new ApiError(
			res.status,
			err.message ?? 'Request failed.'
		);
	}

	if (res.status === 204) {
		return null as T;
	}

	return res.json();
};
/** A user-facing message for anything thrown by apiClient (or any error). */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
	return err instanceof Error && err.message ? err.message : fallback;
}
