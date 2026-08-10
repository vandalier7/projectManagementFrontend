'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, getToken } from '@/lib/auth';

export default function LoginPage() {
	const router = useRouter();

	useEffect(() => {
		const token = getToken();
		if (token) {
			router.replace('/');
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
			console.log('login success, redirecting to landing page');
			router.replace('/');
		} catch (err: any) {
			console.log('login error:', err);
			setError(err.message ?? 'Something went wrong.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="flex min-h-screen items-center justify-center bg-bg px-4 py-6">
			<div className="flex w-full max-w-md flex-col items-center">
				<div className="mb-6 flex flex-col items-center gap-2">
					<Image
						src="/logo.png"
						alt="Project Dashboard"
						width={960}
						height={960}
						className="h-[108px] w-[108px] object-contain"
						priority
					/>

					<p className="m-0 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
						Project Management System
					</p>
				</div>

				<div className="w-full min-w-0 rounded-xl border border-border bg-surface px-6 py-8 shadow-md sm:px-10 sm:py-12">
					<h1 className="m-0 text-center text-2xl font-semibold text-text">
						Sign In
					</h1>

					<form onSubmit={handleSubmit} className="mt-8">
						<fieldset
							disabled={loading}
							className="flex flex-col gap-5 disabled:opacity-100"
						>
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="email"
									className="text-sm font-medium text-muted"
								>
									Email
								</label>

								<input
									id="email"
									type="email"
									value={email}
									onChange={e => setEmail(e.target.value)}
									required
									autoFocus
									autoComplete="email"
									autoCapitalize="none"
									spellCheck={false}
									className="w-full min-w-0 rounded border border-border bg-bg px-3 py-2.5 text-base text-text outline-none transition-colors focus:border-accent sm:text-sm"
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="password"
									className="text-sm font-medium text-muted"
								>
									Password
								</label>

								<input
									id="password"
									type="password"
									value={password}
									onChange={e => setPassword(e.target.value)}
									required
									autoComplete="current-password"
									className="w-full min-w-0 rounded border border-border bg-bg px-3 py-2.5 text-base text-text outline-none transition-colors focus:border-accent sm:text-sm"
								/>
							</div>

							{error && (
								<p className="m-0 text-sm text-danger">
									{error}
								</p>
							)}

							<button
								type="submit"
								disabled={loading}
								className="w-full rounded bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
							>
								{loading ? 'Signing in...' : 'Sign In'}
							</button>
						</fieldset>
					</form>
				</div>
			</div>
		</main>
	);
}

