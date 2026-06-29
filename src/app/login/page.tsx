'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, getToken } from '@/lib/auth';

export default function LoginPage() {
	const router = useRouter();

	useEffect(() => {
		const token = getToken();
		if (token) {
			router.replace('/dashboard');
		}
	}, [router]);

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			await login(email, password);
			console.log('login success, redirecting to dashboard');
			router.replace('/dashboard');
		} catch (err: any) {
			console.log('login error:', err);
			setError(err.message ?? 'Something went wrong.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen bg-bg flex items-center justify-center">
			<div className="bg-surface border border-border rounded-xl shadow-md px-10 py-12 w-full max-w-md">
				<h1 className="text-2xl font-semibold text-text m-0">Sign in</h1>
				<p className="text-sm text-muted mt-1 mb-8">Project Dashboard</p>

				<form onSubmit={handleSubmit} className="flex flex-col gap-5">
					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium text-muted" htmlFor="email">
							Email
						</label>
						<input
							id="email"
							type="email"
							className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
							autoFocus
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium text-muted" htmlFor="password">
							Password
						</label>
						<input
							id="password"
							type="password"
							className="text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors"
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
						/>
					</div>

					{error && (
						<p className="text-sm text-danger m-0">{error}</p>
					)}

					<button
						type="submit"
						disabled={loading}
						className="text-sm font-medium text-white bg-accent rounded py-2.5 border-none cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{loading ? 'Signing in...' : 'Sign in'}
					</button>
				</form>
			</div>
		</main>
	);
}