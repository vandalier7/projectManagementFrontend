'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

const REQUIRED_EMAIL_DOMAIN = '@g.batstate-u.edu.ph';

export default function NewUserPage() {
	const [email, setEmail] = useState('');
	const [systemRole, setSystemRole] = useState('team_member');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const [credentials, setCredentials] = useState<{
		email: string;
		password: string;
	} | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setError('');

		if (!email.toLowerCase().endsWith(REQUIRED_EMAIL_DOMAIN)) {
			setError(`Email must end with ${REQUIRED_EMAIL_DOMAIN}`);
			return;
		}

		setLoading(true);

		try {
			const response = await apiClient('/users/member', {
				method: 'POST',
				body: JSON.stringify({
					email,
				}),
			});

			setCredentials({
				email: response.user.email,
				password: response.temp_password,
			});
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const openEmail = () => {
		if (!credentials) return;

		const to = encodeURIComponent(credentials.email);
		const subject = encodeURIComponent('Your account credentials');
		const body = encodeURIComponent(
			`Hello,

	Your account has been created.

	Please log in using:

	Email: ${credentials.email}
	Temporary Password: ${credentials.password}

	You will be asked to complete your profile and set a new password after your first login.

	Thank you.`
		);

		window.open(
			`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`,
			'_blank'
		);
	};

	return (
		<div className="flex h-full items-center justify-center">
			<div className="w-full max-w-md rounded-xl border border-border bg-surface p-6">
				{!credentials ? (
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-5"
					>
						<div>
							<h1 className="text-xl font-semibold">
								Generate Account
							</h1>
							<p className="mt-1 text-sm text-muted">
								Create a user account and generate temporary login credentials.
							</p>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium">
								Email
							</label>

							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								pattern={`.+${REQUIRED_EMAIL_DOMAIN.replace('.', '\\.')}$`}
								title={`Email must end with ${REQUIRED_EMAIL_DOMAIN}`}
								className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
								placeholder={`member${REQUIRED_EMAIL_DOMAIN}`}
							/>
							<p className="text-xs text-muted">
								Must be a {REQUIRED_EMAIL_DOMAIN} address.
							</p>
						</div>

						{error && (
							<p className="text-sm text-danger">
								{error}
							</p>
						)}

						<button
							type="submit"
							disabled={loading}
							className="rounded-lg bg-accent py-2.5 text-white font-medium hover:bg-accent-hover disabled:opacity-50"
						>
							{loading ? 'Generating...' : 'Generate Account'}
						</button>
					</form>
				) : (
					<div className="flex flex-col gap-5">
						<div>
							<h1 className="text-xl font-semibold">
								Account Generated
							</h1>

							<p className="mt-1 text-sm text-muted">
								Send these credentials to the user.
							</p>
						</div>

						<div className="rounded-lg bg-bg p-4 text-sm">
							<p>
								<strong>Email:</strong> {credentials.email}
							</p>

							<p>
								<strong>Temporary Password:</strong>{' '}
								{credentials.password}
							</p>
						</div>

						<button
							onClick={openEmail}
							className="rounded-lg bg-accent py-2.5 text-white font-medium hover:bg-accent-hover"
						>
							Email Credentials
						</button>
					</div>
				)}
			</div>
		</div>
	);
}