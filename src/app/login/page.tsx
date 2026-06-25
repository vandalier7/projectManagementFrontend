'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
	const router = useRouter();

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
            router.push('/dashboard');
		} catch (err: any) {
            console.log('login error:', err);
			setError(err.message ?? 'Something went wrong.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="loginRoot">
			<div className="loginCard">
				<h1 className="loginTitle">Sign in</h1>
				<p className="loginSub">Project Dashboard</p>

				<form onSubmit={handleSubmit} className="loginForm">
					<div className="fieldGroup">
						<label className="fieldLabel" htmlFor="email">Email</label>
						<input
							id="email"
							type="email"
							className="fieldInput"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
							autoFocus
						/>
					</div>

					<div className="fieldGroup">
						<label className="fieldLabel" htmlFor="password">Password</label>
						<input
							id="password"
							type="password"
							className="fieldInput"
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
						/>
					</div>

					{error && (
						<p className="loginError">{error}</p>
					)}

					<button
						type="submit"
						className="loginBtn"
						disabled={loading}
					>
						{loading ? 'Signing in...' : 'Sign in'}
					</button>
				</form>
			</div>

			<style jsx>{`
				.loginRoot {
					min-height: 100vh;
					background: var(--bg);
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.loginCard {
					background: var(--surface);
					border: 1px solid var(--border);
					border-radius: var(--radius-lg);
					box-shadow: var(--shadow-md);
					padding: 48px 40px;
					width: 100%;
					max-width: 400px;
				}

				.loginTitle {
					font-family: var(--font-ui);
					font-size: 24px;
					font-weight: 600;
					color: var(--text);
					margin: 0;
				}

				.loginSub {
					font-family: var(--font-ui);
					font-size: 14px;
					color: var(--muted);
					margin: 4px 0 32px;
				}

				.loginForm {
					display: flex;
					flex-direction: column;
					gap: 20px;
				}

				.fieldGroup {
					display: flex;
					flex-direction: column;
					gap: 6px;
				}

				.fieldLabel {
					font-family: var(--font-ui);
					font-size: 13px;
					font-weight: 500;
					color: var(--muted);
				}

				.fieldInput {
					font-family: var(--font-ui);
					font-size: 14px;
					color: var(--text);
					background: var(--bg);
					border: 1px solid var(--border);
					border-radius: var(--radius);
					padding: 10px 12px;
					outline: none;
					transition: border-color 150ms ease;
				}

				.fieldInput:focus {
					border-color: var(--accent);
				}

				.loginError {
					font-family: var(--font-ui);
					font-size: 13px;
					color: #D94F4F;
					margin: 0;
				}

				.loginBtn {
					font-family: var(--font-ui);
					font-size: 14px;
					font-weight: 500;
					color: #FFFFFF;
					background: var(--accent);
					border: none;
					border-radius: var(--radius);
					padding: 11px;
					cursor: pointer;
					transition: background 150ms ease;
				}

				.loginBtn:hover:not(:disabled) {
					background: var(--accent-hover);
				}

				.loginBtn:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}
			`}</style>
		</main>
	);
}