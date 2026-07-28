'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { getToken, getUser, clearToken, clearUser } from '@/lib/auth';

export default function ChangePasswordPage() {
	const router = useRouter();

	useEffect(() => {
		const token = getToken();

		if (!token) {
			router.replace('/');
			return;
		}

		const user = getUser();

		if (user && !user.must_change_password) {
			router.replace('/dashboard');
		}
	}, [router]);

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (password !== confirmPassword) {
			setError('Passwords do not match.');
			return;
		}

		setLoading(true);

		try {
			await apiClient('/profile/change-password', {
				method: 'POST',
				body: JSON.stringify({ password }),
			});

			clearToken();
			clearUser();

			router.replace('/');
		} catch (err: any) {
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
						width={72}
						height={72}
						className="h-[72px] w-[72px] object-contain"
						priority
					/>

					<p className="m-0 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
						Project Management System
					</p>
				</div>

				<div className="w-full min-w-0 rounded-xl border border-border bg-surface px-6 py-8 shadow-md sm:px-10 sm:py-12">
					<h1 className="m-0 text-center text-2xl font-semibold text-text">
						Change Your Password
					</h1>

					<p className="mt-2 text-center text-sm text-muted">
						You must set a new password before continuing.
					</p>

					<form onSubmit={handleSubmit} className="mt-8">
						<fieldset
							disabled={loading}
							className="flex flex-col gap-5 disabled:opacity-100"
						>
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="password"
									className="text-sm font-medium text-muted"
								>
									New Password
								</label>

								<input
									id="password"
									type="password"
									value={password}
									onChange={e => setPassword(e.target.value)}
									required
									autoFocus
									autoComplete="new-password"
									className="w-full min-w-0 rounded border border-border bg-bg px-3 py-2.5 text-base text-text outline-none transition-colors focus:border-accent sm:text-sm"
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="confirmPassword"
									className="text-sm font-medium text-muted"
								>
									Confirm Password
								</label>

								<input
									id="confirmPassword"
									type="password"
									value={confirmPassword}
									onChange={e => setConfirmPassword(e.target.value)}
									required
									autoComplete="new-password"
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
								{loading ? 'Submitting...' : 'Change Password'}
							</button>
						</fieldset>
					</form>
				</div>
			</div>
		</main>
	);
}