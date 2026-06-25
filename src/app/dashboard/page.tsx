'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, logout } from '@/lib/auth';

export default function DashboardPage() {
	const router = useRouter();

	useEffect(() => {
		const token = getToken();
		if (!token) {
			router.push('/login');
		}
	}, [router]);

	const handleLogout = async () => {
		await logout();
		router.push('/login');
	};

	return (
		<main className="dashRoot">
			<div className="dashCard">
				<h1 className="dashTitle">Dashboard</h1>

				<div className="dashActions">
					<button
						className="dashBtn primary"
						onClick={() => router.push('/projects')}
					>
						View Projects
					</button>

					<button
						className="dashBtn secondary"
						onClick={() => router.push('/users/new')}
					>
						Add New Member
					</button>

					<button
						className="dashBtn danger"
						onClick={handleLogout}
					>
						Log out
					</button>
				</div>
			</div>

			<style jsx>{`
				.dashRoot {
					min-height: 100vh;
					background: var(--bg);
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.dashCard {
					background: var(--surface);
					border: 1px solid var(--border);
					border-radius: var(--radius-lg);
					box-shadow: var(--shadow-md);
					padding: 48px 40px;
					width: 100%;
					max-width: 400px;
					display: flex;
					flex-direction: column;
					gap: 32px;
				}

				.dashTitle {
					font-family: var(--font-ui);
					font-size: 24px;
					font-weight: 600;
					color: var(--text);
					margin: 0;
				}

				.dashActions {
					display: flex;
					flex-direction: column;
					gap: 12px;
				}

				.dashBtn {
					font-family: var(--font-ui);
					font-size: 14px;
					font-weight: 500;
					border-radius: var(--radius);
					padding: 11px;
					cursor: pointer;
					transition: background 150ms ease;
					border: none;
					width: 100%;
				}

				.dashBtn.primary {
					background: var(--accent);
					color: #FFFFFF;
				}

				.dashBtn.primary:hover {
					background: var(--accent-hover);
				}

				.dashBtn.secondary {
					background: var(--surface);
					color: var(--text);
					border: 1px solid var(--border);
				}

				.dashBtn.secondary:hover {
					background: var(--bg);
				}

				.dashBtn.danger {
					background: var(--surface);
					color: #D94F4F;
					border: 1px solid #D94F4F;
				}

				.dashBtn.danger:hover {
					background: #FDF2F2;
				}
			`}</style>
		</main>
	);
}